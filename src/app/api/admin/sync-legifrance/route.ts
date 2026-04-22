/**
 * C7 F6 — Admin endpoint pour déclencher un sync Legifrance à la demande.
 *
 * POST /api/admin/sync-legifrance
 * Body JSON : { codes: string[], skipEmbeddings?: boolean, maxArticlesPerCode?: number }
 *
 * Auth : super_admin uniquement (email === SUPER_ADMIN_EMAIL).
 * Rate limit : 1 sync actif à la fois (vérifié via sync_legifrance_jobs.status = 'running').
 *
 * Retourne { jobId, estimated_duration_s } puis lance le sync en arrière-plan
 * via `waitUntil` (Vercel) ou fallback fire-and-forget.
 *
 * GET /api/admin/sync-legifrance?jobId=... → renvoie le statut courant du job.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'
import { syncCodes } from '@/lib/legifrance/ingest'
import { TARGETED_CODES } from '@/lib/legifrance/types'

export const runtime = 'nodejs'
export const maxDuration = 60 // Laisse 60s pour la réponse initiale ; le sync continue en background

const VALID_CODE_IDS = Object.values(TARGETED_CODES).map((c) => c.id) as string[]

const bodySchema = z.object({
  codes: z
    .array(z.string().min(10).max(32))
    .min(1)
    .max(5)
    .refine((codes) => codes.every((c) => VALID_CODE_IDS.includes(c)), {
      message: `codes doivent être dans: ${VALID_CODE_IDS.join(', ')}`,
    }),
  skipEmbeddings: z.boolean().optional(),
  maxArticlesPerCode: z.number().int().min(1).max(50_000).optional(),
})

async function assertSuperAdmin(): Promise<{ email: string } | NextResponse> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  if (user.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: 'Accès super_admin requis' }, { status: 403 })
  }
  return { email: user.email }
}

export async function POST(request: NextRequest) {
  const authResult = await assertSuperAdmin()
  if (authResult instanceof NextResponse) return authResult

  let body: z.infer<typeof bodySchema>
  try {
    const json = await request.json()
    body = bodySchema.parse(json)
  } catch (err) {
    return NextResponse.json(
      { error: 'Corps de requête invalide', details: (err as Error).message },
      { status: 400 },
    )
  }

  // Rate limit : refuse si un job est déjà en cours
  const supabase = createServiceClient()
  const { data: activeJobs } = await supabase
    .schema('vida_sante')
    .from('sync_legifrance_jobs')
    .select('id, started_at')
    .eq('status', 'running')
    .limit(1)

  if (activeJobs && activeJobs.length > 0) {
    return NextResponse.json(
      {
        error: 'Un sync est déjà en cours',
        activeJobId: activeJobs[0].id,
        hint: 'Patiente quelques minutes ou consulte GET /api/admin/sync-legifrance?jobId=...',
      },
      { status: 429 },
    )
  }

  // Estimation durée : ~0.3s/article avec embeddings, ~0.1s sans
  const estimatedArticles = body.maxArticlesPerCode
    ? body.maxArticlesPerCode * body.codes.length
    : 5000 * body.codes.length
  const perArticleS = body.skipEmbeddings ? 0.1 : 0.3
  const estimated_duration_s = Math.round(estimatedArticles * perArticleS)

  // Lancer le sync en arrière-plan — on doit répondre vite
  // Next.js 16 + Vercel : on démarre et on laisse la fonction continuer au-delà
  // de la réponse via Promise non-awaitée + maxDuration étendu.
  const syncPromise = syncCodes(body.codes, `admin:${authResult.email}`, {
    skipEmbeddings: body.skipEmbeddings,
    maxArticlesPerCode: body.maxArticlesPerCode,
  }).catch((err: Error) => {
    // Les erreurs sont déjà loggées dans sync_legifrance_logs
    console.error('[sync-legifrance] background error:', err.message)
  })

  // Attache le sync à l'event loop globalement pour que Vercel le laisse tourner
  // jusqu'à maxDuration. Pas idéal mais pragmatique sans @vercel/functions.
  void syncPromise

  // Récupère le jobId fraîchement créé pour le retourner (race condition possible
  // avec d'autres admin sync en parallèle mais on vient de bloquer ce cas)
  await new Promise((r) => setTimeout(r, 200))
  const { data: recentJob } = await supabase
    .schema('vida_sante')
    .from('sync_legifrance_jobs')
    .select('id')
    .eq('triggered_by', `admin:${authResult.email}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    ok: true,
    jobId: recentJob?.id ?? null,
    codes: body.codes,
    estimated_duration_s,
    hint: "Poll GET /api/admin/sync-legifrance?jobId=... pour suivre l'avancement",
  })
}

export async function GET(request: NextRequest) {
  const authResult = await assertSuperAdmin()
  if (authResult instanceof NextResponse) return authResult

  const jobId = request.nextUrl.searchParams.get('jobId')
  const supabase = createServiceClient()

  if (jobId) {
    const { data: job, error } = await supabase
      .schema('vida_sante')
      .from('sync_legifrance_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle()
    if (error || !job) {
      return NextResponse.json({ error: 'Job introuvable' }, { status: 404 })
    }

    const { data: logs } = await supabase
      .schema('vida_sante')
      .from('sync_legifrance_logs')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ job, recentLogs: logs || [] })
  }

  // Sans jobId : liste 10 derniers jobs + stats 3 codes
  const { data: jobs } = await supabase
    .schema('vida_sante')
    .from('sync_legifrance_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  const codeStats = await Promise.all(
    VALID_CODE_IDS.map(async (code) => {
      const { count } = await supabase
        .schema('vida_sante')
        .from('legifrance_articles')
        .select('*', { count: 'exact', head: true })
        .eq('code', code)
      const { data: latest } = await supabase
        .schema('vida_sante')
        .from('legifrance_articles')
        .select('last_synced_at')
        .eq('code', code)
        .order('last_synced_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      const codeMeta = Object.values(TARGETED_CODES).find((c) => c.id === code)
      return {
        code,
        nom: codeMeta?.nom || code,
        articles_count: count || 0,
        last_synced_at: latest?.last_synced_at || null,
      }
    }),
  )

  return NextResponse.json({
    jobs: jobs || [],
    codeStats,
    targetedCodes: VALID_CODE_IDS,
  })
}
