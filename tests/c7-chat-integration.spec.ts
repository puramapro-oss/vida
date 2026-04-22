/**
 * C7 F8 — Tests d'intégration chat RAG dynamique.
 *
 * Vérifie :
 * - Le chat reste fonctionnel côté anon (401 propre).
 * - searchArticles() renvoie des résultats exploitables (static fallback si Postgres vide).
 * - Articles sentinels insérés en Postgres → remontés par searchArticles (path dynamique).
 */

import { test, expect } from '@playwright/test'
import { searchArticles } from '../src/lib/legifrance/cache'
import { createServiceClient } from '../src/lib/supabase'
import type { LegifranceArticle } from '../src/lib/legifrance/types'

test.describe('C7 F8 — chat integration', () => {
  test('GET /api/chat sans auth → 401 (endpoint toujours sain)', async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://vida.purama.dev'
    const response = await request.post(`${baseURL}/api/chat`, {
      data: { messages: [{ role: 'user', content: 'droits handicap AAH' }] },
      failOnStatusCode: false,
    })
    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toContain('connecté')
  })

  test('searchArticles fallback static quand Postgres sans match', async () => {
    const results = await searchArticles({ query: 'handicap AAH allocation adulte', topK: 5 })
    expect(results.length).toBeGreaterThan(0)
    // Au moins le fallback static renvoie les articles hardcodés
    const titres = results.map((r) => r.article.titre).join(' | ').toLowerCase()
    expect(titres).toContain('handicap')
  })

  test('Postgres dynamique : sentinels seed → searchArticles les remonte en priorité', async () => {
    const supabase = createServiceClient()
    const sentinels: Partial<LegifranceArticle>[] = [
      {
        cid: 'TEST_F8_AAH',
        code: 'LEGITEXT000006073189',
        code_nom: 'Code de la sécurité sociale',
        numero: 'L821-99',
        titre: 'Test F8 AAH',
        texte: "Dispositions test C7 F8 relatives à l'allocation adultes handicapés handicap taux 80%.",
        etat: 'VIGUEUR',
        url_legifrance: 'https://legifrance.gouv.fr/test-f8-aah',
        version_num: 1,
        last_synced_at: new Date().toISOString(),
      },
      {
        cid: 'TEST_F8_MDPH',
        code: 'LEGITEXT000006074069',
        code_nom: "Code de l'action sociale et des familles",
        numero: 'L146-99',
        titre: 'Test F8 MDPH',
        texte: "Dispositions test C7 F8 MDPH reconnaissance handicap taux dossier.",
        etat: 'VIGUEUR',
        url_legifrance: 'https://legifrance.gouv.fr/test-f8-mdph',
        version_num: 1,
        last_synced_at: new Date().toISOString(),
      },
    ]

    try {
      await supabase
        .schema('vida_sante')
        .from('legifrance_articles')
        .upsert(sentinels, { onConflict: 'cid' })

      const results = await searchArticles({ query: 'reconnaissance handicap MDPH dossier', topK: 3 })
      expect(results.length).toBeGreaterThan(0)

      // Source attendue = postgres (pas static) dès que Postgres renvoie qqch
      expect(['postgres', 'pinecone']).toContain(results[0].source)

      // Le sentinel MDPH doit ressortir en priorité
      const cids = results.map((r) => r.article.cid)
      expect(cids).toContain('TEST_F8_MDPH')
    } finally {
      await supabase
        .schema('vida_sante')
        .from('legifrance_articles')
        .delete()
        .in('cid', ['TEST_F8_AAH', 'TEST_F8_MDPH'])
    }
  })
})
