/**
 * Sync the Knowledge Graph between localStorage and Supabase.
 * Uses a single row per user in the `knowledge_graphs` table.
 *
 * Table DDL (run in Supabase SQL editor):
 *
 *   create table if not exists knowledge_graphs (
 *     id uuid primary key default gen_random_uuid(),
 *     "userId" uuid not null references auth.users(id) on delete cascade,
 *     graph_data jsonb not null default '{"nodes":[],"links":[]}',
 *     updated_at timestamptz not null default now(),
 *     unique("userId")
 *   );
 *   alter table knowledge_graphs enable row level security;
 *   create policy "Users manage own graph" on knowledge_graphs
 *     for all using (auth.uid() = "userId") with check (auth.uid() = "userId");
 */

import { supabase } from '../lib/supabaseClient'
import type { GraphData } from '../services/openRouterService'

const STORAGE_KEY = 'esoteric_knowledge_web_v1'
const SYNC_TS_KEY = 'esoterica_graph_sync_ts'

function loadLocal(): GraphData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { nodes: [], links: [] }
  } catch {
    return { nodes: [], links: [] }
  }
}

function saveLocal(data: GraphData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Pull graph from Supabase. Returns null if no remote row exists. */
async function pullRemote(userId: string): Promise<{ data: GraphData; updatedAt: string } | null> {
  const { data, error } = await supabase
    .from('knowledge_graphs')
    .select('graph_data, updated_at')
    .eq('userId', userId)
    .maybeSingle()

  if (error || !data) return null
  return { data: data.graph_data as GraphData, updatedAt: data.updated_at }
}

/** Push local graph to Supabase (upsert). */
export async function pushToRemote(userId: string, graphData?: GraphData): Promise<boolean> {
  const data = graphData ?? loadLocal()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('knowledge_graphs')
    .upsert(
      { userId, graph_data: data, updated_at: now },
      { onConflict: 'userId' },
    )

  if (error) {
    console.warn('[graphSync] push failed:', error.message)
    return false
  }

  localStorage.setItem(SYNC_TS_KEY, now)
  return true
}

/**
 * Sync strategy (last-write-wins with node-count heuristic):
 * - If no remote → push local
 * - If local empty and remote has data → pull remote
 * - If remote has more nodes → pull remote (user likely logged in from another device)
 * - Otherwise → push local (local is the primary editing surface)
 */
export async function syncGraph(userId: string): Promise<GraphData> {
  const local = loadLocal()

  try {
    const remote = await pullRemote(userId)

    if (!remote) {
      // No remote row — push local data
      if (local.nodes.length > 0) {
        await pushToRemote(userId, local)
      }
      return local
    }

    const localSize = local.nodes.length + local.links.length
    const remoteSize = remote.data.nodes.length + remote.data.links.length

    if (localSize === 0 && remoteSize > 0) {
      // Local is empty, remote has data — use remote
      saveLocal(remote.data)
      return remote.data
    }

    if (remoteSize > localSize) {
      // Remote has more data (e.g. synced from another device)
      saveLocal(remote.data)
      return remote.data
    }

    // Local is authoritative — push to remote
    await pushToRemote(userId, local)
    return local
  } catch (e) {
    console.warn('[graphSync] sync error, using local:', e)
    return local
  }
}
