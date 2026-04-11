import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const start = Date.now()

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: 'vida_sante' } }
    )

    // Check DB connection
    const { error } = await supabase.from('profiles').select('id').limit(1)
    const latency = Date.now() - start

    const status = error ? 'degraded' : 'ok'

    // Log health check
    await supabase.from('health_checks').insert({
      status,
      response_time_ms: latency,
    })

    return NextResponse.json({
      status,
      database: error ? 'error' : 'ok',
      dbLatency: latency,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({
      status: 'error',
      database: 'unreachable',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
