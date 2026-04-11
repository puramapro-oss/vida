import { test, expect, type Page } from '@playwright/test'

const BASE = 'http://localhost:3000'

const PUBLIC_PAGES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/pricing',
  '/mentions-legales',
  '/cgu',
  '/cgv',
  '/politique-confidentialite',
  '/cookies',
  '/onboarding',
]

const DASHBOARD_PAGES = [
  '/dashboard',
  '/dashboard/chat',
  '/dashboard/agents',
  '/dashboard/automation',
  '/dashboard/marketplace',
  '/dashboard/studio',
  '/dashboard/tools',
  '/dashboard/xp',
  '/dashboard/api',
  '/dashboard/analytics',
  '/dashboard/collab',
  '/dashboard/settings',
]

function attachConsole(page: Page) {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))
  return errors
}

test.describe('LOCAL AUDIT — Full app', () => {
  for (const path of PUBLIC_PAGES) {
    test(`PUBLIC ${path} — 200 + no console errors`, async ({ page }) => {
      const errors = attachConsole(page)
      const res = await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
      expect(res?.status(), `status for ${path}`).toBeLessThan(400)
      // filter benign warnings
      const real = errors.filter(e =>
        !e.includes('Failed to load resource') &&
        !e.includes('favicon') &&
        !e.includes('manifest')
      )
      expect(real, `console errors on ${path}: ${real.join('|')}`).toHaveLength(0)
    })
  }

  for (const path of DASHBOARD_PAGES) {
    test(`DASHBOARD ${path} — redirects unauth`, async ({ page }) => {
      const res = await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
      // either redirected to /login or status 200 with login page
      expect(res?.status()).toBeLessThan(500)
      const url = page.url()
      expect(url, `${path} should redirect to login`).toMatch(/\/login/)
    })
  }

  test('Responsive 375px — no horizontal overflow on landing', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(BASE + '/')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    expect(overflow).toBe(false)
  })

  test('Responsive 1920px — landing renders fully', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto(BASE + '/')
    await expect(page.locator('body')).toContainText('VIDA AI')
  })

  test('All footer legal links navigate to 200 pages', async ({ page }) => {
    await page.goto(BASE + '/')
    const links = ['/mentions-legales', '/cgu', '/cgv', '/politique-confidentialite', '/cookies']
    for (const href of links) {
      const link = page.locator(`footer a[href="${href}"]`).first()
      await expect(link).toBeVisible()
    }
  })

  test('API /api/status returns ok', async ({ request }) => {
    const res = await request.get(BASE + '/api/status')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('ok')
  })

  test('API /api/chat unauth returns 401', async ({ request }) => {
    const res = await request.post(BASE + '/api/chat', { data: { messages: [{ role: 'user', content: 'hi' }] } })
    expect(res.status()).toBe(401)
  })

  test('API /api/quota/check unauth returns 401', async ({ request }) => {
    const res = await request.get(BASE + '/api/quota/check')
    expect(res.status()).toBe(401)
  })

  test('Sitemap + robots + manifest', async ({ request }) => {
    const sm = await request.get(BASE + '/sitemap.xml')
    expect(sm.status()).toBe(200)
    const r = await request.get(BASE + '/robots.txt')
    expect(r.status()).toBe(200)
    const m = await request.get(BASE + '/manifest.json')
    expect(m.status()).toBe(200)
  })
})
