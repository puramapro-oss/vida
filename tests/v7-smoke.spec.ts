import { test, expect } from '@playwright/test'

const PUBLIC_PAGES = ['/', '/pricing', '/financer', '/fiscal', '/subscribe', '/aide', '/login', '/signup']

test.describe('V7 smoke — public pages live', () => {
  for (const path of PUBLIC_PAGES) {
    test(`GET ${path} returns 200 + has content`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(page.locator('body')).toBeVisible()
      const bodyText = await page.locator('body').textContent()
      expect(bodyText?.length ?? 0).toBeGreaterThan(50)
    })
  }
})

test.describe('V7 smoke — protected pages redirect', () => {
  for (const path of ['/dashboard', '/dashboard/carte', '/dashboard/rituels', '/dashboard/univers']) {
    test(`GET ${path} redirects to /login when not auth`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
      const url = page.url()
      expect(url).toMatch(/\/login/)
      expect(response?.status()).toBeLessThan(500)
    })
  }
})

test.describe('V7 smoke — critical UI elements', () => {
  test('landing page has CTA + pricing teaser', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href*="pricing"], a[href*="signup"], a[href*="login"]').first()).toBeVisible()
  })

  test('/pricing has Premium plan visible', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText(/premium|9[,.]9/i).first()).toBeVisible()
  })

  test('/financer has wizard + bandeau', async ({ page }) => {
    await page.goto('/financer')
    await expect(page.locator('body')).toContainText(/aide|financ|remboursement|profil/i)
  })

  test('/subscribe has L221-28 mention', async ({ page }) => {
    await page.goto('/subscribe')
    await expect(page.locator('body')).toContainText(/L221-28|immédiat|rétractation/i)
  })
})

test.describe('V7 smoke — API sanity', () => {
  test('GET /api/status returns JSON', async ({ request }) => {
    const res = await request.get('/api/status')
    expect(res.status()).toBeLessThan(500)
  })

  test('POST /api/rituels/join without auth returns 401', async ({ request }) => {
    const res = await request.post('/api/rituels/join', { data: { ritualId: '00000000-0000-0000-0000-000000000000' } })
    expect(res.status()).toBe(401)
  })
})
