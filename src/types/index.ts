// VIDA types — source unique de vérité

export type Plan = 'free' | 'premium'
export type PlanPeriod = 'month' | 'year'
export type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused' | 'half_price'
export type Theme = 'dark' | 'light' | 'oled'
export type ReferralTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend'
export type ConsciousnessLevel = 'seed' | 'sprout' | 'tree' | 'forest' | 'river' | 'ocean' | 'guardian'
export type Role = 'user' | 'admin' | 'super_admin'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  pseudo: string | null
  bio: string | null

  language: string
  country: string | null
  timezone: string

  vida_level: number
  vida_xp: number
  vida_energy: number
  consciousness_level: ConsciousnessLevel
  impact_score: number

  onboarding_completed: boolean
  onboarding_objective: string | null
  onboarding_interest: string | null
  onboarding_rhythm: string | null
  preferences_json: Record<string, unknown>
  rhythm_data: Record<string, unknown>

  plan: Plan
  plan_period: PlanPeriod | null
  subscription_status: SubscriptionStatus
  trial_ends_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_started_at: string | null
  subscription_canceled_at: string | null
  half_price_lifetime: boolean

  role: Role
  streak_count: number
  last_streak_at: string | null
  tutorial_completed: boolean
  intro_seen: boolean

  vida_points: number
  lifetime_points: number
  wallet_balance: number
  pending_earnings: number

  daily_ai_messages: number
  daily_missions: number

  referral_code: string | null
  referred_by: string | null
  referral_tier: ReferralTier

  theme: Theme
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface UserImpact {
  user_id: string
  total_co2_saved_kg: number
  total_waste_removed_g: number
  total_water_protected_l: number
  total_trees_funded: number
  total_people_helped: number
  total_missions_completed: number
  total_actions: number
  first_action_at: string | null
  last_action_at: string | null
  updated_at: string
}

export interface LifeThreadEntry {
  id: string
  user_id: string
  app_slug: string
  action_type: 'mission' | 'ritual' | 'chat' | 'donation' | 'purchase' | 'impact' | 'achievement'
  title: string
  description: string | null
  icon: string | null
  impact_units: number
  xp_earned: number
  points_earned: number
  metadata_json: Record<string, unknown>
  created_at: string
}

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

export interface Transaction {
  id: string
  user_id: string | null
  type: 'subscription' | 'purchase' | 'commission' | 'cashback' | 'reward' | 'donation' | 'withdrawal'
  direction: 'in' | 'out'
  amount_cents: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'
  stripe_payment_intent: string | null
  stripe_invoice_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface PointTransaction {
  id: string
  user_id: string
  amount: number
  balance_after: number
  type: 'earn' | 'spend' | 'convert'
  source: string
  reference_id: string | null
  description: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  plan: Plan
  period: PlanPeriod
  amount_cents: number
  status: SubscriptionStatus
  trial_started_at: string | null
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
  half_price_offered: boolean
  half_price_accepted: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  code: string
  status: 'pending' | 'active' | 'churned'
  first_payment_commission_cents: number
  recurring_commission_rate: number
  first_payment_commission_rate: number
  created_at: string
  activated_at: string | null
}

export interface ReferralEarning {
  id: string
  referral_id: string
  referrer_id: string
  amount_cents: number
  source: 'first_payment' | 'recurring'
  period: string | null
  paid: boolean
  created_at: string
}

export interface InfluencerProfile {
  id: string
  user_id: string
  slug: string
  bio: string | null
  social_links: Record<string, string>
  approved: boolean
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend'
  promo_percent: number
  promo_code_active: boolean
  promo_expires_at: string | null
  commission_rate_first: number
  commission_rate_recurring: number
  total_clicks: number
  total_signups: number
  total_conversions: number
  total_earned_cents: number
  kit_downloaded: boolean
  created_at: string
}

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

export interface Donation {
  id: string
  user_id: string | null
  amount_cents: number
  destination: 'association_vida' | 'ecology' | 'social'
  stripe_payment_intent: string | null
  rewards_json: Record<string, unknown>
  contest_tickets_earned: number
  points_earned: number
  message: string | null
  anonymous: boolean
  status: 'pending' | 'succeeded' | 'failed'
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

export interface Product {
  id: string
  slug: string
  name: string
  description: string | null
  long_description: string | null
  image_urls: string[] | null
  price_cents: number
  subscriber_discount_percent: number
  cashback_points: number
  stock: number
  category: string | null
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  user_id: string | null
  items_json: Array<{ product_id: string; quantity: number; price_cents: number }>
  subtotal_cents: number
  discount_cents: number
  total_cents: number
  cashback_points: number
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'canceled'
  shipping_address: Record<string, unknown> | null
  stripe_payment_intent: string | null
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string | null
  context: 'dashboard' | 'missions' | 'coach' | 'general' | null
  is_favorite: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens_used: number | null
  created_at: string
}

export interface Withdrawal {
  id: string
  user_id: string
  amount_cents: number
  iban: string
  bic: string | null
  full_name: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  reject_reason: string | null
  requested_at: string
  processed_at: string | null
}

export interface FaqArticle {
  id: string
  category: string
  question: string
  answer: string
  search_keywords: string[] | null
  view_count: number
  helpful_count: number
  display_order: number
  created_at: string
}

export interface ContactMessage {
  name: string
  email: string
  subject: string
  message: string
}
