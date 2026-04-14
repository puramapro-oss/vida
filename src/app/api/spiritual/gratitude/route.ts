import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { APP_SCHEMA } from '@/lib/constants'
import { AWAKENING_XP } from '@/lib/awakening'

export const runtime = 'nodejs'

const schema = z.object({
  content: z.string().min(3, 'Trop court.').max(2000, 'Trop long.'),
  mood: z.string().max(40).optional(),
})

async function getSupabase() {
  const store = await cookies()
  return createServerClient(
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
}

export async function GET() {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { data } = await supabase
      .from('gratitude_entries')
      .select('id, content, mood, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    return NextResponse.json({ entries: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Entrée invalide.', details: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { data, error } = await supabase
      .from('gratitude_entries')
      .insert({ user_id: user.id, content: parsed.data.content, mood: parsed.data.mood ?? null })
      .select('id, content, mood, created_at')
      .single()
    if (error) return NextResponse.json({ error: 'Impossible d\'enregistrer.' }, { status: 500 })

    await supabase.from('awakening_events').insert({
      user_id: user.id,
      event_type: 'gratitude',
      xp_gained: AWAKENING_XP.gratitude,
    })

    return NextResponse.json({ entry: data, xp_gained: AWAKENING_XP.gratitude })
  } catch {
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}
