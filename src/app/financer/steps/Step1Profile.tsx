'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Check, ArrowRight, TrendingUp, ChevronDown, ChevronUp,
  Euro, Users, Baby, Home, MapPin, Sparkles,
} from 'lucide-react'
import { type SituationTag, SITUATIONS, REGIONS } from '../utils'

interface Step1ProfileProps {
  situation: SituationTag[]
  toggleTag: (t: SituationTag) => void
  advanced: boolean
  setAdvanced: (v: boolean | ((v: boolean) => boolean)) => void
  age: string
  setAge: (v: string) => void
  revenus: string
  setRevenus: (v: string) => void
  enfants: string
  setEnfants: (v: string) => void
  loyer: string
  setLoyer: (v: string) => void
  region: string
  setRegion: (v: string) => void
  hasAnyPrecision: () => boolean
  user: { id: string } | null
  error: string | null
  loading: boolean
  submitMatch: () => Promise<void>
}

export default function Step1Profile({
  situation,
  toggleTag,
  advanced,
  setAdvanced,
  age,
  setAge,
  revenus,
  setRevenus,
  enfants,
  setEnfants,
  loyer,
  setLoyer,
  region,
  setRegion,
  hasAnyPrecision,
  user,
  error,
  loading,
  submitMatch,
}: Step1ProfileProps) {
  return (
    <motion.section
      key="s1"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="glass-card-static rounded-3xl p-6 md:p-10"
    >
      <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium mb-2">
        Qui es-tu ?
      </h2>
      <p className="text-[var(--text-secondary)] mb-8">Coche tout ce qui s&apos;applique à toi (plusieurs choix possibles).</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SITUATIONS.map(s => {
          const active = situation.includes(s.tag)
          return (
            <button
              key={s.tag}
              type="button"
              onClick={() => toggleTag(s.tag)}
              data-testid={`profil-${s.tag}`}
              className={`text-left rounded-2xl border p-4 transition-all duration-200 ${
                active
                  ? 'border-[var(--emerald)] bg-[var(--emerald)]/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'border-[var(--border)] bg-white/[0.02] hover:bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-[var(--emerald)]/20' : 'bg-white/5'}`}>
                  <s.icon className={`h-5 w-5 ${active ? 'text-[var(--emerald)]' : 'text-[var(--text-secondary)]'}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[var(--text-primary)]">{s.label}</span>
                    {active && <Check className="h-4 w-4 text-[var(--emerald)] shrink-0" />}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{s.hint}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Advanced — précision OpenFisca (auth only) */}
      <div className="mt-8 border-t border-[var(--border)] pt-6">
        <button
          type="button"
          onClick={() => setAdvanced(v => !v)}
          data-testid="financer-toggle-advanced"
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <TrendingUp className="h-4 w-4 text-[var(--emerald)]" />
          <span className="font-medium">Affiner avec mes chiffres réels</span>
          <span className="text-xs text-[var(--text-muted)]">(simulation officielle OpenFisca)</span>
          {advanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        <AnimatePresence initial={false}>
          {advanced && (
            <motion.div
              key="adv"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <label className="block">
                  <span className="text-xs text-[var(--text-muted)] mb-1.5 block flex items-center gap-1.5">
                    <Users className="h-3 w-3" /> Âge
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={15}
                    max={110}
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="ex : 34"
                    data-testid="financer-age"
                    className="w-full rounded-xl bg-white/5 border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--emerald)] focus:bg-white/[0.07] transition-colors"
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-[var(--text-muted)] mb-1.5 block flex items-center gap-1.5">
                    <Euro className="h-3 w-3" /> Revenus mensuels nets (€)
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={20000}
                    value={revenus}
                    onChange={e => setRevenus(e.target.value)}
                    placeholder="ex : 1450"
                    data-testid="financer-revenus"
                    className="w-full rounded-xl bg-white/5 border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--emerald)] focus:bg-white/[0.07] transition-colors"
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-[var(--text-muted)] mb-1.5 block flex items-center gap-1.5">
                    <Baby className="h-3 w-3" /> Enfants à charge
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={20}
                    value={enfants}
                    onChange={e => setEnfants(e.target.value)}
                    placeholder="ex : 2"
                    data-testid="financer-enfants"
                    className="w-full rounded-xl bg-white/5 border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--emerald)] focus:bg-white/[0.07] transition-colors"
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-[var(--text-muted)] mb-1.5 block flex items-center gap-1.5">
                    <Home className="h-3 w-3" /> Loyer mensuel (€)
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={5000}
                    value={loyer}
                    onChange={e => setLoyer(e.target.value)}
                    placeholder="ex : 650"
                    data-testid="financer-loyer"
                    className="w-full rounded-xl bg-white/5 border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--emerald)] focus:bg-white/[0.07] transition-colors"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-xs text-[var(--text-muted)] mb-1.5 block flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> Région
                  </span>
                  <select
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    data-testid="financer-region"
                    className="w-full rounded-xl bg-white/5 border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--emerald)] focus:bg-white/[0.07] transition-colors"
                  >
                    {REGIONS.map(r => (
                      <option key={r.value} value={r.value} className="bg-[#0A0A0F]">{r.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              {!user && hasAnyPrecision() && (
                <p className="mt-4 text-xs text-[var(--text-muted)] bg-white/[0.03] border border-[var(--border)] rounded-xl p-3 flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--emerald)] shrink-0 mt-0.5" />
                  <span>
                    <Link href="/signup" className="text-[var(--emerald)] underline underline-offset-2">Crée un compte gratuit</Link> pour débloquer la simulation officielle OpenFisca — sinon on affiche les plafonds estimatifs.
                  </span>
                </p>
              )}

              {user && hasAnyPrecision() && (
                <p className="mt-4 text-xs text-[var(--emerald)] bg-[var(--emerald)]/10 border border-[var(--emerald)]/30 rounded-xl p-3 flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Simulation OpenFisca activée — tes montants seront calculés au plus juste.</span>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="text-sm text-red-400 mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          {error}
        </p>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-8">
        <p className="text-xs text-[var(--text-muted)]">
          {situation.length} situation{situation.length > 1 ? 's' : ''} sélectionnée{situation.length > 1 ? 's' : ''}
        </p>
        <button
          onClick={submitMatch}
          disabled={loading || situation.length === 0}
          data-testid="financer-submit"
          className="rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 inline-flex items-center justify-center gap-2"
        >
          {loading ? 'Chargement…' : (<>Voir mes aides <ArrowRight className="h-4 w-4" /></>)}
        </button>
      </div>
    </motion.section>
  )
}
