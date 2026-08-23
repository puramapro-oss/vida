// VIDA user types — profil, impact, historique

import type { ConsciousnessLevel, Plan, PlanPeriod, ReferralTier, Role, SubscriptionStatus, Theme } from './core'

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
