/**
 * C7 F4 — Tests du cache layered.
 *
 * Stratégie :
 * - searchStatic() testé direct (aucun réseau).
 * - LEGIFRANCE_FORCE_FALLBACK=static → searchArticles bypass tout et renvoie static.
 * - isUpstashConfigured() reflète env.
 * - Postgres L1 hit : insert sentinel via service client → getArticle → cleanup.
 */

import { test, expect } from '@playwright/test'
import { searchStatic, LAW_CONTEXT_STATIC } from '../src/lib/legifrance/static'
import { searchArticles, getArticle, isUpstashConfigured, _internal } from '../src/lib/legifrance/cache'
import type { LegifranceArticle } from '../src/lib/legifrance/types'

test.describe('C7 F4 — cache layered', () => {
  test('LAW_CONTEXT_STATIC contient 12 articles (les 12 critiques)', () => {
    expect(LAW_CONTEXT_STATIC).toHaveLength(12)
    const cids = LAW_CONTEXT_STATIC.map((a) => a.cid)
    expect(cids).toContain('STATIC_RSA_L262-1')
    expect(cids).toContain('STATIC_ARE_L5422-1')
    expect(cids).toContain('STATIC_AAH_L821-1_CSS')
    expect(cids).toContain('STATIC_CEP_L6111-6')
  })

  test('searchStatic match "chômage" → au moins ARE', () => {
    const results = searchStatic('chômage allocation retour emploi', 5)
    expect(results.length).toBeGreaterThan(0)
    const numeros = results.map((r) => r.numero)
    expect(numeros).toContain('L5422-1')
  })

  test('searchStatic match "handicap AAH" → AAH + PCH + MDPH', () => {
    const results = searchStatic('handicap AAH allocation adulte', 5)
    expect(results.length).toBeGreaterThan(0)
    const titres = results.map((r) => r.titre).join(' | ')
    expect(titres.toLowerCase()).toContain('handicap')
  })

  test('searchStatic vide si query trop courte ou hors scope', () => {
    const results = searchStatic('zzzzzzz xxxx yyyy', 5)
    expect(results).toHaveLength(0)
  })

  test('isUpstashConfigured reflète ENV', () => {
    const hasEnv = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    expect(isUpstashConfigured()).toBe(hasEnv)
  })

  test('searchArticles respecte LEGIFRANCE_FORCE_FALLBACK=static', async () => {
    const orig = process.env.LEGIFRANCE_FORCE_FALLBACK
    process.env.LEGIFRANCE_FORCE_FALLBACK = 'static'
    try {
      const results = await searchArticles({ query: 'allocation emploi retour' })
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].source).toBe('static')
    } finally {
      if (orig) process.env.LEGIFRANCE_FORCE_FALLBACK = orig
      else delete process.env.LEGIFRANCE_FORCE_FALLBACK
    }
  })

  test('getArticle chaîne : Postgres miss → PISTE skip (creds absents) → static lookup', async () => {
    // Aucun article réel en DB, PISTE non configuré → doit retourner static si cid match, sinon null
    const staticArticle = await getArticle('STATIC_RSA_L262-1')
    expect(staticArticle).not.toBeNull()
    expect(staticArticle?.numero).toBe('L262-1')

    const nonExistent = await getArticle('NONEXISTENT_CID_ZZZ')
    expect(nonExistent).toBeNull()
  })

  test('Postgres L1 round-trip via upsert + getByCid', async () => {
    const sentinel: LegifranceArticle = {
      cid: 'TEST_C7_F4_SENTINEL',
      code: 'LEGITEXT000006072050',
      code_nom: 'Code du travail',
      numero: 'TEST-1',
      titre: 'Article test C7 F4',
      texte: 'Texte sentinel pour test cache layered VIDA.',
      date_debut: '2026-01-01T00:00:00.000Z',
      date_fin: null,
      etat: 'VIGUEUR',
      url_legifrance: 'https://legifrance.gouv.fr/test',
      version_num: 1,
      last_synced_at: new Date().toISOString(),
    }

    try {
      await _internal.l1Upsert(sentinel)
      const fetched = await _internal.l1GetByCid('TEST_C7_F4_SENTINEL')
      expect(fetched).not.toBeNull()
      expect(fetched?.numero).toBe('TEST-1')
      expect(fetched?.texte).toContain('sentinel')

      // FTS search retrouve le sentinel
      const results = await _internal.l1Search({ query: 'sentinel VIDA test' })
      expect(results.length).toBeGreaterThan(0)
    } finally {
      // Cleanup
      const { createServiceClient } = await import('../src/lib/supabase')
      const supabase = createServiceClient()
      await supabase
        .schema('vida_sante')
        .from('legifrance_articles')
        .delete()
        .eq('cid', 'TEST_C7_F4_SENTINEL')
    }
  })
})
