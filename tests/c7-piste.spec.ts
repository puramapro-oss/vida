/**
 * C7 F2 — Tests unitaires du client PISTE (sans vraies creds).
 * Quand les ENV PISTE_CLIENT_ID/SECRET seront définis, ces tests resteront
 * verts car on teste le comportement sans réseau (pas de call live ici).
 */

import { test, expect } from '@playwright/test'
import { isPisteConfigured, getAccessToken, _internal } from '../src/lib/legifrance/piste'
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
