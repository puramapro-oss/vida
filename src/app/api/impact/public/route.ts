import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// Publique, sans auth, cachée 60s au edge/CDN + 5min stale-while-revalidate
export const runtime = 'nodejs'
export const revalidate = 60

interface ImpactPayload {
  missions_count: number
  aides_count: number
  faq_count: number
  users_count: number
}

export async function GET() {
  try {
    const supabase = createServiceClient()

    const [missions, aides, faq, users] = await Promise.all([
      supabase.from('missions').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('aides').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('faq_articles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ])

    const payload: ImpactPayload = {
      missions_count: missions.count ?? 0,
      aides_count: aides.count ?? 0,
      faq_count: faq.count ?? 0,
      users_count: users.count ?? 0,
    }

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch {
    return NextResponse.json(
      { missions_count: 0, aides_count: 0, faq_count: 0, users_count: 0 },
      { status: 200 }
    )
  }
}
