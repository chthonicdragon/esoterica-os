import { supabase } from '../lib/supabaseClient'

export const profileService = {
  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    const { data: existing } = await supabase
      .from('userProfiles')
      .select('id')
      .eq('userId', userId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('userProfiles')
        .update({ displayName, updatedAt: new Date().toISOString() })
        .eq('userId', userId)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('userProfiles')
        .insert({ userId, displayName, updatedAt: new Date().toISOString() })
      if (error) throw error
    }
  },

  async updateAvatarUrl(userId: string, avatarUrl: string): Promise<void> {
    const { data: existing } = await supabase
      .from('userProfiles')
      .select('id')
      .eq('userId', userId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('userProfiles')
        .update({ avatarUrl, updatedAt: new Date().toISOString() })
        .eq('userId', userId)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('userProfiles')
        .insert({ userId, avatarUrl, updatedAt: new Date().toISOString() })
      if (error) throw error
    }
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`
    await profileService.updateAvatarUrl(userId, publicUrl)
    return publicUrl
  },

  async getAvatarUrl(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('userProfiles')
      .select('avatarUrl')
      .eq('userId', userId)
      .maybeSingle()
    return data?.avatarUrl ?? null
  },

  async getUserCovens(userId: string) {
    const { data, error } = await supabase
      .from('coven_members')
      .select('role, covens(id, name, is_public, leader_id)')
      .eq('user_id', userId)
    if (error) return []
    return (data ?? []).map((row: any) => ({
      role: row.role as string,
      coven: row.covens as { id: string; name: string; is_public: boolean; leader_id: string },
    }))
  },
}
