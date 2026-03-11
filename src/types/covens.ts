export interface Coven {
  id: string
  name: string
  description: string | null
  leader_id: string
  leader_name: string
  is_public: boolean
  created_at: string
}

export interface CovenMember {
  id: string
  coven_id: string
  user_id: string
  display_name: string
  role: 'leader' | 'member'
  joined_at: string
}

export interface CovenJoinRequest {
  id: string
  coven_id: string
  user_id: string
  display_name: string
  message: string | null
  status: 'pending' | 'accepted' | 'rejected'
  requested_at: string
}

export type CovensView = 'list' | 'create' | 'detail'
