/**
 * Client officiel PISTE (Portail d'Intégration et de Services Techniques de l'État)
 * pour l'API Legifrance — api.piste.gouv.fr/dila/legifrance.
 *
 * Auth : OAuth2 client_credentials (scope=openid).
 * Docs : https://developer.aife.economie.gouv.fr/
 *
 * ⚠️  ENV requis : PISTE_CLIENT_ID + PISTE_CLIENT_SECRET
 * Si absents → `isPisteConfigured()` retourne false et les appels throw
 * LegifranceError('piste_not_configured') — le cache layer (F4) passe alors
 * à la couche suivante (OpenData DILA puis fallback static).
 */

import { LegifranceError, type LegifranceArticle, type PisteTokenResponse } from './types'

const OAUTH_URL = 'https://oauth.piste.gouv.fr/api/oauth/token'
const API_BASE = 'https://api.piste.gouv.fr/dila/legifrance/lf-engine-app'

const REQUEST_TIMEOUT_MS = 15_000
const TOKEN_REFRESH_BUFFER_MS = 60_000 // Refresh 1 min avant expiration

/** Cache in-process du token (volontairement pas Upstash : propre au runtime). */
interface CachedToken {
  access_token: string
  expires_at: number // Timestamp ms d'expiration
}
let cachedToken: CachedToken | null = null

/** Vérifie que les credentials PISTE sont configurés. */
export function isPisteConfigured(): boolean {
  return Boolean(process.env.PISTE_CLIENT_ID && process.env.PISTE_CLIENT_SECRET)
}

/**
 * Récupère un access_token valide. Utilise le cache in-process si dispo.
 * Throw LegifranceError si creds absents ou OAuth fail.
 */
export async function getAccessToken(): Promise<string> {
  if (!isPisteConfigured()) {
    throw new LegifranceError(
      'PISTE_CLIENT_ID ou PISTE_CLIENT_SECRET absent. Inscris-toi sur https://piste.gouv.fr pour obtenir des credentials.',
      'piste',
      false,
    )
  }

  const now = Date.now()
  if (cachedToken && cachedToken.expires_at > now + TOKEN_REFRESH_BUFFER_MS) {
    return cachedToken.access_token
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.PISTE_CLIENT_ID!,
    client_secret: process.env.PISTE_CLIENT_SECRET!,
    scope: 'openid',
  })

  const response = await fetchWithTimeout(OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new LegifranceError(
      `PISTE OAuth échec (${response.status}) : ${errorText.slice(0, 200)}`,
      'piste',
      response.status >= 500,
      response.status,
    )
  }

  const data = (await response.json()) as PisteTokenResponse
  cachedToken = {
    access_token: data.access_token,
    expires_at: now + data.expires_in * 1000,
  }
  return data.access_token
}

/** Helper fetch avec timeout + AbortController. */
async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

/** Appel authentifié à l'API PISTE avec retry exp backoff sur 5xx. */
async function pisteRequest<T>(
  endpoint: string,
  payload: Record<string, unknown>,
  attempt = 0,
): Promise<T> {
  const token = await getAccessToken()

  const response = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  // 401 : token expiré (rare si cache correct) → invalide + 1 retry
  if (response.status === 401 && attempt === 0) {
    cachedToken = null
    return pisteRequest<T>(endpoint, payload, attempt + 1)
  }

  // 5xx : retry exp backoff max 3 tentatives
  if (response.status >= 500 && attempt < 2) {
    const delayMs = 1000 * Math.pow(2, attempt) // 1s, 2s
    await new Promise((r) => setTimeout(r, delayMs))
    return pisteRequest<T>(endpoint, payload, attempt + 1)
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new LegifranceError(
      `PISTE ${endpoint} échec (${response.status}) : ${errorText.slice(0, 200)}`,
      'piste',
      response.status >= 500,
      response.status,
    )
  }

  return (await response.json()) as T
}

/**
 * Récupère un article Legifrance par son CID.
 * Endpoint : /consult/getArticle
 */
export async function getArticleByCid(cid: string): Promise<LegifranceArticle | null> {
  interface PisteArticleResponse {
    article?: {
      id: string
      num?: string
      titre?: string
      texte?: string
      dateDebut?: number  // Timestamp ms
      dateFin?: number
      etat?: string
      cid?: string
      code?: string
      codeNom?: string
    }
  }

  const data = await pisteRequest<PisteArticleResponse>('/consult/getArticle', { id: cid })
  if (!data.article) return null

  const a = data.article
  return {
    cid: a.cid || a.id,
    code: a.code || '',
    code_nom: a.codeNom || '',
    numero: a.num || '',
    titre: a.titre || '',
    texte: a.texte || '',
    date_debut: a.dateDebut ? new Date(a.dateDebut).toISOString() : null,
    date_fin: a.dateFin ? new Date(a.dateFin).toISOString() : null,
    etat: normalizeEtat(a.etat),
    url_legifrance: `https://www.legifrance.gouv.fr/codes/article_lc/${a.cid || a.id}`,
    version_num: 1,
    last_synced_at: new Date().toISOString(),
  }
}

/**
 * Recherche plein-texte dans Legifrance.
 * Endpoint : /search (fond=CODE_DATE ou CODE_ETAT selon contexte).
 */
export async function searchInCode(
  codeId: string,
  query: string,
  pageSize = 10,
): Promise<LegifranceArticle[]> {
  interface PisteSearchResponse {
    results?: Array<{
      titles?: Array<{ id: string; title?: string; cid?: string }>
      sections?: Array<{ id: string }>
    }>
    totalResultNumber?: number
  }

  const payload = {
    recherche: {
      champs: [
        {
          typeChamp: 'ALL',
          criteres: [
            { typeRecherche: 'UN_DES_MOTS', valeur: query, operateur: 'ET' },
          ],
          operateur: 'ET',
        },
      ],
      filtres: [{ facette: 'CODE_ID', valeurs: [codeId] }],
      pageNumber: 1,
      pageSize,
      sort: 'PERTINENCE',
      typePagination: 'ARTICLE',
    },
    fond: 'CODE_DATE',
  }

  const data = await pisteRequest<PisteSearchResponse>('/search', payload)
  if (!data.results) return []

  // PISTE renvoie des IDs d'articles — fetch chaque article en parallèle
  const cids: string[] = []
  for (const r of data.results) {
    if (r.titles) {
      for (const t of r.titles) {
        if (t.cid) cids.push(t.cid)
        else if (t.id) cids.push(t.id)
      }
    }
  }

  const articles = await Promise.all(cids.slice(0, pageSize).map(getArticleByCid))
  return articles.filter((a): a is LegifranceArticle => a !== null)
}

/**
 * Liste TOUS les articles d'un code (pour le full-sync hebdo).
 * Utilise /consult/code avec pagination.
 */
export async function* listArticlesOfCode(
  codeId: string,
  pageSize = 50,
): AsyncGenerator<LegifranceArticle[]> {
  interface PisteCodeResponse {
    sections?: Array<{
      articles?: Array<{ cid: string; id: string }>
      sections?: unknown[]
    }>
    articles?: Array<{ cid: string; id: string }>
  }

  const data = await pisteRequest<PisteCodeResponse>('/consult/code', {
    textId: codeId,
    date: new Date().toISOString().slice(0, 10),
    abrogated: false,
  })

  const cids = extractAllCids(data)
  for (let i = 0; i < cids.length; i += pageSize) {
    const batchCids = cids.slice(i, i + pageSize)
    const batch = await Promise.all(batchCids.map(getArticleByCid))
    yield batch.filter((a): a is LegifranceArticle => a !== null)
  }
}

/** Parcourt récursivement l'arbre des sections pour extraire tous les CIDs d'articles. */
function extractAllCids(node: unknown): string[] {
  if (!node || typeof node !== 'object') return []
  const n = node as Record<string, unknown>
  const cids: string[] = []

  if (Array.isArray(n.articles)) {
    for (const a of n.articles) {
      if (typeof a === 'object' && a !== null) {
        const ar = a as Record<string, unknown>
        const cid = typeof ar.cid === 'string' ? ar.cid : typeof ar.id === 'string' ? ar.id : null
        if (cid) cids.push(cid)
      }
    }
  }

  if (Array.isArray(n.sections)) {
    for (const s of n.sections) {
      cids.push(...extractAllCids(s))
    }
  }

  return cids
}

function normalizeEtat(raw?: string): 'VIGUEUR' | 'ABROGE' | 'MODIFIE' | 'PERIME' {
  const v = (raw || '').toUpperCase()
  if (v.includes('ABROG')) return 'ABROGE'
  if (v.includes('MODIF')) return 'MODIFIE'
  if (v.includes('PERIM')) return 'PERIME'
  return 'VIGUEUR'
}

/** Export pour tests unitaires. */
export const _internal = {
  clearTokenCache: () => {
    cachedToken = null
  },
  getCachedToken: () => cachedToken,
}
