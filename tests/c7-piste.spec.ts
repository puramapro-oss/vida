/**
 * C7 F2 — Tests unitaires du client PISTE (sans vraies creds).
 * Quand les ENV PISTE_CLIENT_ID/SECRET seront définis, ces tests resteront
 * verts car on teste le comportement sans réseau (pas de call live ici).
 */

import { test, expect } from '@playwright/test'
import { mock } from 'node:test'
import { isPisteConfigured, getAccessToken, getArticleByCid, searchInCode, _internal } from '../src/lib/legifrance/piste'
import { TARGETED_CODES, LegifranceError } from '../src/lib/legifrance/types'

test.describe('C7 F2 — PISTE client', () => {
  test('TARGETED_CODES contient les 3 codes ciblés avec bons LEGITEXT', () => {
    expect(TARGETED_CODES.TRAVAIL.id).toBe('LEGITEXT000006072050')
    expect(TARGETED_CODES.SECURITE_SOCIALE.id).toBe('LEGITEXT000006073189')
    expect(TARGETED_CODES.ACTION_SOCIALE.id).toBe('LEGITEXT000006074069')
    expect(TARGETED_CODES.TRAVAIL.nom).toBe('Code du travail')
  })

  test('LegifranceError porte source + retriable + statusCode', () => {
    const err = new LegifranceError('boom', 'piste', true, 503)
    expect(err.name).toBe('LegifranceError')
    expect(err.source).toBe('piste')
    expect(err.retriable).toBe(true)
    expect(err.statusCode).toBe(503)
    expect(err.message).toBe('boom')
  })

  test('isPisteConfigured reflète la présence des ENV', () => {
    const hasEnv = Boolean(process.env.PISTE_CLIENT_ID && process.env.PISTE_CLIENT_SECRET)
    expect(isPisteConfigured()).toBe(hasEnv)
  })

  test('getAccessToken throw LegifranceError explicite si creds absents', async () => {
    const origId = process.env.PISTE_CLIENT_ID
    const origSecret = process.env.PISTE_CLIENT_SECRET
    delete process.env.PISTE_CLIENT_ID
    delete process.env.PISTE_CLIENT_SECRET
    _internal.clearTokenCache()

    let caught: Error | null = null
    try {
      await getAccessToken()
    } catch (e) {
      caught = e as Error
    }
    expect(caught).not.toBeNull()
    expect(caught?.message).toContain('PISTE_CLIENT_ID')
    expect((caught as LegifranceError).source).toBe('piste')
    expect((caught as LegifranceError).retriable).toBe(false)

    if (origId) process.env.PISTE_CLIENT_ID = origId
    if (origSecret) process.env.PISTE_CLIENT_SECRET = origSecret
  })
})

test.describe('C7 F2 — recherche PISTE par code', () => {
  const originalFetch = globalThis.fetch
  const originalId = process.env.PISTE_CLIENT_ID
  const originalSecret = process.env.PISTE_CLIENT_SECRET
  const codeId = 'LEGITEXT000006070721'
  const otherCode = 'LEGITEXT000006072050'
  const codeTitle = { id: null, cid: codeId, title: 'Code civil' }
  const version = 'LEGIARTI000032041188'
  const stable = 'LEGIARTI000006436562'
  const second = 'LEGIARTI000006444283'

  test.beforeEach(() => {
    process.env.PISTE_CLIENT_ID = 'test-client'
    process.env.PISTE_CLIENT_SECRET = 'test-secret'
    _internal.clearTokenCache()
  })

  test.afterEach(() => {
    globalThis.fetch = originalFetch
    if (originalId === undefined) delete process.env.PISTE_CLIENT_ID
    else process.env.PISTE_CLIENT_ID = originalId
    if (originalSecret === undefined) delete process.env.PISTE_CLIENT_SECRET
    else process.env.PISTE_CLIENT_SECRET = originalSecret
    _internal.clearTokenCache()
  })

  type Call = { path: string; body: Record<string, unknown> }
  function serve(handler: (call: Call) => unknown) {
    const calls: Call[] = []
    globalThis.fetch = async (input, init) => {
      if (new Headers(init?.headers).get('Content-Type') === 'application/x-www-form-urlencoded') {
        return Response.json({ access_token: 'test-token', expires_in: 3600 })
      }
      const path = new URL(String(input)).pathname.match(/\/(?:search\/nearestVersion|search|consult\/getArticle)$/)?.[0]
      if (!path) throw new Error('Appel hors contrat dans la recherche PISTE')
      const call = { path, body: JSON.parse(String(init?.body)) as Record<string, unknown> }
      calls.push(call)
      return Response.json(await handler(call))
    }
    return calls
  }

  test('résout un code hors des trois cibles VIDA et relit ses versions par ordre de pertinence', async () => {
    const calls = serve(({ path, body }) => {
      if (path === '/search/nearestVersion') return { title: codeTitle, sectionTitle: null }
      if (path === '/search') {
        return { results: [
          { titles: [{ id: codeId, cid: otherCode, title: 'Code civil' }], sections: [{ extracts: [{ id: second }] }] },
          { titles: [{ id: codeId + '_29-07-2026', cid: codeId }], sections: [
            { id: 'LEGISCTA000006444007', extracts: [{ id: codeId }, { id: version, cid: stable }, { id: version }] },
            { extracts: [{ id: second }, { id: 'LEGIARTI000006444003' }] },
          ] },
        ] }
      }
      return { article: { id: body.id, cid: body.id === version ? stable : second, num: body.id === version ? '1172' : '1847', texte: 'Texte de test' } }
    })

    const articles = await searchInCode(codeId, 'contrat', 2)
    expect(calls.map(c => c.path)).toEqual(['/search/nearestVersion', '/search', '/consult/getArticle', '/consult/getArticle'])
    expect(calls[0].body).toEqual({ cidText: codeId, date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) })
    expect(calls[1].body).toEqual({
      fond: 'CODE_DATE',
      recherche: {
        champs: [{ typeChamp: 'ARTICLE', criteres: [{ typeRecherche: 'UN_DES_MOTS', valeur: 'contrat', operateur: 'ET' }], operateur: 'ET' }],
        filtres: [{ facette: 'NOM_CODE', valeurs: ['Code civil'] }, { facette: 'DATE_VERSION', singleDate: calls[0].body.date }],
        operateur: 'ET', pageNumber: 1, pageSize: 2, sort: 'PERTINENCE', typePagination: 'DEFAUT',
      },
    })
    expect(calls.slice(2).map(c => c.body)).toEqual([{ id: version }, { id: second }])
    expect(articles.map(a => a.cid)).toEqual([stable, second])
    expect(articles[0]).toMatchObject({
      code: codeId, code_nom: 'Code civil', numero: '1172', texte: 'Texte de test',
      url_legifrance: 'https://www.legifrance.gouv.fr/codes/article_lc/' + version,
    })
  })

  test('un code inconnu ne déclenche aucune recherche dans les autres codes', async () => {
    const calls = serve(() => ({ title: null, sectionTitle: null }))
    expect(await searchInCode(codeId, 'société')).toEqual([])
    expect(calls.map(c => c.path)).toEqual(['/search/nearestVersion'])
  })

  test('emploie la date civile française à minuit et conserve la taille par défaut', async () => {
    mock.timers.enable({ apis: ['Date'], now: new Date('2026-07-01T22:15:00Z') })
    try {
      const calls = serve(({ path }) => path === '/search/nearestVersion'
        ? { title: codeTitle }
        : { results: [] })
      expect(await searchInCode(codeId, 'société')).toEqual([])
      expect(calls[1].body.recherche).toMatchObject({
        pageSize: 10,
        filtres: [{ facette: 'NOM_CODE', valeurs: ['Code civil'] }, { facette: 'DATE_VERSION', singleDate: '2026-07-02' }],
      })
    } finally {
      mock.timers.reset()
    }
  })

  test('signale une réponse incomplète ou un code différent du code demandé', async () => {
    for (const metadata of [{}, { title: { cid: otherCode, title: 'Code civil' } }, { title: { cid: codeId, title: ' ' } }]) {
      const calls = serve(() => metadata)
      await expect(searchInCode(codeId, 'société')).rejects.toThrow(/titre du code incohérent/i)
      expect(calls.map(c => c.path)).toEqual(['/search/nearestVersion'])
    }
    const calls = serve(({ path }) => path === '/search/nearestVersion' ? { title: codeTitle } : {})
    await expect(searchInCode(codeId, 'société')).rejects.toThrow(/résultats de recherche PISTE illisibles/i)
    expect(calls.map(c => c.path)).toEqual(['/search/nearestVersion', '/search'])
  })

  test('un titre ou une section sans article ne déclenche aucune relecture', async () => {
    const calls = serve(({ path }) => path === '/search/nearestVersion'
      ? { title: codeTitle }
      : { results: [{ titles: [{ id: codeId }], sections: [{ id: version, extracts: [{ cid: stable }] }] }] })
    expect(await searchInCode(codeId, 'société')).toEqual([])
    expect(calls.map(c => c.path)).toEqual(['/search/nearestVersion', '/search'])
  })

  test('borne la taille demandée et omet les articles absents', async () => {
    const calls = serve(({ path }) => {
      if (path === '/search/nearestVersion') return { title: codeTitle }
      if (path === '/search') return { results: [{ titles: [{ id: codeId }], sections: [{ extracts: [{ id: version }] }] }] }
      return { article: null }
    })
    expect(await searchInCode(codeId, 'société', 10_000)).toEqual([])
    expect(calls[1].body.recherche).toMatchObject({ pageSize: 100 })
    expect(calls[2].body).toEqual({ id: version })
  })

  test('refuse une relecture de version différente ou sans identifiant, avant toute citation', async () => {
    for (const article of [{ id: second, cid: stable }, { cid: stable }]) {
      serve(({ path }) => {
        if (path === '/search/nearestVersion') return { title: codeTitle }
        if (path === '/search') return { results: [{ titles: [{ cid: codeId }], sections: [{ extracts: [{ id: version }] }] }] }
        return { article }
      })
      await expect(searchInCode(codeId, 'contrat')).rejects.toThrow(/version de l’article renvoyée/i)
    }
  })

  test('la consultation historique par CID conserve son lien stable quand la version diffère', async () => {
    const calls = serve(() => ({ article: { id: version, cid: stable, num: '1172' } }))
    const article = await getArticleByCid(stable, codeId, 'Code civil')
    expect(article).toMatchObject({ cid: stable, numero: '1172', url_legifrance: 'https://www.legifrance.gouv.fr/codes/article_lc/' + stable })
    expect(calls).toEqual([{ path: '/consult/getArticle', body: { id: stable } }])
  })

  test('ignore les entrées vides et les limites non utilisables avant tout appel', async () => {
    const calls = serve(() => ({}))
    for (const size of [0, -1, NaN, Infinity]) expect(await searchInCode(codeId, 'société', size)).toEqual([])
    expect(await searchInCode(codeId, '   ')).toEqual([])
    expect(await searchInCode(version, 'société')).toEqual([])
    expect(calls).toEqual([])
  })
})
