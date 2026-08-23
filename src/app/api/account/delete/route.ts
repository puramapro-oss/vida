/**
 * POST /api/account/delete   — programme la suppression du compte dans 30 jours (RGPD art. 17).
 * DELETE /api/account/delete — annule une demande de suppression en cours (période de grâce).
 *
 * Adapté depuis packages/legal/src/api/account-delete.ts (implémentation réelle déjà en
 * production ailleurs dans l'écosystème). Corrige CONFORMITE.md Gap #4 (dossier vide, 404
 * en prod) et remplace le dark pattern mailto: par une vraie suppression self-service
 * (exigence Apple "delete in-app").
 */
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { enforceRateLimit } from '@/lib/rate-limit'

const GRACE_PERIOD_DAYS = 30

const requestSchema = z.object({
  reason: z.string().max(500).optional(),
  confirm: z.literal('DELETE_MY_ACCOUNT'),
})

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const limited = enforceRateLimit(`account-delete:${user.id}`, 5, 60_000)
  if (limited) return limited

  const json = await req.json().catch(() => null)
  const parsed = requestSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Confirmation invalide. Tape 'DELETE_MY_ACCOUNT' pour confirmer." },
      { status: 400 }
    )
  }

  const scheduledFor = new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 3600 * 1000)

  const { error } = await supabase.from('account_deletion_requests').upsert(
    {
      user_id: user.id,
      scheduled_for: scheduledFor.toISOString(),
      reason: parsed.data.reason ?? null,
      status: 'scheduled',
      cancelled_at: null,
      completed_at: null,
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    return NextResponse.json({ error: 'Demande impossible.', debug: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, scheduled_for: scheduledFor.toISOString(), grace_period_days: GRACE_PERIOD_DAYS })
}

export async function DELETE() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const limited = enforceRateLimit(`account-delete-cancel:${user.id}`, 10, 60_000)
  if (limited) return limited

  const { error } = await supabase
    .from('account_deletion_requests')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('status', 'scheduled')

  if (error) {
    return NextResponse.json({ error: 'Annulation impossible.', debug: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
