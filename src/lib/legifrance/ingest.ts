/**
 * C7 F5 — Pipeline d'ingestion Legifrance.
 *
 * Orchestre :
 *   1. Fetch articles via PISTE (listArticlesOfCode + getArticleByCid en batch)
 *   2. Embed via OpenAI text-embedding-3-small (1536 dims, $0.02/M tokens)
 *   3. UPSERT Postgres vida_sante.legifrance_articles
 *   4. UPSERT Pinecone namespace "legifrance" avec metadata {cid, code, numero}
 *   5. Log progression dans sync_legifrance_jobs + sync_legifrance_logs
 *
 * Idempotent : upsert partout, reprise possible si interruption.
 * Coût ~$0.08 pour sync one-shot 3 codes (~20K articles × 200 tokens).
 */

import OpenAI from 'openai'
import { Pinecone } from '@pinecone-database/pinecone'
import { createServiceClient } from '@/lib/supabase'
import { listArticlesOfCode, getArticleByCid, isPisteConfigured } from './piste'
import { TARGETED_CODES, LegifranceError, type LegifranceArticle } from './types'

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMS = 1536
const PINECONE_NAMESPACE = 'legifrance'
const BATCH_SIZE = 50

let openaiClient: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (openaiClient) return openaiClient
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new LegifranceError('OPENAI_API_KEY absent', 'piste', false)
  }
  openaiClient = new OpenAI({ apiKey })
  return openaiClient
}

let pineconeClient: Pinecone | null = null
function getPinecone(): Pinecone {
  if (pineconeClient) return pineconeClient
  const apiKey = process.env.PINECONE_API_KEY
  if (!apiKey) {
    throw new LegifranceError('PINECONE_API_KEY absent', 'pinecone', false)
  }
  pineconeClient = new Pinecone({ apiKey })
  return pineconeClient
}

function getPineconeIndex() {
  const name = process.env.PINECONE_INDEX_LEGIFRANCE || 'vida-legifrance'
  return getPinecone().index(name)
}

/** Génère un embedding OpenAI pour un texte (tronqué à 8000 tokens ~= 32KB). */
export async function embedText(text: string): Promise<number[]> {
  const truncated = text.slice(0, 30_000) // ~8K tokens max pour text-embedding-3-small
  const response = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncated,
  })
  const embedding = response.data[0]?.embedding
  if (!embedding || embedding.length !== EMBEDDING_DIMS) {
    throw new LegifranceError(
      `OpenAI embedding dims inattendues (${embedding?.length} ≠ ${EMBEDDING_DIMS})`,
      'piste',
      true,
    )
  }
  return embedding
}

/** UPSERT batch d'articles dans Postgres (service_role). */
async function upsertToPostgres(articles: LegifranceArticle[]): Promise<void> {
  if (articles.length === 0) return
  const supabase = createServiceClient()
  const rows = articles.map((a) => ({
    cid: a.cid,
    code: a.code,
    code_nom: a.code_nom,
    numero: a.numero,
    titre: a.titre,
    texte: a.texte,
    date_debut: a.date_debut,
    date_fin: a.date_fin,
    etat: a.etat,
    url_legifrance: a.url_legifrance,
    version_num: a.version_num,
    last_synced_at: a.last_synced_at,
  }))
  const { error } = await supabase
    .schema('vida_sante')
    .from('legifrance_articles')
    .upsert(rows, { onConflict: 'cid' })
  if (error) {
    throw new LegifranceError(`Postgres upsert : ${error.message}`, 'postgres', true)
  }
}

/** UPSERT batch d'embeddings dans Pinecone namespace legifrance. */
async function upsertToPinecone(
  articles: LegifranceArticle[],
  embeddings: number[][],
): Promise<void> {
  if (articles.length === 0) return
  const index = getPineconeIndex()
  const records = articles.map((a, i) => ({
    id: a.cid,
    values: embeddings[i],
    metadata: {
      cid: a.cid,
      code: a.code,
      code_nom: a.code_nom,
      numero: a.numero,
      titre: a.titre,
      etat: a.etat,
      date_debut: a.date_debut || '',
    },
  }))
  await index.namespace(PINECONE_NAMESPACE).upsert({ records })
}

/** Log dans sync_legifrance_logs (best-effort, ne throw jamais). */
async function logStep(
  jobId: string,
  level: 'info' | 'warn' | 'error',
  message: string,
  cid?: string,
): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase.schema('vida_sante').from('sync_legifrance_logs').insert({
      job_id: jobId,
      cid: cid || null,
      level,
      message: message.slice(0, 500),
    })
  } catch {
    // Silently skip si log table inaccessible — ne doit pas bloquer le sync
  }
}

/** Met à jour un job de sync. */
async function updateJob(
  jobId: string,
  patch: Partial<{
    status: string
    articles_synced: number
    articles_failed: number
    started_at: string
    ended_at: string
    duration_s: number
    errors_json: unknown[]
  }>,
): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .schema('vida_sante')
    .from('sync_legifrance_jobs')
    .update(patch)
    .eq('id', jobId)
}

/** Créé un job de sync dans la DB et retourne son ID. */
export async function createSyncJob(
  codes: string[],
  source: 'piste' | 'opendata' | 'manual' = 'piste',
  triggered_by = 'cron',
): Promise<string> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .schema('vida_sante')
    .from('sync_legifrance_jobs')
    .insert({
      codes,
      source,
      triggered_by,
      status: 'pending',
    })
    .select('id')
    .single()
  if (error || !data) {
    throw new LegifranceError(`Impossible de créer le job : ${error?.message}`, 'postgres', false)
  }
  return data.id as string
}

export interface SyncResult {
  jobId: string
  codes: string[]
  articles_synced: number
  articles_failed: number
  duration_s: number
  errors: string[]
}

/** Paramètres optionnels pour limiter le scope (dev/debug). */
export interface SyncOptions {
  /** Limite d'articles par code (défaut : illimité). Pratique pour tests. */
  maxArticlesPerCode?: number
  /** Skip Pinecone (si on veut juste peupler Postgres). */
  skipEmbeddings?: boolean
}

/**
 * Synchronise un code entier (ou plusieurs) depuis PISTE vers Postgres+Pinecone.
 * Respecte le scope des codes ciblés (TARGETED_CODES) par défaut.
 */
export async function syncCodes(
  codeIds: string[],
  triggered_by: string = 'cron',
  options: SyncOptions = {},
): Promise<SyncResult> {
  if (!isPisteConfigured()) {
    throw new LegifranceError('PISTE_CLIENT_ID/SECRET absents — sync impossible', 'piste', false)
  }

  const jobId = await createSyncJob(codeIds, 'piste', triggered_by)
  const startedAt = new Date()
  await updateJob(jobId, { status: 'running', started_at: startedAt.toISOString() })
  await logStep(jobId, 'info', `Démarrage sync pour ${codeIds.length} code(s): ${codeIds.join(', ')}`)

  let totalSynced = 0
  let totalFailed = 0
  const errors: string[] = []

  for (const codeId of codeIds) {
    const codeNom = Object.values(TARGETED_CODES).find((c) => c.id === codeId)?.nom || codeId
    await logStep(jobId, 'info', `Sync code ${codeNom} (${codeId})`)
    let codeArticleCount = 0

    try {
      for await (const batch of listArticlesOfCode(codeId, BATCH_SIZE)) {
        if (batch.length === 0) continue

        // Enrichir code_nom si manquant
        for (const a of batch) {
          if (!a.code_nom) a.code_nom = codeNom
          if (!a.code) a.code = codeId
        }

        let embeddings: number[][] = []
        if (!options.skipEmbeddings) {
          try {
            embeddings = await Promise.all(batch.map((a) => embedText(`${a.numero} ${a.titre} ${a.texte}`)))
          } catch (e) {
            await logStep(jobId, 'warn', `Embedding échec batch : ${(e as Error).message}`)
            errors.push((e as Error).message)
            totalFailed += batch.length
            continue
          }
        }

        try {
          await upsertToPostgres(batch)
          if (!options.skipEmbeddings) await upsertToPinecone(batch, embeddings)
          totalSynced += batch.length
          codeArticleCount += batch.length

          if (totalSynced % 100 === 0) {
            await logStep(jobId, 'info', `Progression : ${totalSynced} articles synchronisés`)
            await updateJob(jobId, { articles_synced: totalSynced })
          }
        } catch (e) {
          await logStep(jobId, 'error', `Upsert échec : ${(e as Error).message}`, batch[0]?.cid)
          errors.push((e as Error).message)
          totalFailed += batch.length
        }

        if (options.maxArticlesPerCode && codeArticleCount >= options.maxArticlesPerCode) {
          await logStep(jobId, 'info', `maxArticlesPerCode atteint (${codeArticleCount}) — passage au code suivant`)
          break
        }
      }
    } catch (e) {
      await logStep(jobId, 'error', `Code ${codeId} échec global : ${(e as Error).message}`)
      errors.push(`${codeId}: ${(e as Error).message}`)
    }

    await logStep(jobId, 'info', `Code ${codeNom} terminé : ${codeArticleCount} articles`)
  }

  const endedAt = new Date()
  const duration_s = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)

  await updateJob(jobId, {
    status: errors.length > 0 && totalSynced === 0 ? 'failed' : 'completed',
    articles_synced: totalSynced,
    articles_failed: totalFailed,
    ended_at: endedAt.toISOString(),
    duration_s,
    errors_json: errors.slice(0, 10),
  })
  await logStep(jobId, 'info', `Sync terminé : ${totalSynced} OK / ${totalFailed} KO / ${duration_s}s`)

  return {
    jobId,
    codes: codeIds,
    articles_synced: totalSynced,
    articles_failed: totalFailed,
    duration_s,
    errors,
  }
}

/**
 * Sync ciblé sur un petit set d'articles par CID (pour debug / one-shot).
 */
export async function syncArticlesByCid(
  cids: string[],
  knownCodeId?: string,
  knownCodeName?: string,
  options: SyncOptions = {},
): Promise<LegifranceArticle[]> {
  if (!isPisteConfigured()) {
    throw new LegifranceError('PISTE_CLIENT_ID/SECRET absents', 'piste', false)
  }

  const articles: LegifranceArticle[] = []
  for (const cid of cids) {
    const article = await getArticleByCid(cid, knownCodeId, knownCodeName)
    if (article) articles.push(article)
  }

  if (articles.length === 0) return []

  await upsertToPostgres(articles)

  const skipEmbeddings = options.skipEmbeddings || process.env.LEGIFRANCE_SKIP_EMBEDDINGS === '1'
  if (!skipEmbeddings) {
    const embeddings = await Promise.all(
      articles.map((a) => embedText(`${a.numero} ${a.titre} ${a.texte}`)),
    )
    await upsertToPinecone(articles, embeddings)
  }

  return articles
}

/** Recherche sémantique Pinecone (utilisée par F8 intégration /api/chat). */
export async function searchByEmbedding(
  query: string,
  topK = 5,
  codes?: string[],
): Promise<Array<{ cid: string; score: number; metadata: Record<string, unknown> }>> {
  const embedding = await embedText(query)
  const index = getPineconeIndex()
  const filter = codes && codes.length > 0 ? { code: { $in: codes } } : undefined

  const result = await index.namespace(PINECONE_NAMESPACE).query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter,
  })

  return (result.matches || []).map((m) => ({
    cid: m.id,
    score: m.score ?? 0,
    metadata: (m.metadata as Record<string, unknown>) || {},
  }))
}
