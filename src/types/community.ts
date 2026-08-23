// VIDA community types — communauté, événements, rituels

export interface Contest {
  id: string
  title: string
  description: string | null
  type: 'weekly' | 'monthly' | 'annual' | 'special'
  prize_pool_cents: number
  prizes_json: unknown[]
  starts_at: string
  ends_at: string
  status: 'upcoming' | 'live' | 'completed'
  winners_count: number
  created_at: string
}

export interface CommunityPost {
  id: string
  user_id: string
  content: string
  media_urls: string[] | null
  type: 'post' | 'victory' | 'encouragement' | 'gratitude' | 'milestone'
  likes_count: number
  comments_count: number
  pinned: boolean
  moderated: boolean
  created_at: string
}

export interface PracticeSession {
  id: string
  creator_id: string
  title: string
  description: string | null
  type: 'solo' | 'group' | 'meetup'
  theme: string | null
  scheduled_at: string
  duration_minutes: number
  max_participants: number
  participants_ids: string[]
  location_label: string | null
  location_lat: number | null
  location_lng: number | null
  created_at: string
}

export interface WeeklyRitual {
  id: string
  theme: 'depollution' | 'peace' | 'love' | 'forgiveness' | 'gratitude' | 'abundance'
  title: string
  description: string | null
  emoji: string | null
  week_number: number
  year: number
  scheduled_at: string
  duration_minutes: number
  participants_count: number
  impact_generated: number
  status: 'upcoming' | 'live' | 'completed'
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  icon: string | null
  action_url: string | null
  read: boolean
  important: boolean
  created_at: string
}
