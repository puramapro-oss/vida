'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users, Wallet, Trophy, Gift, Share2, Megaphone,
  Crown, Ticket, BookOpen, Leaf, Sparkles, Heart,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Skeleton from '@/components/ui/Skeleton'
import HomepageBlocks from '@/components/dashboard/HomepageBlocks'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const } },
}

const QUICK = [
  { href: '/dashboard/referral', icon: Users, label: 'Parrainage', desc: 'Invite un proche, plante une graine commune' },
  { href: '/dashboard/wallet', icon: Wallet, label: 'Wallet', desc: 'Retire tes gains dès 5€' },
  { href: '/dashboard/daily-gift', icon: Gift, label: 'Coffre du jour', desc: 'Ouvre ton cadeau quotidien' },
  { href: '/dashboard/classement', icon: Crown, label: 'Classement', desc: 'Vois les graines du monde' },
  { href: '/dashboard/concours', icon: Trophy, label: 'Concours', desc: '10 gagnants chaque semaine' },
  { href: '/dashboard/tirage', icon: Ticket, label: 'Tirage mensuel', desc: 'Tes tickets de l\'abondance' },
  { href: '/dashboard/partage', icon: Share2, label: 'Partager', desc: 'Transmets VIDA à quelqu\'un' },
  { href: '/ambassadeur', icon: Megaphone, label: 'Ambassadeur', desc: 'Jusqu\'à 200 k€ en semant VIDA' },
  { href: '/dashboard/guide', icon: BookOpen, label: 'Guide', desc: 'Découvre l\'écosystème VIDA' },
]

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const name = profile?.full_name?.split(' ')[0] ?? profile?.pseudo ?? 'ami·e'
  const level = profile?.vida_level ?? 1
  const xp = profile?.vida_xp ?? 0
  const points = profile?.vida_points ?? 0
  const wallet = profile?.wallet_balance ?? 0
  const streak = profile?.streak_count ?? 0

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="flex flex-col gap-8 page-enter"
    >
      {/* Welcome */}
      <motion.header variants={fadeUp} className="glass-card-static rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[var(--emerald)]/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="vida-chip mb-3">
              <span className="vida-pulse-dot" />
              Niveau {level}
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light tracking-tight">
              Bonjour {name},
            </h1>
            <p className="text-[var(--text-secondary)] mt-2 text-base md:text-lg">
              Ta graine grandit. Aujourd'hui, un geste peut faire bouger le monde.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/dashboard/guide"
              className="rounded-2xl border border-[var(--border)] bg-white/5 px-5 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
            >
              Guide
            </Link>
            <Link
              href="/dashboard/partage"
              className="rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all"
            >
              Partager VIDA
            </Link>
          </div>
        </div>
      </motion.header>

      {/* V7 — 3 blocs above the fold : Parrainage + Ambassadeur + Cross-promo */}
      <HomepageBlocks
        user={user}
        profile={profile ? {
          id: profile.id,
          referral_code: profile.referral_code ?? null,
          full_name: profile.full_name ?? null,
          pseudo: profile.pseudo ?? null,
        } : null}
      />

      {/* Stats */}
      <motion.section variants={fadeUp} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Sparkles, label: 'XP', value: xp, color: 'text-[var(--emerald)]' },
          { icon: Leaf, label: 'Graines', value: points, color: 'text-[var(--sage)]' },
          { icon: Wallet, label: 'Wallet', value: `${wallet.toFixed(2)}€`, color: 'text-[var(--emerald)]' },
          { icon: Heart, label: 'Streak', value: `${streak}j`, color: 'text-[var(--rose)]' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="impact-counter text-2xl md:text-3xl">{s.value}</p>
          </div>
        ))}
      </motion.section>

      {/* Quick actions */}
      <motion.section variants={fadeUp}>
        <h2 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-medium mb-4">
          Explore ton écosystème
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK.map((q, i) => (
            <motion.div
              key={q.href}
              variants={fadeUp}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                href={q.href}
                data-testid={`quick-${q.href.split('/').pop()}`}
                className="group block glass-card rounded-2xl p-5 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[var(--emerald)]/20 to-[var(--sage)]/10 flex items-center justify-center mb-4">
                  <q.icon className="h-5 w-5 text-[var(--emerald)]" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">{q.label}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{q.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  )
}
