import { test, expect } from '@playwright/test'

/**
 * P5 — Landing Polish (anim + respiration + counters)
 * Vérifie les nouveaux éléments P5 sans régression.
 */

test.describe('P5 — Landing polish', () => {
  // Dismiss CinematicIntro + cookie banner avant chaque test UI — zéro overlay bloquant
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('vida_intro_seen', '1')
      localStorage.setItem('vida_cookie_consent', 'accepted')
    })
  })

  test('Impact — API /api/impact/public → 200 + 4 counts numériques', async ({ request }) => {
    const res = await request.get('/api/impact/public')
    expect(res.status()).toBe(200)
    const json = await res.json()
    for (const k of ['missions_count', 'aides_count', 'faq_count', 'users_count']) {
      expect(json).toHaveProperty(k)
      expect(typeof json[k]).toBe('number')
      expect(json[k]).toBeGreaterThanOrEqual(0)
    }
  })

  test('Impact — section "On construit" visible + 4 stats', async ({ page }) => {
    await page.goto('/')
    // Données chargées côté client — wait for any counter
    await expect(page.getByRole('heading', { name: /on construit/i })).toBeVisible({
      timeout: 6000,
    })
    await expect(page.getByText('missions réelles')).toBeVisible()
    await expect(page.getByText('aides recensées')).toBeVisible()
  })

  test('Breath — bouton "Respire avec moi" + ouverture overlay', async ({ page }) => {
    await page.goto('/')
    const trigger = page.getByRole('button', { name: /respire avec moi/i })
    await trigger.scrollIntoViewIfNeeded()
    await expect(trigger).toBeVisible()
    await trigger.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/respiration guidée/i)).toBeAttached() // sr-only h2
    // Close via Passer button
    await dialog.getByRole('button', { name: /passer/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 2000 })
  })

  test('Breath — ESC ferme l\'overlay', async ({ page }) => {
    await page.goto('/')
    const trigger = page.getByRole('button', { name: /respire avec moi/i })
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 2000 })
  })

  test('vida-nature-bg — présent sur landing', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.vida-nature-bg')).toBeAttached()
  })
})
