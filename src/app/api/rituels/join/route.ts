import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase'

const schema = z.object({ ritualId: z.string().uuid() })

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Connecte-toi pour rejoindre un rituel.' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: 'vida_sante' } },
  )
  const { data: { user }, error: authErr } = await authClient.auth.getUser(token)
  if (authErr || !user) {
    return NextResponse.json({ error: 'Session expirée. Reconnecte-toi.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Rituel invalide.' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error: insErr } = await supabase
    .from('user_ritual_participations')
    .upsert(
      { user_id: user.id, ritual_id: parsed.data.ritualId },
      { onConflict: 'user_id,ritual_id', ignoreDuplicates: true },
    )
  if (insErr) {
    return NextResponse.json({ error: 'Inscription impossible. Réessaie dans un instant.' }, { status: 500 })
  }

  const { data: ritual } = await supabase
    .from('weekly_rituals')
    .select('participants_count')
    .eq('id', parsed.data.ritualId)
    .maybeSingle()

  const nextCount = (ritual?.participants_count ?? 0) + 1
  await supabase
    .from('weekly_rituals')
    .update({ participants_count: nextCount })
    .eq('id', parsed.data.ritualId)

  return NextResponse.json({ joined: true, participants_count: nextCount })
}
