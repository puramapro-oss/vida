/**
 * C7 F5 LIVE — Pipeline d'ingestion réel (PISTE → Postgres + optionnel Pinecone).
 *
 * Skip si PISTE creds absents.
 *
 * ⚠️  OpenAI quota sur le compte actuel est dépassé (2026-04-22) → embeddings
 * désactivés par défaut via LEGIFRANCE_SKIP_EMBEDDINGS=1. Le test valide
 * donc le path PISTE → Postgres. Le path Pinecone sera testable dès que le
 * compte OpenAI a du crédit (activable via `skipEmbeddings: false`).
 *
 * Test minimal : 1 article seulement.
 */

import { test, expect } from '@playwright/test'
import { syncArticlesByCid } from '../src/lib/legifrance/ingest'
import { createServiceClient } from '../src/lib/supabase'

const ready = Boolean(process.env.PISTE_CLIENT_ID) && Boolean(process.env.PISTE_CLIENT_SECRET)
const hasOpenAI = Boolean(process.env.OPENAI_API_KEY) && process.env.LEGIFRANCE_SKIP_EMBEDDINGS !== '1'
const hasPinecone = Boolean(process.env.PINECONE_API_KEY)

const TEST_CID = 'LEGIARTI000006900846' // Art. L1221-7 Code du travail

test.describe('C7 F5 LIVE — ingestion pipeline', () => {
  test.skip(!ready, 'PISTE creds absents')

  test.afterAll(async () => {
    try {
      const supabase = createServiceClient()
      await supabase
        .schema('vida_sante')
        .from('legifrance_articles')
        .delete()
        .eq('cid', TEST_CID)

      if (hasPinecone) {
        const { Pinecone } = await import('@pinecone-database/pinecone')
        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
        const index = pc.index(process.env.PINECONE_INDEX_LEGIFRANCE || 'vida-legifrance')
        await index.namespace('legifrance').deleteMany([TEST_CID])
      }
    } catch {
      // ignore cleanup failures
    }
  })

  test('syncArticlesByCid (skipEmbeddings) : PISTE → Postgres upsert', async () => {
    const articles = await syncArticlesByCid(
      [TEST_CID],
      'LEGITEXT000006072050',
      'Code du travail',
      { skipEmbeddings: true },
    )
    expect(articles).toHaveLength(1)
    expect(articles[0].cid).toBe(TEST_CID)
    expect(articles[0].numero).toBe('L1221-7')
    expect(articles[0].texte.length).toBeGreaterThan(100)

    // Vérifier Postgres
    const supabase = createServiceClient()
    const { data } = await supabase
      .schema('vida_sante')
      .from('legifrance_articles')
      .select('*')
      .eq('cid', TEST_CID)
      .maybeSingle()
    expect(data).not.toBeNull()
    expect(data?.numero).toBe('L1221-7')
    expect(data?.code).toBe('LEGITEXT000006072050')
    expect(data?.code_nom).toBe('Code du travail')
  })

  test('syncArticlesByCid (+embeddings) : PISTE → Postgres + Pinecone upsert', async () => {
    test.skip(!hasOpenAI || !hasPinecone, 'OpenAI quota épuisé ou Pinecone non configuré')
    const { searchByEmbedding } = await import('../src/lib/legifrance/ingest')
    await syncArticlesByCid([TEST_CID], 'LEGITEXT000006072050', 'Code du travail', { skipEmbeddings: false })
    await new Promise((r) => setTimeout(r, 2500))
    const matches = await searchByEmbedding('anonymat candidat embauche entreprise', 3)
    const cids = matches.map((m) => m.cid)
    expect(cids).toContain(TEST_CID)
  })
})
