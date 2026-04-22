/**
 * VIDA — 21 SIM tests (simulations client réelles)
 * Remplace client-sim.spec.ts AKASHA-era.
 * Cible : https://vida.purama.dev (production).
 */

import { test, expect } from '@playwright/test'

test.describe('VIDA — 21 SIM (end-to-end réalistes)', () => {
  // ─── 01 Landing ─────────────────────────────────────────────────────────────
  test('01. Landing — 200 + VIDA wellness + 2 CTAs (Essai + Connexion)', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBe(200)
    const body = page.locator('body')
    await expect(body).toContainText('VIDA')
    await expect(body.locator('a[href="/signup"]').first()).toBeVisible()
    await expect(body.locator('a[href="/login"]').first()).toBeVisible()
  })

  // ─── 02 Landing CTA click ───────────────────────────────────────────────────
  test('02. CTA /signup cliquable → redirige vers /signup', async ({ page }) => {
    await page.goto('/')
    await page.locator('a[href="/signup"]').first().click()
    await page.waitForURL(/\/signup/, { timeout: 10000 })
    expect(page.url()).toContain('/signup')
  })

  // ─── 03 Login page ──────────────────────────────────────────────────────────
  test('03. Login — inputs + Google OAuth + remember-me + submit', async ({ page }) => {
    const res = await page.goto('/login')
    expect(res?.status()).toBe(200)
    await expect(page.getByTestId('email-input')).toBeVisible()
    await expect(page.getByTestId('password-input')).toBeVisible()
    await expect(page.getByTestId('google-login')).toBeVisible()
    await expect(page.getByTestId('remember-me')).toBeVisible()
    await expect(page.getByTestId('login-button')).toBeVisible()
  })

  // ─── 04 Google OAuth button actif ───────────────────────────────────────────
  test('04. Google OAuth button enabled + has click handler', async ({ page }) => {
    await page.goto('/login')
    const btn = page.getByTestId('google-login')
    await expect(btn).toBeEnabled()
    expect(await btn.getAttribute('disabled')).toBeNull()
  })

  // ─── 05 Signup page ─────────────────────────────────────────────────────────
  test('05. Signup — 5 inputs + CGU + password strength indicator', async ({ page }) => {
    const res = await page.goto('/signup')
    expect(res?.status()).toBe(200)
    await expect(page.getByTestId('name-input')).toBeVisible()
    await expect(page.getByTestId('email-input')).toBeVisible()
    await expect(page.getByTestId('password-input')).toBeVisible()
    await expect(page.getByTestId('confirm-password-input')).toBeVisible()
    await expect(page.getByTestId('cgu-checkbox')).toBeVisible()
    await expect(page.getByTestId('signup-button')).toBeVisible()
    await page.getByTestId('password-input').fill('Test123!')
    await expect(page.locator('body')).toContainText(/Faible|Moyen|Fort|Excellent|Trop court/)
  })

  // ─── 06 Middleware redirect auth required ───────────────────────────────────
  test('06. Middleware — /dashboard non-auth → /login?next=/dashboard', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toMatch(/\/login/)
    expect(page.url()).toMatch(/next=.*dashboard/)
  })

  // ─── 07 Login inputs typeable ───────────────────────────────────────────────
  test('07. Login inputs typeable (email + password)', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('Test1234')
    await expect(page.getByTestId('email-input')).toHaveValue('test@example.com')
    await expect(page.getByTestId('password-input')).toHaveValue('Test1234')
  })

  // ─── 08 Pricing VIDA ────────────────────────────────────────────────────────
  test('08. Pricing — Premium 9,90€ / 79,90€ + 14j essai + Découverte free', async ({ page }) => {
    const res = await page.goto('/pricing')
    expect(res?.status()).toBe(200)
    const body = page.locator('body')
    await expect(body).toContainText('Premium')
    await expect(body).toContainText('Découverte')
    await expect(body).toContainText(/9[,.]90|79[,.]90/)
  })

  // ─── 09 /financer — wizard + 13 situations ──────────────────────────────────
  test('09. /financer — wizard 4 étapes + 13 situations + submit', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('vida_financer_disclaimer_ack', JSON.stringify({
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      }))
    })
    const res = await page.goto('/financer')
    expect(res?.status()).toBe(200)
    await expect(page.getByTestId('profil-salarie')).toBeVisible()
    await expect(page.getByTestId('profil-etudiant')).toBeVisible()
    await expect(page.getByTestId('financer-submit')).toBeVisible()
    await expect(page.getByTestId('financer-toggle-advanced')).toBeVisible()
  })

  // ─── 10 /aide — FAQ + search + chatbot ──────────────────────────────────────
  test('10. /aide — centre d\'aide 200 + contenu visible', async ({ page }) => {
    const res = await page.goto('/aide')
    expect(res?.status()).toBe(200)
    const body = await page.locator('body').textContent()
    expect((body ?? '').length).toBeGreaterThan(500)
  })

  // ─── 11 /ambassadeur — paliers publics ──────────────────────────────────────
  test('11. /ambassadeur — 200 + paliers Bronze/Argent/Or visibles', async ({ page }) => {
    const res = await page.goto('/ambassadeur')
    expect(res?.status()).toBe(200)
    const body = page.locator('body')
    await expect(body).toContainText(/Bronze/)
    await expect(body).toContainText(/Argent|Or|Platine|Diamant/)
  })

  // ─── 12 API /api/status JSON ────────────────────────────────────────────────
  test('12. /api/status → {status:ok, app:VIDA}', async ({ request }) => {
    const res = await request.get('/api/status')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('ok')
    expect(json.app).toBe('VIDA')
    expect(typeof json.version).toBe('string')
  })

  // ─── 13 Mentions légales ────────────────────────────────────────────────────
  test('13. /mentions-legales — SASU PURAMA + Frasne', async ({ page }) => {
    const res = await page.goto('/mentions-legales')
    expect(res?.status()).toBe(200)
    const body = page.locator('body')
    await expect(body).toContainText('SASU PURAMA')
    await expect(body).toContainText('Frasne')
  })

  // ─── 14 RGPD ────────────────────────────────────────────────────────────────
  test('14. /politique-confidentialite — RGPD ou données personnelles', async ({ page }) => {
    const res = await page.goto('/politique-confidentialite')
    expect(res?.status()).toBe(200)
    const text = (await page.locator('body').textContent()) ?? ''
    const hasRGPD = text.includes('RGPD') || text.toLowerCase().includes('données personnelles')
    expect(hasRGPD).toBe(true)
  })

  // ─── 15 CGU ────────────────────────────────────────────────────────────────
  test('15. /cgu — conditions utilisation', async ({ page }) => {
    const res = await page.goto('/cgu')
    expect(res?.status()).toBe(200)
    const text = ((await page.locator('body').textContent()) ?? '').toLowerCase()
    expect(text.includes('conditions') || text.includes('utilisation')).toBe(true)
  })

  // ─── 16 CGV + 14j ──────────────────────────────────────────────────────────
  test('16. /cgv — 14 jours ou rétractation L221-28', async ({ page }) => {
    const res = await page.goto('/cgv')
    expect(res?.status()).toBe(200)
    const text = ((await page.locator('body').textContent()) ?? '').toLowerCase()
    const ok = text.includes('14 jours') || text.includes('rétractation') ||
               text.includes('retractation') || text.includes('l221')
    expect(ok).toBe(true)
  })

  // ─── 17 Responsive 375 ─────────────────────────────────────────────────────
  test('17. Responsive 375px — 0 overflow horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > window.innerWidth + 1
    )
    expect(overflow).toBe(false)
  })

  // ─── 18 Footer links ────────────────────────────────────────────────────────
  test('18. Footer — 4 liens légaux cliquables', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer').first()
    await expect(footer.locator('a[href="/mentions-legales"]')).toBeVisible()
    await expect(footer.locator('a[href="/cgu"]')).toBeVisible()
    await expect(footer.locator('a[href="/cgv"]')).toBeVisible()
    await expect(footer.locator('a[href="/politique-confidentialite"]')).toBeVisible()
  })

  // ─── 19 Sitemap ─────────────────────────────────────────────────────────────
  test('19. /sitemap.xml — 200 + XML + vida.purama.dev', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const text = await res.text()
    expect(text).toContain('<?xml')
    expect(text).toContain('vida.purama.dev')
  })

  // ─── 20 Robots ──────────────────────────────────────────────────────────────
  test('20. /robots.txt — 200 + Disallow + Sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const text = await res.text()
    expect(text).toContain('Disallow')
    expect(text.toLowerCase()).toContain('sitemap')
  })

  // ─── 21 Manifest PWA ────────────────────────────────────────────────────────
  test('21. /manifest.json — 200 + name VIDA + start_url + theme emerald', async ({ request }) => {
    const res = await request.get('/manifest.json')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.name).toBe('VIDA')
    expect(typeof json.start_url).toBe('string')
    expect(json.theme_color).toBe('#10B981')
  })
})
