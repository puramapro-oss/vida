'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { MessageSquare, Wrench, Bot, Zap, Sparkles, TrendingUp, Star } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import { cn, formatNumber } from '@/lib/utils'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.25, 0.4, 0.25, 1] as const } },
}

export default function DashboardPage() {
  const { profile, loading } = useAuth()
  const t = useTranslations('dashboard')
  const tn = useTranslations('nav')

  const QUICK_ACTIONS = [
    {
      href: '/dashboard/chat',
      icon: MessageSquare,
      label: tn('chat'),
      desc: t('quickActions'),
      gradient: 'from-[var(--cyan)] to-[var(--purple)]',
    },
    {
      href: '/dashboard/tools',
      icon: Wrench,
      label: tn('tools'),
      desc: t('quickActions'),
      gradient: 'from-[var(--purple)] to-[var(--pink)]',
    },
    {
      href: '/dashboard/agents',
      icon: Bot,
      label: tn('agents'),
      desc: t('quickActions'),
      gradient: 'from-[var(--pink)] to-[var(--orange)]',
    },
    {
      href: '/dashboard/automation',
      icon: Zap,
      label: tn('automation'),
      desc: t('quickActions'),
      gradient: 'from-[var(--gold)] to-[var(--green)]',
    },
  ]

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const planLabel: Record<string, string> = {
    free: 'Free',
    automate: 'Automate',
    create: 'Create',
    build: 'Build',
    complete: 'Complete',
  }

  const name = profile?.full_name ?? profile?.email?.split('@')[0] ?? ''

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="flex flex-col gap-6"
    >
      {/* Welcome header */}
      <motion.div variants={fadeUp}>
        <Card className="p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                {t('welcome', { name })}{' '}
                <span className="gradient-text font-[family-name:var(--font-display)]">VIDA</span>
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {t('currentLevel')} {profile?.vida_level ?? 1} &bull; {formatNumber(profile?.vida_xp ?? 0)} XP &bull;{' '}
                <span className="font-semibold text-[var(--cyan)]">
                  {planLabel[profile?.plan ?? 'free'] ?? 'Free'}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white/5 px-3 py-1.5 text-sm">
                <Sparkles className="h-4 w-4 text-[var(--gold)]" />
                <span className="text-[var(--text-secondary)]">
                  {t('currentStreak')}: {profile?.streak_count ?? 0}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick actions */}
      <motion.section variants={fadeUp}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {t('quickActions')}
        </h2>
        <motion.div
          variants={stagger}
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {QUICK_ACTIONS.map(({ href, icon: Icon, label, gradient }) => (
            <motion.div key={href} variants={fadeUp}>
              <Link href={href} data-testid={`quick-action-${href.split('/').pop()}`}>
                <Card
                  className="glass-hover flex h-full cursor-pointer flex-col gap-3 p-5 transition-all"
                  spotlight
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br',
                      gradient
                    )}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{label}</p>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Stats */}
      <motion.section variants={fadeUp}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Statistics
        </h2>
        <motion.div variants={stagger} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <motion.div variants={fadeUp}>
            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--cyan)]/10">
                <MessageSquare className="h-5 w-5 text-[var(--cyan)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {formatNumber(profile?.daily_ai_messages ?? 0)}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">{t('todayCredits')}</p>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--gold)]/10">
                <TrendingUp className="h-5 w-5 text-[var(--gold)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {formatNumber(profile?.vida_xp ?? 0)}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">XP</p>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--purple)]/10">
                <Star className="h-5 w-5 text-[var(--purple)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {profile?.vida_level ?? 1}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">{t('currentLevel')}</p>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </motion.section>
    </motion.div>
  )
}
