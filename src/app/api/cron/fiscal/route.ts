import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * V6 §17 — Daily fiscal threshold check.
 * Scans users' cumulative gains vs 1500/2500/3000 thresholds and creates
 * fiscal_notifications (idempotent via UNIQUE constraint).
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString()

  const { data: users } = await db
    .from('profiles')
    .select('id, email, full_name')
    .eq('role', 'user')

  const created: Array<{ user_id: string; palier: number }> = []

  for (const u of users ?? []) {
    const { data: tx } = await db
      .from('transactions')
      .select('amount_cents')
      .eq('user_id', u.id)
      .eq('direction', 'in')
      .in('status', ['succeeded', 'paid'])
      .gte('created_at', yearStart)

    const totalCents = (tx ?? []).reduce((s, t) => s + (t.amount_cents ?? 0), 0)
    const totalEuros = totalCents / 100

    const thresholds = [1500, 2500, 3000]
    for (const palier of thresholds) {
      if (totalEuros >= palier) {
        const { error } = await db.from('fiscal_notifications').insert({
          user_id: u.id,
          palier,
          email_sent: false,
          push_sent: false,
        })
        if (!error) created.push({ user_id: u.id, palier })
      }
    }
  }

  return NextResponse.json({ ok: true, notifications_created: created.length })
}
