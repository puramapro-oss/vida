/**
 * C7 F2 — Test d'intégration LIVE contre le sandbox PISTE.
 * Skippé si PISTE_CLIENT_ID/SECRET absents.
 *
 * ⚠️  Ces tests consomment le quota sandbox PISTE (généralement généreux,
 * ~1000 req/min). Gardés minimalistes : 2 calls max.
 */

import { test, expect } from '@playwright/test'
import { getAccessToken, getArticleByCid, isPisteConfigured, _internal } from '../src/lib/legifrance/piste'

const hasCreds = Boolean(process.env.PISTE_CLIENT_ID && process.env.PISTE_CLIENT_SECRET)

test.describe('C7 F2 LIVE — PISTE sandbox real call', () => {
  test.skip(!hasCreds, 'PISTE_CLIENT_ID/SECRET absents — skip')

  test('getAccessToken renvoie un Bearer token valide', async () => {
    _internal.clearTokenCache()
    expect(isPisteConfigured()).toBe(true)

    const token = await getAccessToken()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(30) // token PISTE font ~50 chars

    // Appel suivant doit hit le cache
    const token2 = await getAccessToken()
    expect(token2).toBe(token)
  })

  test('getArticleByCid récupère Art. L1221-7 du Code du travail', async () => {
    // Art. L1221-7 (anonymat candidats >50 salariés) = valeur test connue
    const article = await getArticleByCid('LEGIARTI000006900846', 'LEGITEXT000006072050', 'Code du travail')

    expect(article).not.toBeNull()
    expect(article!.cid).toBe('LEGIARTI000006900846')
    expect(article!.numero).toBe('L1221-7')
    expect(article!.code).toBe('LEGITEXT000006072050')
    expect(article!.code_nom).toBe('Code du travail')
    expect(article!.texte.length).toBeGreaterThan(100)
    expect(article!.texte).toContain('anonymat')
    expect(['VIGUEUR', 'MODIFIE']).toContain(article!.etat) // peut varier selon version
    expect(article!.url_legifrance).toBe('https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006900846')
  })
})
