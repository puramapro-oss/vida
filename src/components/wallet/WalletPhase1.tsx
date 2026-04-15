'use client'

import { pointsToEuros } from '@/lib/phase'
import Link from 'next/link'

/**
 * V6 §19 Phase 1 — Wallet view for points mode.
 * Shows balance in points + euro equivalent + withdrawal lock message.
 */
export default function WalletPhase1({
  balancePoints,
  primeAccumulated,
  subscriptionStartedAt,
}: {
  balancePoints: number
  primeAccumulated: number
  subscriptionStartedAt: string | null
}) {
  const eurosEquiv = pointsToEuros(balancePoints)
  const primeEuros = primeAccumulated / 100

  let daysUntilUnlock = 0
  if (subscriptionStartedAt) {
    const start = new Date(subscriptionStartedAt)
    const unlockAt = new Date(start.getTime() + 30 * 86400000)
    daysUntilUnlock = Math.max(0, Math.ceil((unlockAt.getTime() - Date.now()) / 86400000))
  }
  const canWithdraw = subscriptionStartedAt != null && daysUntilUnlock === 0

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wider text-white/50">Wallet VIDA</span>
          <span className="text-[10px] text-white/40">1 pt = 0,01 €</span>
        </div>
        <div className="flex items-end gap-3">
          <div className="text-4xl font-bold">{balancePoints.toLocaleString('fr-FR')}</div>
          <div className="text-sm text-white/60 pb-1">pts ≈ {eurosEquiv.toFixed(2)} €</div>
        </div>

        {primeAccumulated > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-3 text-sm">
            <div className="text-emerald-200">Ta prime en cours</div>
            <div className="text-xs text-white/60 mt-1">
              {primeEuros.toFixed(2)} € accumulés — disponibles au retrait après 30 jours d&apos;abonnement actif.
            </div>
          </div>
        )}

        {!canWithdraw && subscriptionStartedAt && (
          <div className="text-xs text-white/50">
            Retrait disponible dans <strong>{daysUntilUnlock} jour{daysUntilUnlock > 1 ? 's' : ''}</strong>.
          </div>
        )}

        {!subscriptionStartedAt && (
          <Link href="/subscribe" className="block text-center text-xs text-emerald-300 hover:text-emerald-200">
            Active ton abonnement pour débloquer les retraits →
          </Link>
        )}

        <button
          disabled={!canWithdraw}
          className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-sm disabled:opacity-50"
          title={canWithdraw ? 'Retrait IBAN' : 'Disponible très bientôt'}
        >
          {canWithdraw ? 'Demander un retrait' : 'Disponible très bientôt'}
        </button>
      </div>
    </div>
  )
}
