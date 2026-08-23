// VIDA missions types — missions, complétion, impact

export interface Mission {
  id: string
  title: string
  description: string
  category: 'ecology' | 'human' | 'social' | 'pub_vida' | 'health' | 'community' | 'mind'
  type: 'solo' | 'group' | 'paid' | 'unpaid'
  difficulty: 'easy' | 'medium' | 'hard'
  icon: string | null
  cover_url: string | null
  reward_points: number
  reward_money_cents: number
  reward_tickets: number
  is_paid: boolean
  funder_type: 'vida' | 'partner' | 'sponsor'
  funder_id: string | null
  proof_type: 'photo' | 'photo_gps' | 'qr' | 'file' | 'ai_check' | 'story_share' | 'follow' | 'review'
  max_completions: number
  current_completions: number
  impact_co2_kg: number
  impact_waste_g: number
  impact_water_l: number
  impact_trees: number
  impact_people: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

export interface UserMission {
  id: string
  user_id: string
  mission_id: string
  status: 'active' | 'submitted' | 'verified' | 'rejected'
  proof_url: string | null
  proof_gps_lat: number | null
  proof_gps_lng: number | null
  ai_confidence: number | null
  rejection_reason: string | null
  started_at: string
  completed_at: string | null
  verified_at: string | null
  mission?: Mission
}

export interface ImpactEvent {
  id: string
  user_id: string | null
  mission_id: string | null
  impact_type: 'waste_removal' | 'tree_planted' | 'water_protected' | 'person_helped'
  impact_value: number
  impact_unit: string | null
  location_label: string | null
  location_lat: number | null
  location_lng: number | null
  partner_name: string | null
  proof_photos: string[] | null
  status: 'funded' | 'in_progress' | 'realized'
  realized_at: string | null
  created_at: string
}
