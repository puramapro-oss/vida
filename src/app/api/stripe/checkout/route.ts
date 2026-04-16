import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getPriceId } from '@/lib/stripe-prices'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

type PuramaPromo = { coupon?: string; source?: string; expires?: number }

function readPuramaPromo(req: NextRequest): PuramaPromo | null {
  const raw = req.cookies.get('purama_promo')?.value
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as PuramaPromo
    if (parsed.expires && parsed.expires < Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

const CheckoutSchema = z.object({
  period: z.enum(['month', 'year']),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non connecté — connecte-toi pour activer ton abonnement.' }, { status: 401 })
    }

    const body = (await req.json()) as unknown
    const parsed = CheckoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Période invalide. Choisis mensuel ou annuel.' }, { status: 400 })
    }

    const { period } = parsed.data

    const priceId = getPriceId(period)
    if (!priceId) {
      return NextResponse.json(
        { error: 'Configuration Stripe manquante. Contacte le support.' },
        { status: 500 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    const stripe = getStripe()
    const serviceClient = createServiceClient()
    let customerId = profile?.stripe_customer_id as string | null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? profile?.email ?? undefined,
        name: profile?.full_name ?? undefined,
        metadata: { user_id: user.id, app: 'vida' },
      })
      customerId = customer.id

      await serviceClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const origin = req.headers.get('origin') ?? 'https://vida.purama.dev'

    const promo = readPuramaPromo(req)
    const forcedCoupon = promo?.coupon && /^[A-Z0-9_-]{3,32}$/i.test(promo.coupon)
      ? promo.coupon.toUpperCase()
      : null

    const params: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { user_id: user.id, plan: 'premium', period },
      },
      success_url: `${origin}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        plan: 'premium',
        period,
        ...(forcedCoupon ? { coupon: forcedCoupon, cross_promo_source: promo?.source ?? '' } : {}),
      },
    }

    if (forcedCoupon) {
      // Cross-promo: auto-apply coupon, hide promo-code field.
      params.discounts = [{ coupon: forcedCoupon }]
    } else {
      // No forced coupon — allow user to type a code.
      params.allow_promotion_codes = true
    }

    const session = await stripe.checkout.sessions.create(params)

    // Link cross_promos click row → user (pre-conversion).
    if (forcedCoupon && promo?.source) {
      try {
        const service = createServiceClient()
        await service.from('cross_promos').update({
          user_id: user.id,
          session_id: session.id,
        }).eq('source_app', promo.source).is('user_id', null).order('clicked_at', { ascending: false }).limit(1)
      } catch {
        // non-blocking
      }
    }

    const res = NextResponse.json({ url: session.url })

    // Keep cookie for post-conversion webhook match, but mark session id.
    return res
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur paiement'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
