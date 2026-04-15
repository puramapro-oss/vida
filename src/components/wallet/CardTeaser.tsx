'use client'

import { useState } from 'react'

/**
 * V6 §19 Phase 1 — Purama Card teaser.
 * Grisée + cadenas doré + "Bientôt disponible" + compteur waitlist + CTA "Me notifier".
 */
export default function CardTeaser({ waitlistCount, onNotify }: { waitlistCount?: number; onNotify?: () => void }) {
  const [notified, setNotified] = useState(false)

  async function notify() {
    try {
      const res = await fetch('/api/wallet/card-waitlist', { method: 'POST' })
      if (res.ok) {
        setNotified(true)
        onNotify?.()
      }
    } catch {
      /* silent */
    }
  }

  return (
    <div className="relative rounded-3xl p-6 overflow-hidden bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.08),transparent_60%)]" aria-hidden />
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-[10px] uppercase tracking-wider text-amber-200">
            <span>🔒</span>
            <span>Bientôt disponible</span>
          </div>
          <h3 className="text-lg font-semibold">Purama Card</h3>
          <p className="text-xs text-white/60 max-w-xs">
            Carte virtuelle Apple Pay / Google Pay, IBAN FR dédié, retrait en 30 s, cashback jusqu&apos;à 20%.
          </p>
        </div>
        <div className="w-24 h-16 rounded-xl bg-gradient-to-br from-emerald-400/30 to-emerald-900/30 border border-white/10 flex items-center justify-center text-2xl grayscale opacity-70">
          💳
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        {typeof waitlistCount === 'number' && (
          <div className="text-xs text-white/50">
            <strong className="text-white/80">{waitlistCount.toLocaleString('fr-FR')}</strong> personnes attendent
          </div>
        )}
        <button
          onClick={notify}
          disabled={notified}
          className="px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-xs text-emerald-100 disabled:opacity-60"
        >
          {notified ? 'Notifié ✓' : 'Me notifier en premier'}
        </button>
      </div>
    </div>
  )
}
