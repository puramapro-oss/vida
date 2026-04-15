'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

type ProfileInfo = {
  plan: string | null
  plan_period: string | null
  subscription_status: string | null
  subscription_started_at: string | null
  trial_ends_at: string | null
  subscription_canceled_at: string | null
  stripe_subscription_id: string | null
} | null

type SubInfo = {
  status: string
  plan: string
  period: string
  amount_cents: number
  current_period_end: string | null
  canceled_at: string | null
} | null

type EngagementInfo = { mode: string; multiplicateur: number; fin: string | null } | null

export default function AbonnementClient({
  profile,
  subscription,
  engagement,
}: {
  profile: ProfileInfo
  subscription: SubInfo
  engagement: EngagementInfo
}) {
  const router = useRouter()
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [reason, setReason] = useState<string>('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const status = profile?.subscription_status ?? 'none'
  const plan = profile?.plan ?? 'free'
  const period = subscription?.period ?? profile?.plan_period ?? 'month'
  const priceLabel = subscription
    ? `${(subscription.amount_cents / 100).toFixed(2)} €/${period === 'year' ? 'an' : 'mois'}`
    : '—'
  const nextBilling = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('fr-FR')
    : '—'

  async function openPortal() {
    setWorking(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else throw new Error(data.error ?? 'Portail indisponible')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
      setWorking(false)
    }
  }

  async function confirmCancel() {
    setWorking(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        router.refresh()
        setStep(0)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setWorking(false)
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold mb-1">Mon abonnement</h1>
        <p className="text-sm text-white/60">Gère ton plan, ta pause et ta résiliation.</p>
      </header>

      <section className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-white/50 uppercase tracking-wider">Plan actuel</div>
            <div className="text-lg font-semibold capitalize">{plan === 'premium' ? 'VIDA Premium' : 'Découverte (gratuit)'}</div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs ${
            status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
            status === 'trialing' ? 'bg-blue-500/20 text-blue-300' :
            status === 'past_due' ? 'bg-amber-500/20 text-amber-300' :
            status === 'canceled' ? 'bg-red-500/20 text-red-300' :
            'bg-white/10 text-white/60'
          }`}>
            {status === 'trialing' ? 'Essai' : status === 'active' ? 'Actif' : status === 'past_due' ? 'Retard' : status === 'canceled' ? 'Résilié' : 'Aucun'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-white/50 text-xs">Prix</div>
            <div>{priceLabel}</div>
          </div>
          <div>
            <div className="text-white/50 text-xs">Prochaine échéance</div>
            <div>{nextBilling}</div>
          </div>
        </div>

        {engagement && (
          <div className="bg-white/5 rounded-xl p-3 text-sm">
            <div className="text-white/50 text-xs uppercase">Engagement</div>
            <div>{engagement.mode} — multiplicateur ×{engagement.multiplicateur}</div>
          </div>
        )}

        {status !== 'none' && status !== 'canceled' && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={openPortal} disabled={working}>Gérer / Pause</Button>
            <Button onClick={() => setStep(1)} disabled={working}>Résilier</Button>
          </div>
        )}

        {status === 'none' && (
          <Button onClick={() => router.push('/subscribe')}>Commencer mon abonnement</Button>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}
      </section>

      <section className="text-xs text-white/40 space-y-1">
        <p>Accès immédiat activé (art. L221-28 Code conso).</p>
        <p>Résiliation effective à la fin de la période en cours. Données conservées 3 ans (RGPD).</p>
      </section>

      {step > 0 && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full space-y-4">
            {step === 1 && (
              <>
                <h2 className="text-xl font-semibold">Avant de partir…</h2>
                <p className="text-sm text-white/70">Tu vas perdre :</p>
                <ul className="text-sm text-white/80 space-y-1">
                  <li>• Tes gains en attente sur le wallet</li>
                  <li>• Ton streak actuel</li>
                  <li>• Ton multiplicateur d&apos;engagement</li>
                  <li>• Les commissions de tes filleuls actifs</li>
                </ul>
                <div className="flex gap-2 justify-end">
                  <Button onClick={() => setStep(0)}>Annuler</Button>
                  <Button onClick={() => setStep(2)}>Continuer</Button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <h2 className="text-xl font-semibold">Et si tu mettais en pause ?</h2>
                <p className="text-sm text-white/70">
                  Pause 1 mois → tu gardes tout (streak, multiplicateur, wallet).
                </p>
                <div className="flex gap-2 justify-end">
                  <Button onClick={openPortal}>Mettre en pause</Button>
                  <Button onClick={() => setStep(3)}>Résilier quand même</Button>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <h2 className="text-xl font-semibold">Pourquoi nous quittes-tu ?</h2>
                <div className="space-y-2 text-sm">
                  {['Trop cher', 'Pas assez de gains', 'Je passe sur une autre app Purama', 'Autre'].map(r => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button onClick={() => setStep(0)}>Annuler</Button>
                  <Button disabled={!reason || working} onClick={confirmCancel}>Confirmer</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
