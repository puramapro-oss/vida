'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function SubscribePage() {
  const router = useRouter()
  const params = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState<'month' | 'year'>(params.get('period') === 'year' ? 'year' : 'month')
  const [error, setError] = useState<string | null>(null)

  async function onStart() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?next=${encodeURIComponent('/subscribe')}`)
          return
        }
        throw new Error(data.error ?? 'Erreur Stripe')
      }
      if (data.url) window.location.href = data.url as string
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur paiement')
    } finally {
      setLoading(false)
    }
  }

  const monthly = 990
  const yearly = 7990
  const priceLabel = period === 'year' ? `${(yearly / 100).toFixed(2)} €/an` : `${(monthly / 100).toFixed(2)} €/mois`

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-card rounded-3xl p-8 space-y-6">
        <div className="space-y-2 text-center">
          <div className="text-sm uppercase tracking-widest text-[var(--color-accent)]/80">VIDA Premium</div>
          <h1 className="text-3xl font-semibold">Ta prime de bienvenue t&apos;attend.</h1>
          <p className="text-white/70 text-sm">
            Elle est créditée sur ton compte Purama dès aujourd&apos;hui.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 bg-white/5 rounded-full p-1">
          <button
            onClick={() => setPeriod('month')}
            className={`flex-1 py-2 px-4 rounded-full text-sm transition ${period === 'month' ? 'bg-[var(--color-accent)] text-black font-semibold' : 'text-white/70'}`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`flex-1 py-2 px-4 rounded-full text-sm transition ${period === 'year' ? 'bg-[var(--color-accent)] text-black font-semibold' : 'text-white/70'}`}
          >
            Annuel <span className="text-xs opacity-80">−33%</span>
          </button>
        </div>

        <div className="text-center space-y-1">
          <div className="text-4xl font-bold">{priceLabel}</div>
          <div className="text-xs text-white/50">14 jours d&apos;essai inclus</div>
        </div>

        <ul className="text-sm text-white/80 space-y-2">
          <li>• Prime 100 € en 3 paliers (J+0 25 €, M+1 25 €, M+2 50 €)</li>
          <li>• Accès IA VIDA illimité, rituels, missions rémunérées</li>
          <li>• Commissions parrainage à vie (50% / 15% / 7%)</li>
          <li>• Résiliation à tout moment, wallet conservé</li>
        </ul>

        <Button fullWidth disabled={loading} onClick={onStart}>
          {loading ? 'Redirection…' : 'Démarrer & recevoir ma prime'}
        </Button>

        <p className="text-[10px] text-white/40 leading-snug text-center">
          En démarrant maintenant, tu bénéficies d&apos;un accès immédiat à ton abonnement
          (art. L221-28 Code conso). Prime créditée sur le wallet Purama, retrait disponible
          après 30 jours d&apos;abonnement actif.
        </p>

        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      </div>
    </main>
  )
}
