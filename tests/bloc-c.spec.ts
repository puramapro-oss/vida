import { test, expect } from '@playwright/test'

const DISCLAIMER_STORAGE_KEY = 'vida_financer_disclaimer_ack'

async function skipDisclaimer(page: import('@playwright/test').Page) {
  await page.addInitScript((key) => {
    const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000
    localStorage.setItem(key, JSON.stringify({ expiresAt }))
  }, DISCLAIMER_STORAGE_KEY)
}

test.describe('Bloc C — /financer UI (C1 + C2 + C8)', () => {
  test('C8 — disclaimer modal 1ère visite puis wizard', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/financer')
    const modal = page.getByTestId('financer-disclaimer')
    await expect(modal).toBeVisible({ timeout: 5000 })
    // Le texte doit être DANS le modal (pas dans le footer de la page qui le contient aussi)
    await expect(modal.getByText("VIDA n'est pas un organisme social")).toBeVisible()
    await page.getByTestId('financer-disclaimer-ack').click()
    await expect(modal).not.toBeVisible()
    await expect(page.getByTestId('profil-salarie')).toBeVisible()
  })

  test('C1 — wizard public soumet → step 2 avec cards', async ({ page }) => {
    await skipDisclaimer(page)
    await page.goto('/financer')
    await page.getByTestId('profil-salarie').click()
    await page.getByTestId('profil-locataire').click()
    await page.getByTestId('financer-submit').click()
    const firstCard = page.locator('[data-testid^="aide-card-"]').first()
    await expect(firstCard).toBeVisible({ timeout: 10000 })
    const cardCount = await page.locator('[data-testid^="aide-card-"]').count()
    expect(cardCount).toBeGreaterThan(0)
  })

  test('C1 — toggle Affiner révèle les 5 champs OpenFisca', async ({ page }) => {
    await skipDisclaimer(page)
    await page.goto('/financer')
    await page.getByTestId('financer-toggle-advanced').click()
    await expect(page.getByTestId('financer-age')).toBeVisible()
    await expect(page.getByTestId('financer-revenus')).toBeVisible()
    await expect(page.getByTestId('financer-enfants')).toBeVisible()
    await expect(page.getByTestId('financer-loyer')).toBeVisible()
    await expect(page.getByTestId('financer-region')).toBeVisible()
  })

  test('C2 — cards affichent badge Plafond estimatif + section Base légale', async ({ page }) => {
    await skipDisclaimer(page)
    await page.goto('/financer')
    await page.getByTestId('profil-salarie').click()
    await page.getByTestId('profil-locataire').click()
    await page.getByTestId('financer-submit').click()
    await page.waitForSelector('[data-testid^="aide-card-"]', { timeout: 10000 })
    // Flux public → fallback static → badges "Plafond estimatif" visibles
    await expect(page.getByText('Plafond estimatif').first()).toBeVisible()
    await expect(page.getByText('Base légale').first()).toBeVisible()
  })
})

test.describe('Bloc C/D — APIs', () => {
  test('C1 — /api/aides/search exige auth (401 sans session)', async ({ request }) => {
    const res = await request.post('/api/aides/search', {
      data: { situation: ['salarie'] },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(401)
  })

  test('D — /api/aides/legifrance exige auth (401 sans session)', async ({ request }) => {
    const res = await request.post('/api/aides/legifrance', {
      data: { query: 'Suis-je éligible au RSA en 2026 ?' },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(401)
  })

  test('C1 — /api/financer/match public retourne aides + base légale', async ({ request }) => {
    const res = await request.post('/api/financer/match', {
      data: {
        situation:        ['salarie', 'parent'],
        age:              34,
        revenus_mensuels: 1800,
        enfants:          2,
        loyer_mensuel:    650,
        region:           'ile-de-france',
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json() as {
      count: number
      cumul_estime: number
      aides: { legifrance_refs?: string[] }[]
    }
    expect(body.count).toBeGreaterThan(0)
    expect(body.cumul_estime).toBeGreaterThan(0)
    // Les aides ont legifrance_refs (post-migration 009)
    const withRefs = body.aides.filter(
      (a) => Array.isArray(a.legifrance_refs) && a.legifrance_refs.length > 0
    )
    expect(withRefs.length).toBeGreaterThan(0)
  })

  test('C4 — chaque aide retournée par /match a au moins une ref Legifrance', async ({ request }) => {
    const res = await request.post('/api/financer/match', {
      data: { situation: ['salarie', 'locataire', 'parent'] },
    })
    expect(res.status()).toBe(200)
    const body = await res.json() as {
      aides: { slug: string; legifrance_refs?: string[] }[]
    }
    const missingRefs = body.aides.filter(
      (a) => !Array.isArray(a.legifrance_refs) || a.legifrance_refs.length === 0
    )
    // Toutes les aides actives doivent avoir leur base légale (cf migration 009).
    expect(missingRefs.map((a) => a.slug)).toEqual([])
  })
})
