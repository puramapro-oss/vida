import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  const [referrals, earnings, profile] = await Promise.all([
    db.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
    db.from('referral_earnings').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
    db.from('profiles').select('referral_code').eq('id', user.id).maybeSingle(),
  ])
  if (referrals.error || earnings.error || profile.error) {
    return NextResponse.json({ error: 'Le parrainage est indisponible.' }, { status: 503 })
  }

  const totalReferrals = referrals.data.length
  let tier = 'debutant'
  if (totalReferrals >= 100) tier = 'legende'
  else if (totalReferrals >= 75) tier = 'diamant'
  else if (totalReferrals >= 50) tier = 'platine'
  else if (totalReferrals >= 25) tier = 'or'
  else if (totalReferrals >= 10) tier = 'argent'
  else if (totalReferrals >= 5) tier = 'bronze'

  return NextResponse.json({
    referral_code: profile.data?.referral_code,
    total_referrals: totalReferrals,
    tier,
    referrals: referrals.data,
    commissions: earnings.data.map(earning => ({ ...earning, amount: earning.amount_cents / 100 })),
    total_commissions: earnings.data.reduce((sum, earning) => sum + earning.amount_cents, 0) / 100,
  })
}

export async function POST(request: NextRequest) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (typeof body?.referrer_code !== 'string' || !body.referrer_code.trim()) {
    return NextResponse.json({ error: 'Code de parrainage requis.' }, { status: 400 })
  }
  if (body.referred_id != null && body.referred_id !== user.id) {
    return NextResponse.json({ error: 'Ce parrainage concerne uniquement ton compte.' }, { status: 403 })
  }

  const { data, error } = await db.rpc('register_my_referral', { sponsor_code: body.referrer_code.trim() })
  if (error) return NextResponse.json({ error: 'Le parrainage est indisponible.' }, { status: 503 })
  switch (data) {
    case 'created': return NextResponse.json({ success: true })
    case 'already_registered': return NextResponse.json({ error: 'Parrainage deja enregistre' }, { status: 409 })
    case 'self': return NextResponse.json({ error: 'Auto-parrainage interdit' }, { status: 400 })
    case 'invalid_code': return NextResponse.json({ error: 'Code de parrainage invalide' }, { status: 404 })
    default: return NextResponse.json({ error: 'Le parrainage est indisponible.' }, { status: 503 })
  }
}
