import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { APP_SCHEMA } from '@/lib/constants'
import { AWAKENING_XP } from '@/lib/awakening'

export const runtime = 'nodejs'

export async function POST() {
  try {
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
    if (!user) return NextResponse.json({ ok: false }, { status: 200 })

    await supabase.from('awakening_events').insert({
      user_id: user.id,
      event_type: 'affirmation',
      xp_gained: AWAKENING_XP.affirmation,
    })
    return NextResponse.json({ ok: true, xp_gained: AWAKENING_XP.affirmation })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
