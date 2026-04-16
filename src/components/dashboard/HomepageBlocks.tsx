'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import {
  Copy, Check, Share2, Users, Crown, Sparkles, ChevronRight, Gift,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { APP_DOMAIN } from '@/lib/constants'

type Profile = {
  id: string
  referral_code: string | null
  full_name: string | null
  pseudo: string | null
}

interface Props {
  user: User | null
  profile: Profile | null
}

// VIDA → KAÏA (primary wellness cross-promo), PRANA (fallback)
const CROSS_PROMO_TARGETS = [
  {
    slug: 'kaia',
    domain: 'https://kaia.purama.dev',
    name: 'KAÏA',
    tagline: 'Ton médecin IA bienveillant, 24h/24',
    accent: 'from-cyan-500/30 to-teal-400/20',
  },
  {
    slug: 'prana',
    domain: 'https://prana.purama.dev',
    name: 'PRANA',
    tagline: 'Respiration, méditation, cohérence cardiaque',
    accent: 'from-rose-400/30 to-pink-400/20',
  },
] as const

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

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function HomepageBlocks({ user, profile }: Props) {
  const [copied, setCopied] = useState(false)
  const [filleuls, setFilleuls] = useState<number>(0)
  const [earnings, setEarnings] = useState<number>(0)
  const [target, setTarget] = useState<(typeof CROSS_PROMO_TARGETS)[number]>(CROSS_PROMO_TARGETS[0])

  const code = profile?.referral_code ?? ''
  const referralLink = code
    ? `https://${APP_DOMAIN}/go/${code}`
    : `https://${APP_DOMAIN}/signup`

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    async function load() {
      const { data: refs } = await supabase
        .from('referrals')
        .select('id, active, first_payment_commission_cents')
        .eq('referrer_id', user!.id)

      const list = refs ?? []
      setFilleuls(list.length)
      const totalCents = list.reduce(
        (sum, r) => sum + (typeof r.first_payment_commission_cents === 'number' ? r.first_payment_commission_cents : 0),
        0,
      )
      setEarnings(totalCents / 100)
    }
    void load()
  }, [user])

  useEffect(() => {
    // rotate KAÏA/PRANA deterministically per day (no SSR flash)
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
    setTarget(CROSS_PROMO_TARGETS[day % CROSS_PROMO_TARGETS.length])
  }, [])

  const { currentTier, nextTier, progressPct } = useMemo(() => {
    const current = [...AMBASSADOR_TIERS].reverse().find((t) => filleuls >= t.filleuls) ?? null
    const next = AMBASSADOR_TIERS.find((t) => filleuls < t.filleuls) ?? null
    const base = current?.filleuls ?? 0
    const ceil = next?.filleuls ?? filleuls
    const pct = ceil > base ? Math.min(100, Math.round(((filleuls - base) / (ceil - base)) * 100)) : 100
    return { currentTier: current, nextTier: next, progressPct: pct }
  }, [filleuls])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast.success('Lien copié 🌱')
      setTimeout(() => setCopied(false), 2200)
    } catch {
      toast.error('Impossible de copier — appuie longuement sur le lien.')
    }
  }

  async function shareLink() {
    const shareData = {
      title: 'Rejoins VIDA',
      text: 'VIDA transforme tes actions en impact réel. Rejoins-moi 🌱',
      url: referralLink,
    }
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share(shareData)
      } catch {
        void copyLink()
      }
    } else {
      void copyLink()
    }
  }

  const crossPromoHref = `${target.domain}/go/vida?coupon=WELCOME50`

  return (
    <motion.section
      data-testid="homepage-blocks"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="grid gap-4 md:gap-5 lg:grid-cols-3"
    >
      {/* BLOC 1 — PARRAINAGE */}
      <motion.article
        variants={fadeUp}
        data-testid="block-referral"
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 md:p-6"
      >
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[var(--emerald)]/25 blur-3xl pointer-events-none" />
        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--emerald)]/30 to-[var(--sage,#34d399)]/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-[var(--emerald,#10B981)]" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)]">Parrainage</h3>
          </div>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {filleuls === 0
              ? 'Ton premier filleul te rapporte jusqu\'à 25 € + 1 mois offert.'
              : `Tu as semé ${filleuls} graine${filleuls > 1 ? 's' : ''}. Continue 🌱`}
          </p>

          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded-xl bg-white/5 border border-white/10 p-2">
              <QRCodeSVG
                value={referralLink}
                size={72}
                bgColor="transparent"
                fgColor="#10B981"
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <button
                onClick={copyLink}
                data-testid="copy-referral-link"
                className="w-full flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs hover:bg-white/10 transition"
                aria-label="Copier le lien de parrainage"
              >
                <span className="truncate text-[var(--text-primary)] font-mono flex-1 text-left">
                  {referralLink.replace(/^https?:\/\//, '')}
                </span>
                {copied ? (
                  <Check className="h-4 w-4 text-[var(--emerald,#10B981)] shrink-0" />
                ) : (
                  <Copy className="h-4 w-4 text-white/50 shrink-0" />
                )}
              </button>
              <button
                onClick={shareLink}
                data-testid="share-referral"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--emerald,#10B981)] to-[var(--sage,#34d399)] px-3 py-2 text-xs font-semibold text-black hover:opacity-90 transition"
              >
                <Share2 className="h-4 w-4" />
                Partager mon lien
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
            <div>
              <div className="text-white/40">Filleuls</div>
              <div className="text-lg font-semibold text-[var(--text-primary)]" data-testid="referral-count">
                {filleuls}
              </div>
            </div>
            <div className="text-right">
              <div className="text-white/40">Gains cumulés</div>
              <div className="text-lg font-semibold text-[var(--emerald,#10B981)]" data-testid="referral-earnings">
                {earnings.toFixed(2)} €
              </div>
            </div>
          </div>
        </div>
      </motion.article>

      {/* BLOC 2 — AMBASSADEUR */}
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

      {/* BLOC 3 — CROSS-PROMO */}
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
    </motion.section>
  )
}
