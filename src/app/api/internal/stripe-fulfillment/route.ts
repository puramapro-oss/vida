import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase'
import { updateProfileByCustomer, updateProfileById } from '@/lib/stripe-fulfillment-helpers'
import { handleCheckoutSessionCompleted } from '@/lib/stripe-handlers/checkout-session-completed'
import { handleInvoicePaymentSucceeded } from '@/lib/stripe-handlers/invoice-payment-succeeded'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Auth 1: internal secret (from karma dispatcher)
  const internalSecret = req.headers.get('x-internal-secret')
  if (internalSecret !== process.env.INTERNAL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await req.text()
  const signature = req.headers.get('x-stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  // Auth 2: defense in depth — still verify Stripe signature
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

  // Idempotency — process each event exactly once (unique violation = already done).
  const { error: dupErr } = await db
    .from('stripe_events')
    .insert({ event_id: event.id, type: event.type })
  if (dupErr) {
    if (dupErr.code === '23505') return NextResponse.json({ received: true, duplicate: true })
    return NextResponse.json({ error: 'Erreur idempotence' }, { status: 500 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session, db)
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
        await handleInvoicePaymentSucceeded(invoice, db)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const { data: profile } = await db.from('profiles').select('id').eq('stripe_customer_id', customerId).single()
        if (profile?.id) {
          await db.from('transactions').insert({
            user_id: profile.id,
            type: 'subscription',
            direction: 'in',
            amount_cents: invoice.amount_due ?? 0,
            currency: invoice.currency?.toUpperCase() ?? 'EUR',
            status: 'failed',
            stripe_invoice_id: invoice.id,
          })
          await updateProfileById(profile.id, { subscription_status: 'past_due' })
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const customerId = charge.customer as string
        if (typeof customerId === 'string') {
          const { data: profile } = await db.from('profiles').select('id, subscription_started_at').eq('stripe_customer_id', customerId).single()
          if (profile?.id) {
            const startedAt = profile.subscription_started_at ? new Date(profile.subscription_started_at) : null
            const within30 = startedAt && (Date.now() - startedAt.getTime() < 30 * 86400000)
            // Clawback unpaid prime tranches + deduct paid ones if refund within 30 days
            const { data: paidTranches } = await db.from('prime_payouts')
              .select('id, amount_cents, paid')
              .eq('user_id', profile.id)
            let primeDeducted = 0
            for (const t of paidTranches ?? []) {
              if (t.paid && within30) primeDeducted += t.amount_cents
              await db.from('prime_payouts').update({ clawed_back: true }).eq('id', t.id)
            }
            await db.from('retractions').insert({
              user_id: profile.id,
              app_id: 'vida',
              amount_refunded_cents: charge.amount_refunded ?? 0,
              prime_deducted_cents: primeDeducted,
              processed: true,
              processed_at: new Date().toISOString(),
              reason: charge.refunds?.data?.[0]?.reason ?? null,
            })
            await updateProfileById(profile.id, {
              subscription_status: 'canceled',
              plan: 'free',
              subscription_canceled_at: new Date().toISOString(),
            })
          }
        }
        break
      }
    }
  } catch (err) {
    console.error(`[fulfillment] Erreur traitement ${event.type}:`, err)
    return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
