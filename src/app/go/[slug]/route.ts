import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// Purama apps eligible for cross-promo coupon flow.
// If slug matches one of these, treat as cross-promo source → set purama_promo cookie + redirect /signup.
// Otherwise fallback to referral_code lookup in profiles.
const PURAMA_APPS = new Set([
  'midas', 'kash', 'kaia', 'prana', 'sutra', 'akasha',
  'jurispurama', 'compta', 'lumios', 'origin', 'exodus',
  'mana', 'aether', 'lingora', 'moksha', 'adya', 'satya',
  'purama_ai', 'purama-ai', 'vida', 'dona', 'voya',
  'entreprise_pilot', 'entreprise-pilot',
])

const COOKIE_NAME = 'purama_promo'
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7 // 7 days

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await params
  const slug = (rawSlug ?? '').trim().toLowerCase()
  const coupon = req.nextUrl.searchParams.get('coupon')
  const origin = req.nextUrl.origin

  // 1) Cross-promo path — source_app is a known Purama app + optional coupon.
  if (PURAMA_APPS.has(slug)) {
    const targetCoupon = coupon && /^[A-Z0-9_-]{3,32}$/i.test(coupon)
      ? coupon.toUpperCase()
      : 'WELCOME50'

    const payload = { coupon: targetCoupon, source: slug, expires: Date.now() + COOKIE_MAX_AGE_SEC * 1000 }
    const cookieValue = encodeURIComponent(JSON.stringify(payload))

    // Fire-and-forget click tracking (non-blocking).
    try {
      const service = createServiceClient()
      await service.from('cross_promos').insert({
        source_app: slug,
        target_app: 'vida',
        coupon_used: targetCoupon,
        converted: false,
      })
    } catch {
      // swallow — tracking must not block redirect
    }

    const res = NextResponse.redirect(new URL('/signup', origin))
    res.cookies.set(COOKIE_NAME, cookieValue, {
      maxAge: COOKIE_MAX_AGE_SEC,
      path: '/',
      sameSite: 'lax',
      secure: true,
      httpOnly: false,
    })
    return res
  }

  // 2) Referral path — slug matches a profile.referral_code OR influencer slug.
  try {
    const service = createServiceClient()

    const { data: profile } = await service
      .from('profiles')
      .select('id, referral_code')
      .eq('referral_code', slug)
      .maybeSingle()

    if (profile) {
      return NextResponse.redirect(new URL(`/signup?ref=${encodeURIComponent(slug)}`, origin))
    }

    const { data: influencer } = await service
      .from('influencer_profiles')
      .select('user_id, slug')
      .eq('slug', slug)
      .maybeSingle()

    if (influencer) {
      return NextResponse.redirect(new URL(`/signup?ref=${encodeURIComponent(slug)}`, origin))
    }
  } catch {
    // fall through to home
  }

  return NextResponse.redirect(new URL('/', origin))
}
