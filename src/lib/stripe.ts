import Stripe from 'stripe'

// Lazy init to avoid build-time failures on Vercel
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  }
  return _stripe
}

// VIDA pricing — 1 abonnement
export const VIDA_PLAN = {
  premium: {
    month: { amount_cents: 990, label: '9,90€ / mois' },
    year: { amount_cents: 7990, label: '79,90€ / an', saving: '-33%' },
  },
} as const

export async function createPortalSession(customerId: string, returnUrl: string) {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}
