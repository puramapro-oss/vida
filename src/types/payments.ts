// VIDA payments types — transactions, abonnements, retraits

import type { Plan, PlanPeriod, SubscriptionStatus } from './core'

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
