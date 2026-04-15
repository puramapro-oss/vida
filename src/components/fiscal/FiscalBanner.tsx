'use client'

import { useState } from 'react'
import Link from 'next/link'

/**
 * V6 §17 — Fiscal banner. Shown when annual gains > 3000€.
 * Gold background. Dismissible. Reappears April 1, disappears June 15.
 */
export default function FiscalBanner({ totalAnnualCents }: { totalAnnualCents: number }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  if (totalAnnualCents < 300_000) return null

  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const visibleWindow = (month > 4) || (month === 4 && day >= 1)
  const hiddenFromJune15 = (month > 6) || (month === 6 && day > 15)
  if (hiddenFromJune15 || !visibleWindow) return null

  return (
    <div className="rounded-2xl p-4 md:p-5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="text-sm">
        <div className="font-semibold text-amber-200">
          Tu as gagné plus de 3 000 € cette année.
        </div>
        <div className="text-amber-100/80 text-xs mt-1">
          Pense à déclarer via impots.gouv.fr (case 5NG). Abattement 34% automatique.
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Link
          href="/fiscal"
          className="px-3 py-2 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-100 text-xs font-medium"
        >
          En savoir plus
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="px-3 py-2 rounded-lg border border-amber-400/30 text-amber-100/80 hover:bg-amber-400/10 text-xs"
        >
          J&apos;ai compris
        </button>
      </div>
    </div>
  )
}
