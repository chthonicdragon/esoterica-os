/**
 * Bridge module for integrating other features with the Knowledge Graph.
 * Allows Journal, RitualTracker, and other systems to push extracted entities
 * into the shared graph without importing the full KnowledgeGraph page.
 */
import { extractGraph, type GraphData, type Node } from './openRouterService'
import { pushToRemote } from './knowledgeGraphSync'

const STORAGE_KEY = 'esoteric_knowledge_web_v1'

export function loadGraph(): GraphData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { nodes: [], links: [] }
  } catch {
    return { nodes: [], links: [] }
  }
}

function saveGraph(data: GraphData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function similarity(s1: string, s2: string): number {
  const longer = s1.length < s2.length ? s2 : s1
  const shorter = s1.length < s2.length ? s1 : s2
  if (longer.length === 0) return 1
  const costs: number[] = []
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) { costs[j] = j; continue }
      if (j > 0) {
        let nv = costs[j - 1]
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1))
          nv = Math.min(nv, lastValue, costs[j]) + 1
        costs[j - 1] = lastValue
        lastValue = nv
      }
    }
    if (i > 0) costs[shorter.length] = lastValue
  }
  return (longer.length - costs[shorter.length]) / longer.length
}

/** Merge new graph data into the persisted Knowledge Web. Returns count of new nodes added. */
export function mergeIntoGraph(newData: GraphData): number {
  const prev = loadGraph()
  const newNodes = [...prev.nodes]
  const nodeMap = new Map(prev.nodes.map(n => [n.id, n]))
  const nameMap = new Map(prev.nodes.map(n => [n.name.toLowerCase(), n.id]))
  const idMapping: Record<string, string> = {}
  let added = 0

  for (const node of newData.nodes) {
    const lower = node.name.toLowerCase()
    let existingId = nodeMap.has(node.id) ? node.id : nameMap.get(lower)

    if (!existingId) {
      for (const [existingName, id] of nameMap.entries()) {
        if (similarity(lower, existingName) > 0.85) { existingId = id; break }
      }
    }

    if (existingId) {
      idMapping[node.id] = existingId
      const existing = nodeMap.get(existingId)
      if (existing && node.description && (!existing.description || node.description.length > existing.description.length)) {
        existing.description = node.description
      }
    } else {
      newNodes.push(node)
      nodeMap.set(node.id, node)
      nameMap.set(lower, node.id)
      idMapping[node.id] = node.id
      added++
    }
  }

  const existingLinks = new Set(prev.links.map(l => `${l.source}-${l.target}-${l.relation}`))
  const newLinks = [...prev.links]

  for (const link of newData.links) {
    const src = idMapping[link.source] || link.source
    const tgt = idMapping[link.target] || link.target
    if (src === tgt) continue
    const key = `${src}-${tgt}-${link.relation}`
    if (!existingLinks.has(key) && nodeMap.has(src) && nodeMap.has(tgt)) {
      newLinks.push({ ...link, source: src, target: tgt })
      existingLinks.add(key)
    }
  }

  saveGraph({ nodes: newNodes, links: newLinks })
  return added
}

/**
 * Extract entities from text and merge them into the Knowledge Graph.
 * Runs entirely in background — safe to fire-and-forget.
 * Returns: { added: number } or null on failure.
 */
export async function extractAndMerge(
  text: string,
  lang: 'en' | 'ru',
  contextLabel?: string,
  userId?: string,
): Promise<{ added: number } | null> {
  try {
    const existing = loadGraph()
    const data = await extractGraph(text, lang, false, contextLabel || '', existing.nodes)
    if (!data.nodes.length) return { added: 0 }
    const added = mergeIntoGraph(data)
    // Background push to Supabase if userId provided
    if (userId && added > 0) {
      pushToRemote(userId).catch(() => {})
    }
    return { added }
  } catch (e) {
    console.warn('[knowledgeGraphBridge] extraction failed:', e)
    return null
  }
}

/** Get names of all symbols/entities found in the graph, lowercased. Useful for populating Journal.symbols. */
export function extractSymbolNames(data: GraphData): string[] {
  return data.nodes
    .filter(n => ['symbol', 'deity', 'artifact', 'concept', 'spell'].includes(n.type))
    .map(n => n.name)
}
