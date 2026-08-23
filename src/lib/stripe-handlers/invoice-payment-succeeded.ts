import type Stripe from 'stripe'
import { distributeToPool } from '../stripe-fulfillment-helpers'
import { ASSO_PERCENTAGE, REWARD_POOL_PERCENTAGE } from '../constants'
import { createServiceClient } from '../supabase'

export async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  db: ReturnType<typeof createServiceClient>
) {
  const customerId = invoice.customer as string
  const amountCents = invoice.amount_paid ?? 0

  const { data: profile } = await db
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profile?.id) {
    await db.from('transactions').insert({
      user_id: profile.id,
      type: 'subscription',
      direction: 'in',
      amount_cents: amountCents,
      currency: invoice.currency?.toUpperCase() ?? 'EUR',
      status: 'succeeded',
      stripe_invoice_id: invoice.id,
    })

    // Distribute to pools: 10% reward, 10% asso
    const rewardCents = Math.floor(amountCents * REWARD_POOL_PERCENTAGE / 100)
    const assoCents = Math.floor(amountCents * ASSO_PERCENTAGE / 100)
    await distributeToPool('reward', rewardCents, 'ca_10pct', invoice.id ?? '')
    await distributeToPool('asso', assoCents, 'ca_10pct', invoice.id ?? '')

    // Commission de parrainage — taux déjà résolus par ligne (schéma
    // referrals.first_payment_commission_rate=0.50/recurring_commission_rate=0.10,
    // pas inventés ici). status='pending' = pas encore de commission versée →
    // ce paiement est le 1er ; sinon récurrent.
    const { data: referral } = await db
      .from('referrals')
      .select('id, referrer_id, status, first_payment_commission_rate, recurring_commission_rate')
      .eq('referred_id', profile.id)
      .maybeSingle()

    if (referral && referral.status !== 'churned') {
      const isFirst = referral.status === 'pending'
      const rate = Number(isFirst ? referral.first_payment_commission_rate : referral.recurring_commission_rate)
      const commissionCents = Math.floor(amountCents * rate)

      if (commissionCents > 0) {
        if (isFirst) {
          // Verrou atomique anti double-crédit : seule la requête qui bascule
          // pending→active insère la commission 1er paiement.
          const { data: activated } = await db
            .from('referrals')
            .update({
              status: 'active',
              activated_at: new Date().toISOString(),
              first_payment_commission_cents: commissionCents,
            })
            .eq('id', referral.id)
            .eq('status', 'pending')
            .select('id')
            .maybeSingle()

          if (activated) {
            await db.from('referral_earnings').insert({
              referral_id: referral.id,
              referrer_id: referral.referrer_id,
              amount_cents: commissionCents,
              source: 'first_payment',
              paid: false,
            })
          }
        } else {
          // Récurrent : protégé par l'idempotence globale sur event.id
          // (insert stripe_events en tête de handler) — un même paiement
          // Stripe n'atteint jamais ce code 2 fois.
          await db.from('referral_earnings').insert({
            referral_id: referral.id,
            referrer_id: referral.referrer_id,
            amount_cents: commissionCents,
            source: 'recurring',
            period: new Date().toISOString().slice(0, 10),
            paid: false,
          })
        }
      }
    }
  }
}
