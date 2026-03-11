import { supabase } from '../lib/supabaseClient'
import type { Coven, CovenMember, CovenJoinRequest } from '../types/covens'

export const covensService = {
  async listCovens(publicOnly = false): Promise<Coven[]> {
    let query = supabase.from('covens').select('*').order('created_at', { ascending: false })
    if (publicOnly) query = query.eq('is_public', true)
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async getCoven(id: string): Promise<Coven | null> {
    const { data, error } = await supabase
      .from('covens')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async createCoven(payload: {
    name: string
    description: string
    is_public: boolean
    leader_id: string
    leader_name: string
  }): Promise<Coven> {
    const { data, error } = await supabase.from('covens').insert(payload).select().single()
    if (error) throw error
    return data
  },

  async updateCoven(id: string, payload: Partial<Pick<Coven, 'name' | 'description' | 'is_public'>>): Promise<void> {
    const { error } = await supabase.from('covens').update(payload).eq('id', id)
    if (error) throw error
  },

  async deleteCoven(id: string): Promise<void> {
    const { error } = await supabase.from('covens').delete().eq('id', id)
    if (error) throw error
  },

  async getMembers(covenId: string): Promise<CovenMember[]> {
    const { data, error } = await supabase
      .from('coven_members')
      .select('*')
      .eq('coven_id', covenId)
      .order('joined_at', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async addMember(payload: {
    coven_id: string
    user_id: string
    display_name: string
    role?: 'leader' | 'member'
  }): Promise<CovenMember> {
    const { data, error } = await supabase
      .from('coven_members')
      .insert({ role: 'member', ...payload })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase.from('coven_members').delete().eq('id', memberId)
    if (error) throw error
  },

  async getJoinRequests(covenId: string, status: 'pending' | 'accepted' | 'rejected' = 'pending'): Promise<CovenJoinRequest[]> {
    const { data, error } = await supabase
      .from('coven_join_requests')
      .select('*')
      .eq('coven_id', covenId)
      .eq('status', status)
      .order('requested_at', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async getUserJoinRequest(covenId: string, userId: string): Promise<CovenJoinRequest | null> {
    const { data, error } = await supabase
      .from('coven_join_requests')
      .select('*')
      .eq('coven_id', covenId)
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async submitJoinRequest(payload: {
    coven_id: string
    user_id: string
    display_name: string
    message?: string
  }): Promise<CovenJoinRequest> {
    const { data, error } = await supabase
      .from('coven_join_requests')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async cancelJoinRequest(requestId: string): Promise<void> {
    const { error } = await supabase.from('coven_join_requests').delete().eq('id', requestId)
    if (error) throw error
  },

  async approveRequest(request: CovenJoinRequest): Promise<void> {
    const { error: reqErr } = await supabase
      .from('coven_join_requests')
      .update({ status: 'accepted' })
      .eq('id', request.id)
    if (reqErr) throw reqErr

    const { error: memberErr } = await supabase.from('coven_members').upsert({
      coven_id: request.coven_id,
      user_id: request.user_id,
      display_name: request.display_name,
      role: 'member',
    })
    if (memberErr) throw memberErr
  },

  async rejectRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from('coven_join_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
    if (error) throw error
  },

  async isMember(covenId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('coven_members')
      .select('id')
      .eq('coven_id', covenId)
      .eq('user_id', userId)
      .maybeSingle()
    return !!data
  },
}
