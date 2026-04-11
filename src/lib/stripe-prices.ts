// VIDA Stripe price IDs
// 1 abonnement: Premium | month | year
// Les IDs réels sont injectés via env vars (préférable) ou créés au premier boot.

export const STRIPE_PRICE_IDS = {
  premium: {
    month: process.env.STRIPE_PRICE_PREMIUM_MONTH ?? '',
    year: process.env.STRIPE_PRICE_PREMIUM_YEAR ?? '',
  },
} as const

export type StripePeriod = 'month' | 'year'

export function getPriceId(period: StripePeriod): string {
  return STRIPE_PRICE_IDS.premium[period]
}
