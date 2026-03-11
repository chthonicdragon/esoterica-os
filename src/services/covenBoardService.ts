import { supabase } from '../lib/supabaseClient'

export interface CovenPost {
  id: string
  coven_id: string
  user_id: string
  display_name: string
  avatar_url: string | null
  content: string
  created_at: string
}

export const covenBoardService = {
  async getPosts(covenId: string): Promise<CovenPost[]> {
    const { data, error } = await supabase
      .from('coven_posts')
      .select('*')
      .eq('coven_id', covenId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async createPost(payload: {
    coven_id: string
    user_id: string
    display_name: string
    avatar_url?: string | null
    content: string
  }): Promise<CovenPost> {
    const { data, error } = await supabase
      .from('coven_posts')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deletePost(postId: string): Promise<void> {
    const { error } = await supabase.from('coven_posts').delete().eq('id', postId)
    if (error) throw error
  },
}
