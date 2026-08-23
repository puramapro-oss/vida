/**
 * GET /api/legal/my-data — export complet des données personnelles au format JSON
 * (droit à la portabilité, art. 20 RGPD ; page « Ma mémoire »). Lit RÉELLEMENT les tables,
 * jamais un stub `{success:true}` (corrige CONFORMITE.md Gap #3 — dossier vide, 404 en prod).
 *
 * Adapté depuis packages/legal/src/api/my-data.ts. EXTRA_TABLES liste chaque table métier
 * VIDA contenant des données personnelles (cf schema.sql), chacune filtrée par sa colonne
 * user_id/referrer_id.
 */
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { enforceRateLimit } from '@/lib/rate-limit'

const EXTRA_TABLES: Array<{ table: string; userIdColumn: string }> = [
  { table: 'conversations', userIdColumn: 'user_id' },
  { table: 'transactions', userIdColumn: 'user_id' },
  { table: 'withdrawals', userIdColumn: 'user_id' },
  { table: 'point_transactions', userIdColumn: 'user_id' },
  { table: 'user_missions', userIdColumn: 'user_id' },
  { table: 'donations', userIdColumn: 'user_id' },
  { table: 'contest_entries', userIdColumn: 'user_id' },
  { table: 'user_impact', userIdColumn: 'user_id' },
  { table: 'notifications', userIdColumn: 'user_id' },
  { table: 'subscriptions', userIdColumn: 'user_id' },
  { table: 'referrals', userIdColumn: 'referrer_id' },
  { table: 'referral_earnings', userIdColumn: 'referrer_id' },
]

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const limited = enforceRateLimit(`legal-my-data:${user.id}`, 10, 60_000)
  if (limited) return limited

  const [{ data: profile }, { data: acceptances }, { data: cookieConsent }, { data: deletionRequest }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('legal_acceptances').select('doc_type, version, accepted_at').eq('user_id', user.id),
      supabase.from('cookie_consents').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('account_deletion_requests').select('*').eq('user_id', user.id).maybeSingle(),
    ])

  const extra: Record<string, unknown> = {}
  for (const { table, userIdColumn } of EXTRA_TABLES) {
    const { data } = await supabase.from(table).select('*').eq(userIdColumn, user.id)
    extra[table] = data ?? []
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    compte: { id: user.id, email: user.email, createdAt: user.created_at },
    profile: profile ?? null,
    acceptationsLegales: acceptances ?? [],
    consentementCookies: cookieConsent ?? null,
    demandeSuppression: deletionRequest ?? null,
    ...extra,
  }

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="vida-mes-donnees.json"',
    },
  })
}
