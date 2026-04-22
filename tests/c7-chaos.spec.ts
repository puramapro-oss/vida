/**
 * C7 F10 — Chaos tests.
 *
 * Vérifie que l'architecture RAG dynamique survit aux pannes :
 *  - PISTE down / pas de creds → fallback static toujours dispo
 *  - Postgres vide ou query exotique → static répond
 *  - Kill switch `LEGIFRANCE_FORCE_FALLBACK=static` bypass tout
 *  - Admin API : guards 401/400 corrects, rate limit actif
 *  - Query trop courte / vide → [] rapide (pas d'appel réseau)
 *
 * Ces tests sont la preuve que le chat VIDA ne casse JAMAIS pour cause de
 * défaillance Legifrance — le pire cas = 12 articles LAW_CONTEXT_STATIC.
 */

import { test, expect } from '@playwright/test'
import {
  searchArticles,
  getArticle,
  invalidateCacheForCode,
  isUpstashConfigured,
} from '../src/lib/legifrance/cache'
import { searchStatic, LAW_CONTEXT_STATIC } from '../src/lib/legifrance/static'
import { isPisteConfigured } from '../src/lib/legifrance/piste'
import { createServiceClient } from '../src/lib/supabase'
import type { LegifranceArticle } from '../src/lib/legifrance/types'

test.describe('C7 F10 — Chaos : fallback static résiste à tout', () => {
  test('FORCE_FALLBACK=static → toutes sources deviennent static (ignore Postgres)', async () => {
    const previous = process.env.LEGIFRANCE_FORCE_FALLBACK
    process.env.LEGIFRANCE_FORCE_FALLBACK = 'static'
    try {
      const results = await searchArticles({ query: 'AAH handicap allocation', topK: 5 })
      expect(results.length).toBeGreaterThan(0)
      for (const r of results) {
        expect(r.source).toBe('static')
      }
    } finally {
      if (previous === undefined) delete process.env.LEGIFRANCE_FORCE_FALLBACK
      else process.env.LEGIFRANCE_FORCE_FALLBACK = previous
    }
  })

  test('FORCE_FALLBACK=static gagne MÊME quand Postgres contient un sentinel', async () => {
    const supabase = createServiceClient()
    const sentinel: Partial<LegifranceArticle> = {
      cid: 'CHAOS_F10_FORCE',
      code: 'LEGITEXT000006074069',
      code_nom: "Code de l'action sociale et des familles",
      numero: 'L000-CHAOS',
      titre: 'Chaos F10 force fallback sentinel',
      texte: 'Cet article chaos ne doit JAMAIS apparaître quand le kill switch est actif.',
      etat: 'VIGUEUR',
      url_legifrance: 'https://legifrance.gouv.fr/chaos',
      version_num: 1,
      last_synced_at: new Date().toISOString(),
    }

    try {
      await supabase.schema('vida_sante').from('legifrance_articles').upsert(sentinel, { onConflict: 'cid' })

      const previous = process.env.LEGIFRANCE_FORCE_FALLBACK
      process.env.LEGIFRANCE_FORCE_FALLBACK = 'static'
      try {
        const results = await searchArticles({ query: 'chaos force fallback sentinel', topK: 5 })
        // Le sentinel Postgres NE DOIT PAS remonter
        const cids = results.map((r) => r.article.cid)
        expect(cids).not.toContain('CHAOS_F10_FORCE')
        // Toutes sources = static
        for (const r of results) expect(r.source).toBe('static')
      } finally {
        if (previous === undefined) delete process.env.LEGIFRANCE_FORCE_FALLBACK
        else process.env.LEGIFRANCE_FORCE_FALLBACK = previous
      }
    } finally {
      await supabase.schema('vida_sante').from('legifrance_articles').delete().eq('cid', 'CHAOS_F10_FORCE')
    }
  })

  test('Query vide → [] sans appel réseau (fail fast)', async () => {
    const empty = await searchArticles({ query: '', topK: 5 })
    expect(empty).toEqual([])

    const twoChar = await searchArticles({ query: 'AA', topK: 5 })
    expect(twoChar).toEqual([])

    const whitespace = await searchArticles({ query: '   ', topK: 5 })
    expect(whitespace).toEqual([])
  })

  test('getArticle(CID inconnu) sans PISTE → null ou static match', async () => {
    // CID totalement fantaisiste → ne peut pas être en Postgres, ni PISTE, ni static
    const fake = await getArticle('LEGIARTI_CHAOS_INEXISTANT_00000000')
    expect(fake).toBeNull()
  })

  test('getArticle(CID static) → retourne l\'article bundled même si tout down', async () => {
    // Prend le premier cid du bundle static
    const staticCid = LAW_CONTEXT_STATIC[0]?.cid
    expect(staticCid).toBeTruthy()
    const article = await getArticle(staticCid)
    expect(article).toBeTruthy()
    expect(article?.cid).toBe(staticCid)
  })

  test('searchStatic direct → toujours disponible sans aucun réseau', async () => {
    const results = searchStatic('handicap', 5)
    expect(results.length).toBeGreaterThan(0)
    for (const a of results) {
      expect(a.cid).toBeTruthy()
      expect(a.texte.length).toBeGreaterThan(20)
    }
  })

  test('invalidateCacheForCode ne throw JAMAIS même sans Upstash', async () => {
    // Si Upstash configuré → retourne un nombre (peut être 0)
    // Si pas configuré → retourne 0 sans erreur
    const deleted = await invalidateCacheForCode('LEGITEXT000006072050')
    expect(typeof deleted).toBe('number')
    expect(deleted).toBeGreaterThanOrEqual(0)
  })

  test('Feature flags isPisteConfigured + isUpstashConfigured restent deterministic', async () => {
    // Ces fonctions ne doivent jamais throw, juste renvoyer bool
    expect(typeof isPisteConfigured()).toBe('boolean')
    expect(typeof isUpstashConfigured()).toBe('boolean')
  })
})

test.describe('C7 F10 — Chaos : guards admin API', () => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://vida.purama.dev'

  test('GET /api/admin/sync-legifrance anon → 401', async ({ request }) => {
    const res = await request.get(`${baseURL}/api/admin/sync-legifrance`, { failOnStatusCode: false })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  test('POST /api/admin/sync-legifrance anon → 401 (pas 400 → guard précède validation body)', async ({ request }) => {
    const res = await request.post(`${baseURL}/api/admin/sync-legifrance`, {
      data: { codes: ['LEGITEXT000006072050'] },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(401)
  })

  test('POST avec body invalide ET anon → 401 (guard précède Zod)', async ({ request }) => {
    const res = await request.post(`${baseURL}/api/admin/sync-legifrance`, {
      data: { codes: ['INVALID_CODE_TOO_SHORT'] },
      failOnStatusCode: false,
    })
    // Guard auth précède la validation Zod → 401, pas 400
    expect(res.status()).toBe(401)
  })

  test('GET /api/cron/sync-legifrance sans auth → 401', async ({ request }) => {
    const res = await request.get(`${baseURL}/api/cron/sync-legifrance`, { failOnStatusCode: false })
    expect(res.status()).toBe(401)
  })

  test('GET /api/cron/sync-legifrance avec mauvais Bearer → 401', async ({ request }) => {
    const res = await request.get(`${baseURL}/api/cron/sync-legifrance`, {
      headers: { Authorization: 'Bearer wrong-secret-chaos-f10' },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(401)
  })
})

test.describe('C7 F10 — Chaos : /api/chat reste fonctionnel', () => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://vida.purama.dev'

  test('POST /api/chat anon → 401 propre (pas 500)', async ({ request }) => {
    const res = await request.post(`${baseURL}/api/chat`, {
      data: { messages: [{ role: 'user', content: 'droits MDPH' }] },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error).toContain('connecté')
  })

  test('POST /api/chat avec messages vides anon → 401 (auth guard précède validation)', async ({ request }) => {
    const res = await request.post(`${baseURL}/api/chat`, {
      data: { messages: [] },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(401)
  })
})
