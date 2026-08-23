// VIDA referral types — parrainage, influenceurs

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
