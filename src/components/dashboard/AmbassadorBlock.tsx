'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Crown, ChevronRight } from 'lucide-react'

// Paliers Ambassadeur V7 §15
const AMBASSADOR_TIERS = [
  { key: 'bronze', name: 'Bronze', filleuls: 10, primeEur: 200 },
  { key: 'argent', name: 'Argent', filleuls: 25, primeEur: 500 },
  { key: 'or', name: 'Or', filleuls: 50, primeEur: 1_000 },
  { key: 'platine', name: 'Platine', filleuls: 100, primeEur: 2_500 },
  { key: 'diamant', name: 'Diamant', filleuls: 250, primeEur: 6_000 },
  { key: 'legende', name: 'Légende', filleuls: 500, primeEur: 12_000 },
  { key: 'titan', name: 'Titan', filleuls: 1_000, primeEur: 25_000 },
  { key: 'dieu', name: 'Dieu', filleuls: 5_000, primeEur: 100_000 },
  { key: 'eternel', name: 'Éternel', filleuls: 10_000, primeEur: 200_000 },
]

function formatEurShort(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace('.0', '')} k€`
  return `${n} €`
}

interface Props {
  filleuls: number
  fadeUp: {
    hidden: { opacity: number; y: number }
    visible: { opacity: number; y: number; transition: { duration: number } }
  }
}

export default function AmbassadorBlock({ filleuls, fadeUp }: Props) {
  const currentTier = [...AMBASSADOR_TIERS].reverse().find((t) => filleuls >= t.filleuls) ?? null
  const nextTier = AMBASSADOR_TIERS.find((t) => filleuls < t.filleuls) ?? null
  const base = currentTier?.filleuls ?? 0
  const ceil = nextTier?.filleuls ?? filleuls
  const progressPct = ceil > base ? Math.min(100, Math.round(((filleuls - base) / (ceil - base)) * 100)) : 100

  return (
    <motion.article
      variants={fadeUp}
      data-testid="block-ambassadeur"
      className="relative overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-500/[0.04] to-yellow-300/[0.02] backdrop-blur-xl p-5 md:p-6"
    >
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400/40 to-yellow-300/20 flex items-center justify-center">
              <Crown className="h-4 w-4 text-amber-300" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)]">Ambassadeur</h3>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-amber-300/70">
            Jusqu&apos;à 200 k€
          </span>
        </div>

        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {currentTier
            ? `Tu es ${currentTier.name}. Cap suivant : ${nextTier?.name ?? 'Éternel'}.`
            : 'Rejoins le programme et débloque ton premier palier dès 10 filleuls.'}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">
              {currentTier?.name ?? 'Inscrit'} → {nextTier?.name ?? 'Éternel'}
            </span>
            <span className="text-amber-300 font-semibold">
              {nextTier ? `${filleuls}/${nextTier.filleuls}` : '—'}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {AMBASSADOR_TIERS.slice(0, 6).map((t) => {
            const reached = filleuls >= t.filleuls
            return (
              <div
                key={t.key}
                className={`rounded-lg border px-2 py-1.5 text-center ${
                  reached
                    ? 'border-amber-300/50 bg-amber-300/10 text-amber-200'
                    : 'border-white/10 bg-white/[0.02] text-white/50'
                }`}
              >
                <div className="text-[10px] font-medium">{t.name}</div>
                <div className="text-[10px] opacity-70">{formatEurShort(t.primeEur)}</div>
              </div>
            )
          })}
        </div>

        <Link
          href="/ambassadeur"
          data-testid="ambassadeur-cta"
          className="w-full flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 px-3 py-2.5 text-sm font-semibold text-black hover:opacity-90 transition"
        >
          Postuler comme Ambassadeur
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.article>
  )
}
