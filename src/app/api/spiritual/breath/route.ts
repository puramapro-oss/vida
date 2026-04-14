import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { APP_SCHEMA } from '@/lib/constants'
import { AWAKENING_XP } from '@/lib/awakening'

export const runtime = 'nodejs'

const schema = z.object({
  duration_seconds: z.number().int().min(10).max(60 * 60),
  cycles: z.number().int().min(0).max(1000),
  technique: z.string().max(20).default('4-7-8'),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Session invalide.' }, { status: 400 })
    }

    const store = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: { schema: APP_SCHEMA },
        cookies: {
          getAll() { return store.getAll() },
          setAll(cs) { cs.forEach(({ name, value, options }) => store.set(name, value, options)) },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    await supabase.from('breath_sessions').insert({
      user_id: user.id,
      duration_seconds: parsed.data.duration_seconds,
      cycles: parsed.data.cycles,
      technique: parsed.data.technique,
    })

    await supabase.from('awakening_events').insert({
      user_id: user.id,
      event_type: 'breath',
      xp_gained: AWAKENING_XP.breath,
    })

    return NextResponse.json({ ok: true, xp_gained: AWAKENING_XP.breath })
  } catch {
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}
