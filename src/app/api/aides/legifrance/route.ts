import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { askClaude } from '@/lib/claude'
import { LAW_CONTEXT } from '@/lib/legifrance'

export const runtime = 'nodejs'

const schema = z.object({
  query:     z.string().min(5).max(500),
  aide_slug: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Requête invalide.' },
      { status: 400 }
    )
  }
  const { query } = parsed.data

  try {
    const response = await askClaude(
      [{ role: 'user', content: query }],
      'premium',
      undefined,
      { articles: [LAW_CONTEXT] }
    )

    return NextResponse.json({ response, source: 'vida_law_rag' })
  } catch {
    return NextResponse.json(
      { error: 'Le service juridique est temporairement indisponible. Réessaie dans quelques instants.' },
      { status: 503 }
    )
  }
}
