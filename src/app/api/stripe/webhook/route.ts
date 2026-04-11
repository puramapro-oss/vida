import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase'
import { ASSO_PERCENTAGE, REWARD_POOL_PERCENTAGE } from '@/lib/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function updateProfileByCustomer(customerId: string, data: Record<string, unknown>) {
  const db = createServiceClient()
  await db.from('profiles').update(data).eq('stripe_customer_id', customerId)
}

async function updateProfileById(userId: string, data: Record<string, unknown>) {
  const db = createServiceClient()
  await db.from('profiles').update(data).eq('id', userId)
}

async function distributeToPool(poolType: 'reward' | 'asso', amountCents: number, reason: string, referenceId: string) {
  const db = createServiceClient()
  const { data: pool } = await db
    .from('pool_balances')
    .select('balance_cents, total_in_cents')
    .eq('pool_type', poolType)
    .single()

  const newBalance = (pool?.balance_cents ?? 0) + amountCents
  const newTotalIn = (pool?.total_in_cents ?? 0) + amountCents

  await db
    .from('pool_balances')
    .update({ balance_cents: newBalance, total_in_cents: newTotalIn, updated_at: new Date().toISOString() })
    .eq('pool_type', poolType)

  await db.from('pool_transactions').insert({
    pool_type: poolType,
    amount_cents: amountCents,
    direction: 'in',
    reason,
    reference_id: referenceId,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const db = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
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
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const status = subscription.status

        const normalized: 'none' | 'trialing' | 'active' | 'past_due' | 'canceled' =
          status === 'trialing' ? 'trialing'
          : status === 'active' ? 'active'
          : status === 'past_due' ? 'past_due'
          : status === 'canceled' ? 'canceled'
          : 'none'

        await updateProfileByCustomer(customerId, {
          stripe_subscription_id: subscription.id,
          subscription_status: normalized,
          plan: normalized === 'canceled' ? 'free' : 'premium',
        })

        await db.from('subscriptions').upsert({
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          status: normalized,
          plan: 'premium',
          period: (subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'year' : 'month'),
          amount_cents: subscription.items.data[0]?.price?.unit_amount ?? 0,
          current_period_start: subscription.items.data[0]?.current_period_start ? new Date(subscription.items.data[0].current_period_start * 1000).toISOString() : null,
          current_period_end: subscription.items.data[0]?.current_period_end ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString() : null,
        }, { onConflict: 'stripe_subscription_id' })

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await updateProfileByCustomer(customerId, {
          subscription_status: 'canceled',
          plan: 'free',
          subscription_canceled_at: new Date().toISOString(),
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
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
        }
        break
      }
    }
  } catch {
    // swallow errors to avoid Stripe retry loops on non-recoverable issues
  }

  return NextResponse.json({ received: true })
}
