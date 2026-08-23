import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { updateProfileById, updateProfileByCustomer } from '../stripe-fulfillment-helpers'

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  db: SupabaseClient<any, any, any>
) {
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const userId = session.metadata?.user_id
  const period = (session.metadata?.period as 'month' | 'year' | undefined) ?? 'month'

  const updateData = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    plan: 'premium' as const,
    plan_period: period,
    subscription_status: 'trialing' as const,
    subscription_started_at: new Date().toISOString(),
    trial_ends_at: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
  }

  if (userId) {
    await updateProfileById(userId, updateData)
  } else if (customerId) {
    await updateProfileByCustomer(customerId, updateData)
  }

  // V7 §15 — cross-promo conversion tracking
  const crossPromoSource = session.metadata?.cross_promo_source
  const crossPromoCoupon = session.metadata?.coupon
  if (userId && crossPromoSource && crossPromoCoupon) {
    try {
      const { data: existing } = await db
        .from('cross_promos')
        .select('id')
        .eq('source_app', crossPromoSource)
        .eq('user_id', userId)
        .eq('converted', false)
        .order('clicked_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const now = new Date().toISOString()
      if (existing?.id) {
        await db.from('cross_promos').update({
          converted: true,
          converted_at: now,
          coupon_used: crossPromoCoupon,
          session_id: session.id,
        }).eq('id', existing.id)
      } else {
        await db.from('cross_promos').insert({
          source_app: crossPromoSource,
          target_app: 'vida',
          user_id: userId,
          coupon_used: crossPromoCoupon,
          session_id: session.id,
          converted: true,
          converted_at: now,
        })
      }
    } catch {
      // non-blocking
    }
  }

  // V6 §10 — Prime tranches (phase1: J+0 25€, M+1 25€, M+2 50€)
  if (userId && subscriptionId) {
    const { data: subRow } = await db
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle()

    const now = new Date()
    const tranches = [
      { tranche: 1, amount_cents: 2500, scheduled_for: now.toISOString() },
      { tranche: 2, amount_cents: 2500, scheduled_for: new Date(now.getTime() + 30 * 86400000).toISOString() },
      { tranche: 3, amount_cents: 5000, scheduled_for: new Date(now.getTime() + 60 * 86400000).toISOString() },
    ]
    await db.from('prime_payouts').upsert(
      tranches.map(t => ({ user_id: userId, subscription_id: subRow?.id ?? null, ...t })),
      { onConflict: 'user_id,subscription_id,tranche' }
    )

    // Credit tranche 1 immediately to wallet (points mode: 1pt=0.01€ → 2500 points for 25€)
    const { data: wallet } = await db.from('wallets').select('balance_cents, balance_points').eq('user_id', userId).maybeSingle()
    if (wallet) {
      await db.from('wallets').update({
        balance_cents: (wallet.balance_cents ?? 0) + 2500,
        balance_points: (wallet.balance_points ?? 0) + 2500,
      }).eq('user_id', userId)
    }
    await db.from('prime_payouts').update({ paid: true, paid_at: now.toISOString() })
      .eq('user_id', userId).eq('tranche', 1)
  }
}
