/**
 * Façade cache layered — orchestre les 5 étages de fallback :
 *   L0 Upstash Redis (TTL 30 j)   — ultra-rapide, optionnel (feature flag ENV)
 *   L1 Postgres (GIN FTS français) — authoritative, 15 K articles max
 *   L2 Pinecone (semantic)          — enrichi en F5, skip si pas encore d'embeddings
 *   L3 PISTE API live               — on-demand si article inconnu
 *   L4 OpenData DILA                — re-seed massif, admin only (voir F6)
 *   L5 LAW_CONTEXT_STATIC           — 12 articles fallback ultime
 *
 * Règle : `getArticle(cid)` descend les étages tant qu'un article n'est pas trouvé.
 * `searchArticles({query})` combine L1 FTS + (L2 Pinecone si dispo) via RRF léger.
 */

import { Redis } from '@upstash/redis'
import { createServiceClient } from '@/lib/supabase'
import { getArticleByCid as pisteGetArticle, isPisteConfigured } from './piste'
import { LAW_CONTEXT_STATIC, searchStatic } from './static'
import {
  LegifranceError,
  type LegifranceArticle,
  type LegifranceSearchResult,
  type SearchParams,
} from './types'

const CACHE_TTL_S = 30 * 24 * 3600 // 30 jours
const KEY_PREFIX = 'vida:legi'

// ═══════════════════════════════════════════════════════════════
// L0 Upstash
// ═══════════════════════════════════════════════════════════════

let redisClient: Redis | null | undefined // undefined = not yet resolved, null = not configured

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    redisClient = null
    return null
  }
  redisClient = new Redis({ url, token })
  return redisClient
}

export function isUpstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

async function l0Get(cid: string): Promise<LegifranceArticle | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const cached = await redis.get<LegifranceArticle>(`${KEY_PREFIX}:article:${cid}`)
    return cached ?? null
  } catch {
    return null
  }
}

async function l0Set(article: LegifranceArticle): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.set(`${KEY_PREFIX}:article:${article.cid}`, article, { ex: CACHE_TTL_S })
  } catch {
    // Cache miss-on-set : pas bloquant
  }
}

/** Invalide tous les articles d'un code (à appeler après sync CRON). */
export async function invalidateCacheForCode(codeId: string): Promise<number> {
  const redis = getRedis()
  if (!redis) return 0
  let cursor = 0
  let deleted = 0
  do {
    const scanResult = await redis.scan(cursor, {
      match: `${KEY_PREFIX}:article:*`,
      count: 500,
    })
    const nextCursor = Array.isArray(scanResult) ? scanResult[0] : 0
    const keys = Array.isArray(scanResult) ? (scanResult[1] as string[]) : []
    cursor = Number(nextCursor)
    if (keys.length > 0) {
      // Pour être précis sur le filtrage par code, on devrait lire chaque entrée.
      // Pragmatique : on supprime toutes les clefs du préfixe (1 sync/sem).
      await redis.del(...keys)
      deleted += keys.length
    }
  } while (cursor !== 0)
  void codeId // volontaire : le param est là pour l'API future, scan actuel = all
  return deleted
}

// ═══════════════════════════════════════════════════════════════
// L1 Postgres
// ═══════════════════════════════════════════════════════════════

async function l1GetByCid(cid: string): Promise<LegifranceArticle | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .schema('vida_sante')
    .from('legifrance_articles')
    .select('*')
    .eq('cid', cid)
    .maybeSingle()
  if (error || !data) return null
  return data as LegifranceArticle
}

async function l1Search(params: SearchParams): Promise<LegifranceSearchResult[]> {
  const supabase = createServiceClient()
  const { query, codes, topK = 5 } = params

  // FTS français : ts_rank via RPC car Supabase JS ne wrap pas @@ directement.
  // On utilise plainto_tsquery côté SQL pour robustesse accents/multi-mots.
  let builder = supabase
    .schema('vida_sante')
    .from('legifrance_articles')
    .select('*')
    .eq('etat', 'VIGUEUR')
    .textSearch('fts_fr', query, { type: 'plain', config: 'french' })
    .limit(topK)

  if (codes && codes.length > 0) {
    builder = builder.in('code', codes)
  }

  const { data, error } = await builder
  if (error || !data) return []

  return data.map((article, idx) => ({
    article: article as LegifranceArticle,
    score: 1 - idx * 0.1, // Pseudo-score décroissant (FTS ordre natif)
    source: 'postgres' as const,
  }))
}

async function l1Upsert(article: LegifranceArticle): Promise<void> {
  const supabase = createServiceClient()
  // Ne pas upsert la FTS (GENERATED), laisser PG la calculer.
  const { cid, code, code_nom, numero, titre, texte, date_debut, date_fin, etat, url_legifrance, version_num, last_synced_at } = article
  await supabase.schema('vida_sante').from('legifrance_articles').upsert(
    {
      cid, code, code_nom, numero, titre, texte,
      date_debut, date_fin, etat, url_legifrance, version_num, last_synced_at,
    },
    { onConflict: 'cid' },
  )
}

// ═══════════════════════════════════════════════════════════════
// L3 PISTE live (L2 Pinecone en F5)
// ═══════════════════════════════════════════════════════════════

async function l3GetFromPiste(cid: string): Promise<LegifranceArticle | null> {
  if (!isPisteConfigured()) return null
  try {
    return await pisteGetArticle(cid)
  } catch (e) {
    if (e instanceof LegifranceError && !e.retriable) return null
    throw e
  }
}

// ═══════════════════════════════════════════════════════════════
// L5 Static (toujours dispo)
// ═══════════════════════════════════════════════════════════════

function l5GetFromStatic(cid: string): LegifranceArticle | null {
  return LAW_CONTEXT_STATIC.find((a) => a.cid === cid) ?? null
}

// ═══════════════════════════════════════════════════════════════
// API publique
// ═══════════════════════════════════════════════════════════════

/**
 * Récupère un article en descendant les couches : L0 → L1 → L3 PISTE → L5 static.
 * Si trouvé dans L3, promeut automatiquement en L1 + L0 pour les appels suivants.
 */
export async function getArticle(cid: string): Promise<LegifranceArticle | null> {
  const l0 = await l0Get(cid)
  if (l0) return l0

  const l1 = await l1GetByCid(cid)
  if (l1) {
    await l0Set(l1)
    return l1
  }

  const l3 = await l3GetFromPiste(cid)
  if (l3) {
    await l1Upsert(l3)
    await l0Set(l3)
    return l3
  }

  return l5GetFromStatic(cid)
}

/**
 * Recherche hybride : Postgres FTS en priorité, fallback sur static si vide.
 * (Pinecone semantic sera ajouté en F5 via Reciprocal Rank Fusion.)
 *
 * Respecte `FORCE_FALLBACK=static` env → bypass tout pour debug.
 */
export async function searchArticles(params: SearchParams): Promise<LegifranceSearchResult[]> {
  const { query, topK = 5 } = params
  if (!query || query.trim().length < 3) return []

  if (process.env.LEGIFRANCE_FORCE_FALLBACK === 'static') {
    return searchStatic(query, topK).map((article: LegifranceArticle, idx: number) => ({
      article,
      score: 1 - idx * 0.1,
      source: 'static' as const,
    }))
  }

  const l1Results = await l1Search(params)
  if (l1Results.length > 0) return l1Results

  // Fallback static si Postgres vide
  return searchStatic(query, topK).map((article, idx) => ({
    article,
    score: 1 - idx * 0.1,
    source: 'static' as const,
  }))
}

/** Exposé pour F5 (ingest) + F6 (admin) + tests. */
export const _internal = {
  l0Get,
  l0Set,
  l1GetByCid,
  l1Search,
  l1Upsert,
  l3GetFromPiste,
  l5GetFromStatic,
}
