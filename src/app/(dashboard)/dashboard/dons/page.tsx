'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Trees, Users, Gift, Check } from 'lucide-react'

const PRESETS = [5, 10, 25, 50, 100]

const DESTINATIONS = [
  { id: 'association_vida', label: 'Association VIDA', desc: 'Actions collectives & réinvestissement écosystème', icon: Heart, color: 'text-rose-400' },
  { id: 'reforestation', label: 'Reforestation Ecologi', desc: 'Chaque euro = 1 arbre planté à long terme', icon: Trees, color: 'text-emerald-400' },
  { id: 'solidarite_alimentaire', label: 'Solidarité alimentaire', desc: 'Banques alimentaires partenaires', icon: Users, color: 'text-amber-400' },
] as const

export default function DonsPage() {
  const [amount, setAmount] = useState(10)
  const [dest, setDest] = useState<typeof DESTINATIONS[number]['id']>('association_vida')
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto glass-card-static rounded-3xl p-10 text-center">
        <div className="h-16 w-16 rounded-3xl bg-[var(--emerald)]/20 mx-auto mb-6 flex items-center justify-center">
          <Check className="h-8 w-8 text-[var(--emerald)]" />
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-light mb-2">Merci, belle âme.</h2>
        <p className="text-[var(--text-secondary)]">
          Le paiement sécurisé Stripe arrive bientôt. En attendant, ton intention est notée — elle compte déjà.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <header>
        <div className="vida-chip mb-3"><Gift className="h-3.5 w-3.5" /> Don libre</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light mb-2">
          Donner, c'est grandir.
        </h1>
        <p className="text-[var(--text-secondary)]">Chaque don nourrit l'écosystème VIDA et ses bénéficiaires.</p>
      </header>

      <form onSubmit={handleSubmit} className="glass-card-static rounded-3xl p-6 md:p-8 flex flex-col gap-6">
        {/* Destination */}
        <fieldset>
          <legend className="text-sm font-medium text-[var(--text-secondary)] mb-3">Où va ce don ?</legend>
          <div className="grid grid-cols-1 gap-2">
            {DESTINATIONS.map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDest(d.id)}
                data-testid={`dest-${d.id}`}
                className={`text-left rounded-2xl border p-4 transition-all ${
                  dest === d.id
                    ? 'border-[var(--emerald)] bg-[var(--emerald)]/10'
                    : 'border-[var(--border)] bg-white/[0.02] hover:bg-white/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <d.icon className={`h-5 w-5 ${d.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[var(--text-primary)]">{d.label}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{d.desc}</p>
                  </div>
                  {dest === d.id && <Check className="h-4 w-4 text-[var(--emerald)] shrink-0" />}
                </div>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Montant */}
        <fieldset>
          <legend className="text-sm font-medium text-[var(--text-secondary)] mb-3">Montant</legend>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESETS.map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  amount === v ? 'bg-[var(--emerald)] text-[#052e16]' : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'
                }`}
              >
                {v}€
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={10000}
              value={amount}
              onChange={e => setAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              data-testid="don-amount"
              className="w-full rounded-2xl border border-[var(--border)] bg-white/[0.02] px-4 py-3 pr-10 text-[var(--text-primary)] input-glow"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">€</span>
          </div>
        </fieldset>

        {/* Message */}
        <fieldset>
          <label htmlFor="msg" className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Un mot qui accompagne (facultatif)
          </label>
          <textarea
            id="msg"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            maxLength={280}
            placeholder="Pour que chacun puisse grandir…"
            className="w-full rounded-2xl border border-[var(--border)] bg-white/[0.02] px-4 py-3 text-[var(--text-primary)] input-glow resize-none placeholder:text-[var(--text-muted)]"
          />
          <p className="text-xs text-[var(--text-muted)] mt-1 text-right">{message.length}/280</p>
        </fieldset>

        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={e => setAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)] bg-white/5 accent-[var(--emerald)]"
          />
          <span className="text-sm text-[var(--text-secondary)]">Je souhaite rester anonyme</span>
        </label>

        <button
          type="submit"
          data-testid="don-submit"
          className="w-full rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-6 py-4 text-base font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all"
        >
          Donner {amount}€
        </button>
      </form>

      <p className="text-center text-xs text-[var(--text-muted)]">
        Paiement sécurisé Stripe à venir. Ton don ouvrira droit à 66% de réduction d'impôt si versé à l'association VIDA.
      </p>
    </div>
  )
}
