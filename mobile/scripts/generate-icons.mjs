#!/usr/bin/env node
/**
 * VIDA — Génère les icônes mobile depuis Pollinations (CLAUDE.md §16)
 *
 * Source : Pollinations flux model (image.pollinations.ai)
 * Traitement : sharp → resize + pad background + square crop
 *
 * Cibles :
 *  - icon.png                   1024×1024  (iOS app icon)
 *  - adaptive-icon-fg.png       1024×1024  (Android foreground, pad 100px)
 *  - splash-icon.png            1284×2778  (iOS splash)
 *  - favicon.png                48×48      (web)
 *
 * Usage : node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'assets', 'images')

const PROMPT = encodeURIComponent(
  'minimalist flat vector lotus leaf icon, emerald green #10B981, dark void background #030806, symmetric, sacred geometry, app icon, no text, no people, pure shape'
)
const POLLINATIONS_URL = `https://image.pollinations.ai/prompt/${PROMPT}?width=1024&height=1024&model=flux&enhance=true&nologo=true&seed=42`

async function downloadAndProcess() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true })

  console.log('→ Téléchargement Pollinations…')
  const res = await fetch(POLLINATIONS_URL)
  if (!res.ok) throw new Error(`Pollinations HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  console.log(`  ${(buf.length / 1024).toFixed(1)} KB`)

  // 1. icon.png — 1024×1024 iOS
  await sharp(buf).resize(1024, 1024, { fit: 'cover' }).png().toFile(join(OUT_DIR, 'icon.png'))
  console.log('✓ icon.png 1024×1024')

  // 2. android-icon-foreground.png — 1024×1024 avec pad 100px (safe zone Android adaptive)
  await sharp(buf)
    .resize(824, 824, { fit: 'cover' })
    .extend({ top: 100, bottom: 100, left: 100, right: 100, background: { r: 10, g: 10, b: 15, alpha: 0 } })
    .png()
    .toFile(join(OUT_DIR, 'android-icon-foreground.png'))
  console.log('✓ android-icon-foreground.png 1024×1024 (pad 100px)')

  // 3. splash-icon.png — icône centrée sur 1284×2778 fond #0A0A0F
  await sharp({
    create: {
      width: 1284,
      height: 2778,
      channels: 4,
      background: { r: 3, g: 8, b: 6, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(buf).resize(400, 400, { fit: 'cover' }).png().toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(join(OUT_DIR, 'splash-icon.png'))
  console.log('✓ splash-icon.png 1284×2778 (centrée)')

  // 4. favicon.png — 48×48 web
  await sharp(buf).resize(48, 48, { fit: 'cover' }).png().toFile(join(OUT_DIR, 'favicon.png'))
  console.log('✓ favicon.png 48×48')

  console.log('\n🌿 Icônes VIDA générées.')
}

downloadAndProcess().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})
