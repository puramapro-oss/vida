/**
 * C7 F7 — CRON hebdomadaire Legifrance (Vercel Cron dimanche 3h UTC).
 *
 * Sync les 3 codes ciblés en série (pas parallèle — respecte PISTE rate limit).
 * Idempotent : upsert partout, reprise possible.
 *
 * Auth : Bearer token via CRON_SECRET.
 * Vercel Cron : déclaration dans `vercel.json` → path + schedule "0 3 * * 0".
 *
 * maxDuration : 300s (serveurs Vercel Pro, max 900s).
 * Typiquement : sync 3 codes (20K articles) = ~30 min AVEC embeddings,
 * ~5 min sans. Dépasse largement maxDuration si embeddings activés →
 * en prod, le CRON devra utiliser un worker dédié (Upstash QStash ou VPS).
 * Pour MVP : on sync SANS embeddings (LEGIFRANCE_SKIP_EMBEDDINGS=1) → tient en 5 min.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { syncCodes } from '@/lib/legifrance/ingest'
import { TARGETED_CODES } from '@/lib/legifrance/types'
import { invalidateCacheForCode } from '@/lib/legifrance/cache'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min — suffisant sans embeddings

export async function GET(request: NextRequest) {
  // Auth Bearer token — Vercel Cron envoie x-vercel-cron: 1 header + no body
  const cronHeader = request.headers.get('x-vercel-cron')
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  const isVercelCron = cronHeader === '1'
  const isManualWithSecret = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isVercelCron && !isManualWithSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started = Date.now()
  const codeIds = Object.values(TARGETED_CODES).map((c) => c.id)

  try {
    // Log début dans health_checks
    const supabase = createServiceClient()
    await supabase.from('health_checks').insert({
      status: 'ok',
      response_time_ms: 0,
    }).select().maybeSingle()

    const result = await syncCodes(codeIds, 'cron', {
      // Skip embeddings = true par défaut pour tenir dans maxDuration.
      // Override explicite via env LEGIFRANCE_SKIP_EMBEDDINGS=0 (quand OpenAI OK)
      skipEmbeddings: process.env.LEGIFRANCE_SKIP_EMBEDDINGS !== '0',
    })

    // Invalide cache Upstash pour chaque code (best-effort)
    for (const codeId of codeIds) {
      try {
        await invalidateCacheForCode(codeId)
      } catch {
        // ignore
      }
    }

    const duration_s = Math.round((Date.now() - started) / 1000)
    return NextResponse.json({
      ok: true,
      jobId: result.jobId,
      codes: result.codes,
      articles_synced: result.articles_synced,
      articles_failed: result.articles_failed,
      duration_s,
      errors: result.errors.slice(0, 3), // tronque pour log propre
    })
  } catch (err) {
    const duration_s = Math.round((Date.now() - started) / 1000)
    console.error('[cron/sync-legifrance] fatal:', err)
    return NextResponse.json(
      {
        ok: false,
        error: (err as Error).message,
        duration_s,
      },
      { status: 500 },
    )
  }
}
