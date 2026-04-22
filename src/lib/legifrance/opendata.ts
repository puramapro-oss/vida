/**
 * Fallback OpenData DILA (Direction de l'information légale et administrative).
 *
 * Usage : activé UNIQUEMENT si :
 *   1. PISTE API est en panne prolongée (5xx > 3× en 1h), OU
 *   2. Postgres+Pinecone sont vides (re-seed manuel), OU
 *   3. Admin déclenche manuellement via /api/admin/sync-legifrance?source=opendata
 *
 * Source : https://echanges.dila.gouv.fr/OPENDATA/LEGI/
 * Format : tar.gz contenant des fichiers XML par article.
 * Taille : dumps complets ~2GB, incrémentaux ~50MB.
 *
 * ⚠️  Ne tourne PAS sur Vercel serverless (timeout 10s, mémoire 1GB max).
 * Exécution prévue sur le VPS via docker exec ou sur une worker queue
 * dédiée. Le code ici est la bibliothèque ; l'orchestration est F5 (ingest).
 */

import { createReadStream, createWriteStream, promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { createGunzip } from 'node:zlib'
import * as tar from 'tar'
import { XMLParser } from 'fast-xml-parser'
import { LegifranceError, type LegifranceArticle, type ArticleEtat } from './types'

const DILA_INDEX_URL = 'https://echanges.dila.gouv.fr/OPENDATA/LEGI/'
const REQUEST_TIMEOUT_MS = 60_000 // 1 min pour le HTML listing

/**
 * Récupère la liste des dumps disponibles sur DILA (scrape minimal du HTML directory index).
 * Retourne les dumps les plus récents en premier.
 */
export async function listAvailableDumps(): Promise<Array<{ url: string; filename: string; date: string }>> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let html: string
  try {
    const response = await fetch(DILA_INDEX_URL, { signal: controller.signal })
    if (!response.ok) {
      throw new LegifranceError(
        `DILA index HTTP ${response.status}`,
        'opendata',
        response.status >= 500,
        response.status,
      )
    }
    html = await response.text()
  } finally {
    clearTimeout(timeoutId)
  }

  // Parse minimal du HTML : match les liens *.tar.gz
  // Format DILA typique : <a href="Freemium_legi_global_YYYYMMDD-HHMMSS.tar.gz">...</a>
  const regex = /<a href="(Freemium_legi_global_(\d{8})-\d{6}\.tar\.gz)">/g
  const dumps: Array<{ url: string; filename: string; date: string }> = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    dumps.push({
      url: `${DILA_INDEX_URL}${match[1]}`,
      filename: match[1],
      date: match[2],
    })
  }

  return dumps.sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * Télécharge un dump DILA vers /tmp en streaming.
 * Retourne le chemin local du fichier tar.gz téléchargé.
 */
export async function downloadDump(url: string, destDir?: string): Promise<string> {
  const dir = destDir || (await fs.mkdtemp(join(tmpdir(), 'legi-dila-')))
  const filename = url.split('/').pop() || 'legi-dump.tar.gz'
  const destPath = join(dir, filename)

  const response = await fetch(url)
  if (!response.ok || !response.body) {
    throw new LegifranceError(
      `DILA download HTTP ${response.status}`,
      'opendata',
      response.status >= 500,
      response.status,
    )
  }

  const fileStream = createWriteStream(destPath)
  // Node.js 18+ : ReadableStream Web → Node Readable
  const nodeStream = Readable.fromWeb(response.body as never)
  await pipeline(nodeStream, fileStream)

  return destPath
}

/**
 * Extrait un tar.gz vers un répertoire de destination.
 * Filtre : ne garde que les fichiers XML d'articles des codes ciblés pour économiser le disque.
 */
export async function extractDump(
  tarGzPath: string,
  destDir: string,
  codeFilter?: string[],
): Promise<string> {
  await fs.mkdir(destDir, { recursive: true })

  await pipeline(
    createReadStream(tarGzPath),
    createGunzip(),
    tar.x({
      cwd: destDir,
      filter: (path: string): boolean => {
        // Ne conserver que les .xml dans les dossiers code/{LEGITEXT...}/article/
        if (!path.endsWith('.xml')) return false
        if (!path.includes('/article/')) return false
        if (codeFilter && codeFilter.length > 0) {
          return codeFilter.some((code) => path.includes(`/${code}/`))
        }
        return true
      },
    }),
  )

  return destDir
}

/**
 * Parse un fichier XML d'article Legifrance et le normalise.
 * Format DILA : <ARTICLE><META><META_COMMUN>...</META_COMMUN></META><BLOC_TEXTUEL>...</BLOC_TEXTUEL></ARTICLE>
 */
export async function parseArticleXml(xmlPath: string): Promise<LegifranceArticle | null> {
  const xmlContent = await fs.readFile(xmlPath, 'utf8')
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    preserveOrder: false,
    parseAttributeValue: false,
    trimValues: true,
  })

  const parsed = parser.parse(xmlContent) as Record<string, unknown>
  const article = (parsed.ARTICLE || parsed.article) as Record<string, unknown> | undefined
  if (!article) return null

  const meta = (article.META as Record<string, unknown>) || {}
  const metaCommun = (meta.META_COMMUN as Record<string, unknown>) || {}
  const metaSpec = ((meta.META_SPEC as Record<string, unknown>)?.META_ARTICLE as Record<string, unknown>) || {}
  const blocTextuel = (article.BLOC_TEXTUEL as Record<string, unknown>) || {}

  const cid = String(metaCommun.ID || metaCommun.CID || '')
  if (!cid) return null

  const extractText = (node: unknown): string => {
    if (typeof node === 'string') return node
    if (typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(extractText).join('\n')
    if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>
      const parts: string[] = []
      if (obj['#text']) parts.push(String(obj['#text']))
      for (const key of Object.keys(obj)) {
        if (key.startsWith('@_') || key === '#text') continue
        parts.push(extractText(obj[key]))
      }
      return parts.join(' ').trim()
    }
    return ''
  }

  const contenu = (blocTextuel.CONTENU as unknown) ?? ''
  const texte = extractText(contenu)

  const dateDebut = metaSpec.DATE_DEBUT as string | undefined
  const dateFin = metaSpec.DATE_FIN as string | undefined
  const etatRaw = (metaSpec.ETAT as string | undefined) || ''
  const numero = (metaSpec.NUM as string | undefined) || ''
  const origine = (metaSpec.ORIGINE as string | undefined) || ''

  // Le path XML contient le LEGITEXT parent → on peut extraire depuis xmlPath
  const pathMatch = xmlPath.match(/\/code\/(LEGITEXT\d+)\//)
  const code = pathMatch ? pathMatch[1] : ''

  return {
    cid,
    code,
    code_nom: origine || '',
    numero,
    titre: numero ? `Article ${numero}` : '',
    texte,
    date_debut: dateDebut ? normalizeDateIso(dateDebut) : null,
    date_fin: dateFin && dateFin !== '2999-01-01' ? normalizeDateIso(dateFin) : null,
    etat: normalizeEtat(etatRaw),
    url_legifrance: `https://www.legifrance.gouv.fr/codes/article_lc/${cid}`,
    version_num: 1,
    last_synced_at: new Date().toISOString(),
  }
}

/**
 * Parcourt récursivement un dossier extrait et yield les articles parsés.
 */
export async function* walkExtractedDump(
  extractedDir: string,
  codeFilter?: string[],
): AsyncGenerator<LegifranceArticle> {
  const entries = await fs.readdir(extractedDir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(extractedDir, entry.name)
    if (entry.isDirectory()) {
      yield* walkExtractedDump(fullPath, codeFilter)
    } else if (entry.isFile() && entry.name.endsWith('.xml')) {
      if (codeFilter && codeFilter.length > 0) {
        const match = codeFilter.some((code) => fullPath.includes(`/${code}/`))
        if (!match) continue
      }
      try {
        const article = await parseArticleXml(fullPath)
        if (article) yield article
      } catch {
        // Silently skip malformed articles — logged upstream par ingest.
      }
    }
  }
}

function normalizeEtat(raw: string): ArticleEtat {
  const v = raw.toUpperCase()
  if (v.includes('ABROG')) return 'ABROGE'
  if (v.includes('MODIF')) return 'MODIFIE'
  if (v.includes('PERIM')) return 'PERIME'
  return 'VIGUEUR'
}

function normalizeDateIso(raw: string): string {
  // DILA utilise "YYYY-MM-DD" ou "YYYYMMDD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(raw).toISOString()
  if (/^\d{8}$/.test(raw)) {
    return new Date(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`).toISOString()
  }
  return new Date(raw).toISOString()
}
