import { supabase } from './supabaseClient'

type WhereValue = string | number | boolean | { eq: string | number | boolean }
type ListOptions = {
  where?: Record<string, WhereValue>
  orderBy?: Record<string, 'asc' | 'desc'>
  limit?: number
  offset?: number
}

const TABLE_MAP: Record<string, string> = {
  userProfiles: 'userProfiles',
  rituals: 'rituals',
  journals: 'journals',
  sigils: 'sigils',
  forumCategories: 'forum_categories',
  forumTopics: 'forum_topics',
  forumPosts: 'forum_posts',
  forumNotifications: 'forum_notifications',
  forumLikes: 'forum_likes',
  forumReports: 'forum_reports',
}

function mapTable(entity: string): string {
  return TABLE_MAP[entity] || entity
}

async function list(entity: string, options: ListOptions = {}) {
  let query = supabase.from(mapTable(entity)).select('*')

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
  if (error) throw error
  return data || []
}

async function get(entity: string, id: string) {
  const { data, error } = await supabase
    .from(mapTable(entity))
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

async function create(entity: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from(mapTable(entity))
    .insert(payload)
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data
}

async function update(entity: string, id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from(mapTable(entity))
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data
}

async function remove(entity: string, id: string) {
  const { error } = await supabase
    .from(mapTable(entity))
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}

const db = new Proxy(
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
)

const auth = {
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

export const blink = { db, auth }
