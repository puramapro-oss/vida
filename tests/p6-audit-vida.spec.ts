/**
 * VIDA — P6 Audit (pages 200, auth redirect, responsive, forms)
 * Remplace p6-audit.spec.ts AKASHA-era.
 * Cible baseURL Playwright (prod https://vida.purama.dev).
 */

import { test, expect, type Page } from '@playwright/test'

// Routes VIDA réelles (pas AKASHA)
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
  '/aide',
  '/contact',
  '/how-it-works',
  '/ecosystem',
  '/status',
  '/changelog',
  '/offline',
  '/financer',
  '/fiscal',
  '/subscribe',
  '/ambassadeur',
]

const DASHBOARD_PAGES = [
  '/dashboard',
  '/dashboard/boutique',
  '/dashboard/breathe',
  '/dashboard/carte',
  '/dashboard/chat',
  '/dashboard/classement',
  '/dashboard/communaute',
  '/dashboard/concours',
  '/dashboard/daily-gift',
  '/dashboard/dons',
  '/dashboard/gratitude',
  '/dashboard/guide',
  '/dashboard/influenceur', // redirige vers /ambassadeur en auth
  '/dashboard/missions',
  '/dashboard/notifications',
  '/dashboard/partage',
  '/dashboard/profile',
  '/dashboard/referral',
  '/dashboard/rituels',
  '/dashboard/settings',
  '/dashboard/tirage',
  '/dashboard/univers',
  '/dashboard/wallet',
]

function attachConsole(page: Page) {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

function realErrors(errors: string[]) {
  // Filtre les faux-positifs bien connus (Supabase anon 401, favicon, hydration)
  return errors.filter(
    (e) =>
      !e.includes('Failed to load resource') &&
      !e.includes('favicon') &&
      !e.includes('manifest') &&
      !e.includes('hydrat') &&
      !e.includes('Warning:') &&
      !e.includes('Supabase') &&
      !e.includes('ERR_CONNECTION') &&
      !e.includes('net::')
  )
}

test.describe('P6 AUDIT VIDA — Public pages 200 + console propre', () => {
  for (const path of PUBLIC_PAGES) {
    test(`PUBLIC ${path} — 200 + 0 console error`, async ({ page }) => {
      const errors = attachConsole(page)
      const res = await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 15000 })
      expect(res?.status(), `${path} status`).toBeLessThan(400)
      const real = realErrors(errors)
      expect(real, `console errors on ${path}: ${real.join(' | ')}`).toHaveLength(0)
    })
  }
})

test.describe('P6 AUDIT VIDA — Dashboard routes (redirect auth)', () => {
  for (const path of DASHBOARD_PAGES) {
    test(`DASHBOARD ${path} — non-auth → /login`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 15000 })
      expect(res?.status(), `${path} status`).toBeLessThan(500)
      // Soit redirect /login, soit page /login elle-même servie
      expect(page.url(), `${path} should redirect to /login`).toMatch(/\/login/)
    })
  }
})

test.describe('P6 AUDIT VIDA — Responsive (3 breakpoints × 3 pages)', () => {
  const pages = ['/', '/pricing', '/financer']
  const viewports = [
    { w: 375, h: 667, name: 'iPhone SE (375)' },
    { w: 768, h: 1024, name: 'iPad (768)' },
    { w: 1920, h: 1080, name: 'Desktop (1920)' },
  ]
  for (const vp of viewports) {
    for (const p of pages) {
      test(`${p} — 0 overflow horizontal à ${vp.name}`, async ({ page }) => {
        // skip disclaimer for /financer
        if (p === '/financer') {
          await page.addInitScript(() => {
            localStorage.setItem('vida_financer_disclaimer_ack', JSON.stringify({
              expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
            }))
          })
        }
        await page.setViewportSize({ width: vp.w, height: vp.h })
        await page.goto(p, { waitUntil: 'domcontentloaded' })
        const overflow = await page.evaluate(() =>
          document.documentElement.scrollWidth > window.innerWidth + 1
        )
        expect(overflow, `${p} @ ${vp.name} doit pas overflow`).toBe(false)
      })
    }
  }
})

test.describe('P6 AUDIT VIDA — APIs publiques', () => {
  test('GET /api/status → 200 + {status:ok, app:VIDA}', async ({ request }) => {
    const res = await request.get('/api/status')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('ok')
    expect(json.app).toBe('VIDA')
  })

  test('POST /api/chat non-auth → 401', async ({ request }) => {
    const res = await request.post('/api/chat', {
      data: { messages: [{ role: 'user', content: 'hi' }] },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(401)
  })

  test('GET /sitemap.xml → 200 + XML', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const text = await res.text()
    expect(text).toContain('<?xml')
  })

  test('GET /robots.txt → 200', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    expect((await res.text()).toLowerCase()).toContain('sitemap')
  })

  test('GET /manifest.json → 200 + VIDA', async ({ request }) => {
    const res = await request.get('/manifest.json')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.name).toBe('VIDA')
  })
})

test.describe('P6 AUDIT VIDA — Forms critiques', () => {
  test('Login — inputs typeable + bouton submit cliquable', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('email-input').fill('test@vida.purama.dev')
    await page.getByTestId('password-input').fill('TestPass1234')
    await expect(page.getByTestId('email-input')).toHaveValue('test@vida.purama.dev')
    await expect(page.getByTestId('login-button')).toBeEnabled()
  })

  test('Signup — 5 champs + CGU + password strength', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByTestId('name-input')).toBeVisible()
    await expect(page.getByTestId('email-input')).toBeVisible()
    await expect(page.getByTestId('password-input')).toBeVisible()
    await expect(page.getByTestId('confirm-password-input')).toBeVisible()
    await expect(page.getByTestId('cgu-checkbox')).toBeVisible()
    await page.getByTestId('password-input').fill('Str0ng!Pass')
    await expect(page.locator('body')).toContainText(/Faible|Moyen|Fort|Excellent/)
  })

  test('Contact — form fields accessibles', async ({ page }) => {
    const res = await page.goto('/contact')
    expect(res?.status()).toBe(200)
    // Champs natifs (name/email/subject/message) — on vérifie au moins email + textarea
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
    await expect(page.locator('textarea').first()).toBeVisible()
  })
})

test.describe('P6 AUDIT VIDA — Landing content', () => {
  test('Landing — hero + CTA + pricing teaser + footer SASU PURAMA', async ({ page }) => {
    await page.goto('/')
    const body = page.locator('body')
    await expect(body).toContainText('VIDA')
    await expect(page.locator('a[href="/signup"]').first()).toBeVisible()
    const footer = page.locator('footer').first()
    await expect(footer).toContainText(/SASU PURAMA|Frasne/)
  })
})
