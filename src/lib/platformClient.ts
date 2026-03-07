import { supabase } from './supabaseClient'

type WhereValue = string | number | boolean | { eq: string | number | boolean }
type ListOptions = {
  where?: Record<string, WhereValue>
  orderBy?: Record<string, 'asc' | 'desc'>
  limit?: number
  offset?: number
}

type DbEntityApi = {
  list: (options?: ListOptions) => Promise<any[]>
  get: (id: string) => Promise<any>
  create: (payload: Record<string, unknown>) => Promise<any>
  update: (id: string, payload: Record<string, unknown>) => Promise<any>
  delete: (id: string) => Promise<boolean>
}

type DbClient = {
  userProfiles: DbEntityApi
  rituals: DbEntityApi
  journals: DbEntityApi
  sigils: DbEntityApi
  forumCategories: DbEntityApi
  forumTopics: DbEntityApi
  forumPosts: DbEntityApi
  forumNotifications: DbEntityApi
  forumLikes: DbEntityApi
  forumReports: DbEntityApi
  [key: string]: DbEntityApi
}

const TABLE_MAP: Record<string, string> = {
  userProfiles: 'userProfiles',
  rituals: 'rituals',
  journals: 'journals',
  sigils: 'sigils',
  forumCategories: 'forumCategories',
  forumTopics: 'forumTopics',
  forumPosts: 'forumPosts',
  forumNotifications: 'forumNotifications',
  forumLikes: 'forumLikes',
  forumReports: 'forumReports',
}

const TABLE_FALLBACK_MAP: Record<string, string> = {
  forumCategories: 'forum_categories',
  forumTopics: 'forum_topics',
  forumPosts: 'forum_posts',
  forumNotifications: 'forum_notifications',
  forumLikes: 'forum_likes',
  forumReports: 'forum_reports',
}

const TABLE_SELECTION_CACHE: Record<string, string> = {}
const TABLE_MISSING_CACHE = new Set<string>()

function mapTable(entity: string): string {
  return TABLE_MAP[entity] || entity
}

function isMissingTableError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase()
  return (
    error?.code === 'PGRST205' ||
    error?.status === 404 ||
    message.includes('could not find the table') ||
    message.includes('does not exist')
  )
}

function getTableCandidates(entity: string): string[] {
  const selected = TABLE_SELECTION_CACHE[entity]
  if (selected) return [selected]

  const primary = mapTable(entity)
  const fallback = TABLE_FALLBACK_MAP[entity]
  const unique = [primary, fallback].filter((v, i, arr): v is string => !!v && arr.indexOf(v) === i)
  const filtered = unique.filter((table) => !TABLE_MISSING_CACHE.has(`${entity}:${table}`))

  // If both candidates were marked missing in this runtime, retry the unique set once.
  return filtered.length ? filtered : unique
}

function rememberResolvedTable(entity: string, table: string) {
  TABLE_SELECTION_CACHE[entity] = table
}

function markMissingTable(entity: string, table: string) {
  TABLE_MISSING_CACHE.add(`${entity}:${table}`)
}

async function list(entity: string, options: ListOptions = {}) {
  const candidates = getTableCandidates(entity)
  let lastError: any = null

  for (const table of candidates) {
    let query = supabase.from(table).select('*')

    if (options.where) {
      for (const [field, rawValue] of Object.entries(options.where)) {
        if (rawValue !== null && typeof rawValue === 'object' && 'eq' in rawValue) {
          query = query.eq(field, rawValue.eq)
        } else {
          query = query.eq(field, rawValue as string | number | boolean)
        }
      }
    }

    if (options.orderBy) {
      const [field, direction] = Object.entries(options.orderBy)[0] || []
      if (field) {
        query = query.order(field, { ascending: direction !== 'desc' })
      }
    }

    if (typeof options.limit === 'number') {
      const offset = options.offset || 0
      query = query.range(offset, offset + options.limit - 1)
    }

    const { data, error } = await query
    if (!error) {
      rememberResolvedTable(entity, table)
      return data || []
    }

    lastError = error
    if (isMissingTableError(error)) markMissingTable(entity, table)
    if (!isMissingTableError(error)) throw error
  }

  throw lastError
}

async function get(entity: string, id: string) {
  const candidates = getTableCandidates(entity)
  let lastError: any = null

  for (const table of candidates) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (!error) {
      rememberResolvedTable(entity, table)
      return data
    }

    lastError = error
    if (isMissingTableError(error)) markMissingTable(entity, table)
    if (!isMissingTableError(error)) throw error
  }

  throw lastError
}

async function create(entity: string, payload: Record<string, unknown>) {
  const candidates = getTableCandidates(entity)
  let lastError: any = null

  for (const table of candidates) {
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select('*')
      .maybeSingle()
    if (!error) {
      rememberResolvedTable(entity, table)
      return data
    }

    lastError = error
    if (isMissingTableError(error)) markMissingTable(entity, table)
    if (!isMissingTableError(error)) throw error
  }

  throw lastError
}

async function update(entity: string, id: string, payload: Record<string, unknown>) {
  const candidates = getTableCandidates(entity)
  let lastError: any = null

  for (const table of candidates) {
    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle()
    if (!error) {
      rememberResolvedTable(entity, table)
      return data
    }

    lastError = error
    if (isMissingTableError(error)) markMissingTable(entity, table)
    if (!isMissingTableError(error)) throw error
  }

  throw lastError
}

async function remove(entity: string, id: string) {
  const candidates = getTableCandidates(entity)
  let lastError: any = null

  for (const table of candidates) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
    if (!error) {
      rememberResolvedTable(entity, table)
      return true
    }

    lastError = error
    if (isMissingTableError(error)) markMissingTable(entity, table)
    if (!isMissingTableError(error)) throw error
  }

  throw lastError
}

export const db = new Proxy(
  {},
  {
    get: (_target, entity: string) => ({
      list: (options?: ListOptions) => list(entity, options),
      get: (id: string) => get(entity, id),
      create: (payload: Record<string, unknown>) => create(entity, payload),
      update: (id: string, payload: Record<string, unknown>) => update(entity, id, payload),
      delete: (id: string) => remove(entity, id),
    }),
  }
) as DbClient

export const auth = {
  logout: async () => {
    await supabase.auth.signOut()
  },
  onAuthStateChanged: (cb: (state: { user: unknown | null; isLoading: boolean }) => void) => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      cb({ user: session?.user ?? null, isLoading: false })
    })

    supabase.auth.getSession().then(({ data }) => {
      cb({ user: data.session?.user ?? null, isLoading: false })
    })

    return () => subscription.unsubscribe()
  },
}

export const ai = {
  generateText: async ({ prompt, model = 'gpt-4.1-mini', maxTokens = 600 }: { prompt: string; model?: string; maxTokens?: number }) => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
    if (!apiKey) {
      throw new Error('Missing VITE_OPENROUTER_API_KEY')
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter request failed: ${response.status}`)
    }

    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text || typeof text !== 'string') {
      throw new Error('Empty OpenRouter response')
    }

    return { text }
  },
}
