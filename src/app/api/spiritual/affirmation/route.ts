import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const category = url.searchParams.get('category')
    const supabase = createServiceClient()

    const q = supabase
      .from('affirmations')
      .select('id, category, text_fr, text_en')
      .eq('active', true)

    if (category) q.eq('category', category)

    const { data, error } = await q
    if (error || !data || data.length === 0) {
      return NextResponse.json({ error: 'Aucune affirmation disponible.' }, { status: 500 })
    }

    const one = data[Math.floor(Math.random() * data.length)]
    return NextResponse.json(one)
  } catch {
    return NextResponse.json({ error: 'Une erreur inattendue.' }, { status: 500 })
  }
}
