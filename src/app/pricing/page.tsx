'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Sparkles, Leaf, ArrowLeft, Infinity as InfinityIcon, Heart } from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'

type Period = 'month' | 'year'

const PREMIUM_FEATURES = [
  'Compagne IA vivante illimitée',
  'Missions payées en argent réel',
  'Gains potentiels retirables (IBAN dès 5€)',
  'Rituels collectifs hebdomadaires',
  'Buddy system & cercles de communauté',
  "Accès aux jeux concours (×5 tickets)",
  'Redistribution mensuelle du CA',
  'Fil de Vie™ complet & illimité',
  'Carte mondiale d\'impact personnel',
  'Mode Miroir mensuel & annuel',
  'Cashback premium sur boutique VIDA',
  'Commission parrainage 50% + 10% à vie',
  '14 jours d\'essai gratuit',
  'Moitié prix à vie si tu veux arrêter',
]

const FREE_FEATURES = [
  'Explore l\'app en entier',
  '5 messages avec VIDA par jour',
  '1 micro-action quotidienne',
  'Gains en Points VIDA (non retirables)',
  'Lecture du Fil de Vie',
  'Accès aux rituels en observateur',
]

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('year')
  const [loading, setLoading] = useState(false)

  const premiumPrice = period === 'year' ? 7990 : 990
  const priceLabel = period === 'year' ? '79,90' : '9,90'
  const monthlyEquivalent = period === 'year' ? '6,66' : '9,90'
  const saving = period === 'year' ? '-33%' : null

  async function handleCheckout() {
    if (!user) {
      router.push('/login?next=/pricing')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.error) {
        toast.error(data.error)
        return
      }
      if (data.url) window.location.href = data.url
    } catch {
      toast.error('Impossible de lancer le paiement. Réessaie dans un instant.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="absolute left-4 top-4 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition hover:text-[var(--emerald)] sm:left-8 sm:top-8"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>

      <div className="mx-auto max-w-5xl text-center">
        <div className="vida-chip mx-auto mb-6 inline-flex">
          <Leaf className="h-3.5 w-3.5" /> 14 jours offerts · sans engagement
        </div>
        <h1 className="mb-4 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Choisis comment tu veux{' '}
          <span className="gradient-text-animated">être accompagné</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-[var(--text-secondary)]">
          VIDA est une compagne vivante. Explore gratuitement, ou débloque l&apos;écosystème complet avec Premium.
        </p>

        {/* Period toggle */}
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] p-1">
          <button
            onClick={() => setPeriod('month')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${period === 'month' ? 'bg-[var(--emerald)] text-[#052e16]' : 'text-[var(--text-secondary)] hover:text-white'}`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`relative rounded-full px-5 py-2 text-sm font-semibold transition ${period === 'year' ? 'bg-[var(--emerald)] text-[#052e16]' : 'text-[var(--text-secondary)] hover:text-white'}`}
          >
            Annuel
            <span className="absolute -right-1 -top-2 rounded-full bg-[#f472b6] px-2 py-0.5 text-[10px] font-bold text-white">
              -33%
            </span>
          </button>
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
        {/* FREE */}
        <Card className="relative p-8">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--text-secondary)]" />
            <h2 className="font-display text-2xl font-bold">Découverte</h2>
          </div>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">
            Explore VIDA sans engagement. Les gains sont en Points.
          </p>
          <div className="mb-6">
            <span className="font-display text-5xl font-bold">0€</span>
            <span className="ml-2 text-[var(--text-muted)]">pour toujours</span>
          </div>
          <Button variant="secondary" fullWidth onClick={() => router.push('/signup')}>
            Commencer gratuitement
          </Button>
          <ul className="mt-8 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--text-muted)]" />
                <span className="text-[var(--text-secondary)]">{f}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* PREMIUM */}
        <Card className="relative border-[var(--emerald-glow)] bg-gradient-to-br from-[rgba(16,185,129,0.08)] to-[rgba(16,185,129,0.02)] p-8 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[var(--emerald)] to-[#84cc16] px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#052e16]">
            ⭐ Premium VIDA
          </div>
          <div className="mb-2 flex items-center gap-2">
            <InfinityIcon className="h-5 w-5 text-[var(--emerald)]" />
            <h2 className="font-display text-2xl font-bold">VIDA Premium</h2>
          </div>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">
            L&apos;écosystème complet. Tout est débloqué, les gains sont réels.
          </p>
          <div className="mb-6">
            <span className="font-display text-5xl font-bold">{priceLabel}€</span>
            <span className="ml-2 text-[var(--text-muted)]">/ {period === 'year' ? 'an' : 'mois'}</span>
            {period === 'year' && (
              <div className="mt-1 text-sm text-[#86efac]">
                soit <strong>{monthlyEquivalent}€/mois</strong> · {saving}
              </div>
            )}
          </div>
          <Button
            fullWidth
            onClick={handleCheckout}
            disabled={loading}
            className="btn-gradient"
          >
            {loading ? 'Chargement…' : 'Activer les 14 jours offerts'}
          </Button>
          <ul className="mt-8 space-y-3">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--emerald)]" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-[var(--text-muted)]">
            Annule à tout moment. Si tu souhaites arrêter, VIDA te proposera automatiquement la moitié prix à vie.
          </p>
        </Card>
      </div>

      <div className="mx-auto mt-16 max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)]">
          <Heart className="h-4 w-4 text-[#f472b6]" />
          10% du CA reversé à l&apos;association PURAMA automatiquement
        </div>
        <p className="mt-6 text-sm text-[var(--text-muted)]">
          Paiement sécurisé Stripe · TVA non applicable art. 293 B · Annulation en 1 clic
        </p>
      </div>
    </div>
  )
}
