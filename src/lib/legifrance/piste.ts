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

// URLs configurables via ENV — défaut sandbox (creds de test PISTE).
// Pour passer en prod : PISTE_OAUTH_URL=https://oauth.piste.gouv.fr/api/oauth/token
// +                      PISTE_API_BASE=https://api.piste.gouv.fr/dila/legifrance/lf-engine-app
const OAUTH_URL = process.env.PISTE_OAUTH_URL || 'https://sandbox-oauth.piste.gouv.fr/api/oauth/token'
const API_BASE = process.env.PISTE_API_BASE || 'https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app'

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
export async function getArticleByCid(
  cid: string,
  knownCodeId?: string,
  knownCodeName?: string,
): Promise<LegifranceArticle | null> {
  return readPisteArticle(cid, knownCodeId, knownCodeName)
}

async function readPisteArticle(
  requestedId: string,
  knownCodeId?: string,
  knownCodeName?: string,
  lookup: 'cid' | 'version' = 'cid',
): Promise<LegifranceArticle | null> {
  interface PisteArticleResponse {
    article?: {
      id: string
      num?: string
      titre?: string
      texte?: string
      texteHtml?: string
      dateDebut?: number
      dateFin?: number
      etat?: string
      cid?: string
      nature?: string
      context?: {
        titresTM?: Array<{ titre?: string; cid?: string }>
      }
    }
  }

  const data = await pisteRequest<PisteArticleResponse>('/consult/getArticle', { id: requestedId })
  if (!data.article) return null

  const a = data.article
  if (lookup === 'version' && a.id !== requestedId) {
    throw new LegifranceError('La version de l’article renvoyée par PISTE diffère de la version demandée.', 'piste', true)
  }
  const resolvedCid = a.cid || a.id

  // Code LEGITEXT non renvoyé directement par getArticle — utiliser le code
  // connu (contexte d'appel : listArticlesOfCode passe son codeId) ou extraire
  // du premier titresTM (LEGISCTA000006112874 = C. trav., etc.)
  const code = knownCodeId || ''
  const codeNom = knownCodeName || a.context?.titresTM?.[0]?.titre?.trim() || ''

  // Le champ `dateFin` de PISTE utilise souvent 32472144000000 (~an 3000) pour "en vigueur"
  const dateFinMs = a.dateFin
  const isStillInForce = !dateFinMs || dateFinMs > Date.now() + 365 * 10 * 24 * 3600 * 1000

  return {
    cid: resolvedCid,
    code,
    code_nom: codeNom,
    numero: a.num || '',
    titre: a.num ? `Article ${a.num}` : '',
    texte: a.texte || stripHtml(a.texteHtml || ''),
    date_debut: a.dateDebut ? new Date(a.dateDebut).toISOString() : null,
    date_fin: isStillInForce ? null : new Date(dateFinMs!).toISOString(),
    etat: normalizeEtat(a.etat),
    url_legifrance: `https://www.legifrance.gouv.fr/codes/article_lc/${lookup === 'version' ? a.id : resolvedCid}`,
    version_num: 1,
    last_synced_at: new Date().toISOString(),
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<\/?p[^>]*>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Recherche plein-texte dans le code à la date du jour (FAQ API Légifrance, § 7.2).
 */
export async function searchInCode(
  codeId: string,
  query: string,
  pageSize = 10,
): Promise<LegifranceArticle[]> {
  const limit = Math.min(Math.trunc(pageSize), 100)
  const term = query.trim()
  if (!/^LEGITEXT\d{12}$/.test(codeId) || !term || !Number.isFinite(pageSize) || limit < 1) return []

  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())

  // NOM_CODE attend un libellé. Le retrouver par CID et pour le même jour que la recherche.
  const metadata = await pisteRequest<{ title: { cid: string; title: string } | null }>(
    '/search/nearestVersion', { cidText: codeId, date },
  )
  if (metadata?.title === null) return []
  if (metadata?.title?.cid !== codeId || typeof metadata.title.title !== 'string' || !metadata.title.title.trim()) {
    throw new LegifranceError('Identité ou titre du code incohérent dans la réponse PISTE.', 'piste', true)
  }
  const codeName = metadata.title.title.trim()

  const payload = {
    recherche: {
      champs: [
        {
          typeChamp: 'ARTICLE',
          criteres: [
            { typeRecherche: 'UN_DES_MOTS', valeur: term, operateur: 'ET' },
          ],
          operateur: 'ET',
        },
      ],
      filtres: [
        { facette: 'NOM_CODE', valeurs: [codeName] },
        { facette: 'DATE_VERSION', singleDate: date },
      ],
      operateur: 'ET',
      pageNumber: 1,
      pageSize: limit,
      sort: 'PERTINENCE',
      typePagination: 'DEFAUT',
    },
    fond: 'CODE_DATE',
  }

  interface SearchResult {
    titles?: { id?: string | null; cid?: string | null }[]
    sections?: { extracts?: { id?: string }[] }[]
  }
  const data = await pisteRequest<{ results: SearchResult[] }>('/search', payload)
  if (!Array.isArray(data?.results)) throw new LegifranceError('Résultats de recherche PISTE illisibles.', 'piste', true)
  const versionIds = new Set<string>()
  searchResults: for (const result of data.results) {
    // Le champ id du titre peut porter un suffixe de date. Le cid reste l'identifiant du code.
    if (!result.titles?.some(title => (title.cid ?? title.id) === codeId)) continue
    for (const section of result.sections ?? []) {
      for (const extract of section.extracts ?? []) {
        if (extract.id && /^LEGIARTI\d{12}$/.test(extract.id)) versionIds.add(extract.id)
        if (versionIds.size === limit) break searchResults
      }
    }
  }

  const ids = [...versionIds]
  const articles: LegifranceArticle[] = []
  const batchSize = 5
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = await Promise.all(ids.slice(i, i + batchSize).map(id => readPisteArticle(id, codeId, codeName, 'version')))
    for (const article of batch) if (article) articles.push(article)
  }
  return articles
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
    const batch = await Promise.all(
      batchCids.map((cid) => getArticleByCid(cid, codeId)),
    )
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
