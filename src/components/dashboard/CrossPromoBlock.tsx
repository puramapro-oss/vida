'use client'

import { motion } from 'framer-motion'
import { Gift, Sparkles, ChevronRight } from 'lucide-react'

interface Props {
  target: {
    slug: string
    domain: string
    name: string
    tagline: string
    accent: string
  }
  fadeUp: {
    hidden: { opacity: number; y: number }
    visible: { opacity: number; y: number; transition: { duration: number } }
  }
}

export default function CrossPromoBlock({ target, fadeUp }: Props) {
  const crossPromoHref = `${target.domain}/go/vida?coupon=WELCOME50`

  return (
    <motion.article
      variants={fadeUp}
      data-testid="block-cross-promo"
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${target.accent} backdrop-blur-xl p-5 md:p-6`}
    >
      <div className="absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
      <div className="relative space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-white/15 to-white/[0.05] flex items-center justify-center">
            <Gift className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)]">Découvre {target.name}</h3>
        </div>

        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {target.tagline}
        </p>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Offre exclusive VIDA → {target.name}
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            −50% <span className="text-sm font-normal text-white/60">le premier mois</span>
          </div>
          <div className="text-sm text-[var(--emerald,#10B981)] font-semibold">
            + 100 € de prime de bienvenue
          </div>
          <div className="text-[10px] text-white/40">
            Coupon WELCOME50 appliqué automatiquement.
          </div>
        </div>

        <a
          href={crossPromoHref}
          data-testid="cross-promo-cta"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black px-3 py-2.5 text-sm font-semibold hover:opacity-90 transition"
        >
          Essayer {target.name}
          <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </motion.article>
  )
}
