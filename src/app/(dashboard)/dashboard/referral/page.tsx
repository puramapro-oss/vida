'use client'

import { useEffect, useState } from 'react'
import { Copy, Gift, Users, TrendingUp, Award, Share2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { cn, copyToClipboard, formatDate } from '@/lib/utils'
import { APP_DOMAIN } from '@/lib/constants'
import type { Referral, ReferralEarning, ReferralTier } from '@/types'

const TIERS: { tier: ReferralTier; min: number; label: string; color: string }[] = [
  { tier: 'bronze', min: 5, label: 'Bronze', color: '#CD7F32' },
  { tier: 'silver', min: 10, label: 'Argent', color: '#C0C0C0' },
  { tier: 'gold', min: 25, label: 'Or', color: '#FFD700' },
  { tier: 'platinum', min: 50, label: 'Platine', color: '#E5E4E2' },
  { tier: 'diamond', min: 75, label: 'Diamant', color: '#B9F2FF' },
  { tier: 'legend', min: 100, label: 'Legende', color: '#FF6B6B' },
]

export default function ReferralPage() {
  const { profile, user } = useAuth()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [earnings, setEarnings] = useState<ReferralEarning[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const referralLink = profile?.referral_code
    ? `https://${APP_DOMAIN}/go/${profile.referral_code}`
    : ''

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [refRes, comRes] = await Promise.all([
        supabase.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
        supabase.from('referral_earnings').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      ])
      if (refRes.data) setReferrals(refRes.data as Referral[])
      if (comRes.data) setEarnings(comRes.data as ReferralEarning[])
      setLoading(false)
    }
    load()
  }, [user, supabase])

  const handleCopy = async () => {
    const ok = await copyToClipboard(referralLink)
    if (ok) {
      setCopied(true)
      toast.success('Lien copie !')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const totalReferrals = referrals.length
  const totalCommissions = earnings.reduce((sum, c) => sum + (Number(c.amount_cents) / 100), 0)
  const currentTier = TIERS.filter(t => totalReferrals >= t.min).pop()
  const nextTier = TIERS.find(t => totalReferrals < t.min)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Parrainage</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Invite tes amis et gagne des commissions sur leurs abonnements
        </p>
      </div>

      {/* Lien de parrainage */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ton lien de parrainage</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Partage ce lien — tu gagnes 50% du 1er paiement + 10% a vie
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="rounded-lg bg-white/5 px-3 py-2 text-sm text-[var(--cyan)]">
              {referralLink || 'Chargement...'}
            </code>
            <Button size="sm" onClick={handleCopy} icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
              {copied ? 'Copie' : 'Copier'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cyan)]/10">
              <Users className="h-5 w-5 text-[var(--cyan)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Filleuls</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{totalReferrals}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Commissions</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{totalCommissions.toFixed(2)} EUR</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <Award className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Palier</p>
              <p className="text-xl font-bold" style={{ color: currentTier?.color ?? 'var(--text-primary)' }}>
                {currentTier?.label ?? 'Debutant'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Gift className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Prochain palier</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {nextTier ? `${nextTier.min - totalReferrals} restants` : 'Max atteint'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Paliers */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Paliers de parrainage</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TIERS.map(t => (
            <div
              key={t.tier}
              className={cn(
                'rounded-xl border p-4 transition-all',
                totalReferrals >= t.min
                  ? 'border-[var(--cyan)]/30 bg-[var(--cyan)]/5'
                  : 'border-[var(--border)] bg-white/[0.02]'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold" style={{ color: t.color }}>{t.label}</span>
                <Badge variant={totalReferrals >= t.min ? 'green' : 'default'}>
                  {t.min} filleuls
                </Badge>
              </div>
              {totalReferrals >= t.min && (
                <p className="mt-1 text-xs text-emerald-400">Debloque</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Historique */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Tes filleuls</h2>
        {referrals.length === 0 ? (
          <EmptyState
            icon={<Share2 className="h-12 w-12" />}
            title="Aucun filleul pour l'instant"
            description="Partage ton lien pour commencer a gagner des commissions"
          />
        ) : (
          <div className="space-y-2">
            {referrals.map(r => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] p-3">
                <div>
                  <p className="text-sm text-[var(--text-primary)]">Filleul #{r.referred_id.slice(0, 8)}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{formatDate(r.created_at)}</p>
                </div>
                <Badge variant={r.status === 'active' ? 'green' : 'default'}>{r.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
