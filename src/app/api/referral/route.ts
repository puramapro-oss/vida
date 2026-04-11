import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { db: { schema: 'vida_sante' } }
)

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }

  const [{ data: referrals }, { data: commissions }, { data: profile }] = await Promise.all([
    supabase.from('referrals').select('*').eq('referrer_id', userId).order('created_at', { ascending: false }),
    supabase.from('commissions').select('*').eq('referrer_id', userId).order('created_at', { ascending: false }),
    supabase.from('profiles').select('referral_code').eq('id', userId).single(),
  ])

  const totalReferrals = referrals?.length ?? 0
  let tier = 'debutant'
  if (totalReferrals >= 100) tier = 'legende'
  else if (totalReferrals >= 75) tier = 'diamant'
  else if (totalReferrals >= 50) tier = 'platine'
  else if (totalReferrals >= 25) tier = 'or'
  else if (totalReferrals >= 10) tier = 'argent'
  else if (totalReferrals >= 5) tier = 'bronze'

  return NextResponse.json({
    referral_code: profile?.referral_code,
    total_referrals: totalReferrals,
    tier,
    referrals: referrals ?? [],
    commissions: commissions ?? [],
    total_commissions: (commissions ?? []).reduce((sum, c) => sum + Number(c.amount), 0),
  })
}

export async function POST(request: NextRequest) {
  try {
    const { referrer_code, referred_id } = await request.json()
    if (!referrer_code || !referred_id) {
      return NextResponse.json({ error: 'Parametres manquants' }, { status: 400 })
    }

    // Find referrer by code
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referrer_code)
      .single()

    if (!referrer) {
      return NextResponse.json({ error: 'Code de parrainage invalide' }, { status: 404 })
    }

    if (referrer.id === referred_id) {
      return NextResponse.json({ error: 'Auto-parrainage interdit' }, { status: 400 })
    }

    // Create referral
    const { error } = await supabase.from('referrals').insert({
      referrer_id: referrer.id,
      referred_id,
      status: 'active',
    })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Parrainage deja enregistre' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Erreur lors de l enregistrement' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Requete invalide' }, { status: 400 })
  }
}
