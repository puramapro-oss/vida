'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Leaf, ArrowRight, ArrowLeft, Check, Download, ExternalLink,
  Euro, TrendingUp, ChevronDown, ChevronUp, Calculator, BookOpen,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import FinancerDisclaimer from '@/components/shared/FinancerDisclaimer'
import {
  type SituationTag,
  type Aide,
  SITUATIONS,
  REGIONS,
  TYPE_COLORS,
  formatMontant,
  legifranceSearchUrl,
} from './utils'
import { generatePDF } from './pdf'

export default function FinancerPage() {
  const { user } = useAuth()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [situation, setSituation] = useState<SituationTag[]>([])
  const [aides, setAides] = useState<Aide[]>([])
  const [cumul, setCumul] = useState(0)
  const [simulationOk, setSimulationOk] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Optional precision fields (OpenFisca-enabled when user authenticated)
  const [advanced, setAdvanced] = useState(false)
  const [age, setAge] = useState<string>('')
  const [revenus, setRevenus] = useState<string>('')
  const [enfants, setEnfants] = useState<string>('')
  const [loyer, setLoyer] = useState<string>('')
  const [region, setRegion] = useState<string>('')

  const toggleTag = (t: SituationTag) => {
    setSituation(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t])
  }

  const toInt = (s: string): number | undefined => {
    const n = parseInt(s, 10)
    return Number.isFinite(n) && n >= 0 ? n : undefined
  }

  const hasAnyPrecision = (): boolean =>
    Boolean(toInt(age) ?? toInt(revenus) ?? toInt(enfants) ?? toInt(loyer) ?? region)

  const submitMatch = async () => {
    if (situation.length === 0) {
      setError('Sélectionne au moins une situation pour voir les aides qui te correspondent.')
      return
    }
    setError(null)
    setLoading(true)

    const precisionProfile = {
      situation,
      age:              toInt(age),
      revenus_mensuels: toInt(revenus),
      enfants:          toInt(enfants),
      loyer_mensuel:    toInt(loyer),
      region:           region || undefined,
    }

    // Route selection : OpenFisca si user auth + au moins un champ précis fourni
    const useOpenFisca = Boolean(user) && hasAnyPrecision()

    try {
      if (useOpenFisca) {
        const res = await fetch('/api/aides/search', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(precisionProfile),
        })
        if (res.ok) {
          const data = await res.json()
          setAides(data.aides)
          setCumul(data.cumul_estime)
          setSimulationOk(data.simulation_ok === true)
          setStep(2)
          return
        }
        // Fallback silencieux si auth expirée ou 503 OpenFisca — on enchaîne sur /match
      }

      const res = await fetch('/api/financer/match', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(precisionProfile),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur — réessaie dans un instant.')
        return
      }
      setAides(data.aides)
      setCumul(data.cumul_estime)
      setSimulationOk(false)
      setStep(2)
    } catch {
      setError('Connexion impossible. Vérifie ton réseau et réessaie.')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePDF = () => {
    generatePDF(aides, situation, cumul, simulationOk, () => setStep(4))
  }

  return (
    <>
      <FinancerDisclaimer />
      <div className="vida-nature-bg" />
      <div className="aurora" />

      <main className="relative min-h-screen px-4 py-10 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors mb-6">
              <Leaf className="h-4 w-4 text-[var(--emerald)]" />
              VIDA
            </Link>
            <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-light tracking-tight mb-3">
              Finance ta vie. <span className="text-[var(--emerald)]">Gratuitement.</span>
            </h1>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              La plupart des gens ne réclament pas les aides auxquelles ils ont droit. VIDA te montre lesquelles — en 60 secondes.
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  s <= step ? 'bg-[var(--emerald)] w-12' : 'bg-white/10 w-6'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1 — PROFIL */}
            {step === 1 && (
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
            )}

            {/* STEP 2 — MATCHING */}
            {step === 2 && (
              <motion.section
                key="s2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="space-y-4"
              >
                <div className="glass-card-static rounded-3xl p-6 md:p-8 text-center">
                  <div className="vida-chip mb-4 mx-auto inline-flex">
                    <span className="vida-pulse-dot" /> {aides.length} aides potentielles pour toi
                  </div>
                  <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light mb-2">
                    Cumul estimé
                  </h2>
                  <p className="impact-counter text-4xl md:text-6xl mb-2">
                    {cumul.toLocaleString('fr-FR')} €
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    par an — {simulationOk ? 'montants calculés par OpenFisca' : 'montants plafonds indicatifs'}
                  </p>
                  {simulationOk && (
                    <div
                      data-testid="financer-openfisca-banner"
                      className="mt-4 inline-flex items-center gap-2 text-xs text-[var(--emerald)] bg-[var(--emerald)]/10 border border-[var(--emerald)]/30 rounded-full px-3 py-1.5"
                    >
                      <Calculator className="h-3.5 w-3.5" />
                      <span>Simulation officielle OpenFisca — source : api.openfisca.fr</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {aides.map(a => {
                    const isOpenFisca = a.source_montant === 'openfisca' && typeof a.montant_simule === 'number'
                    const refs = a.legifrance_refs ?? []
                    return (
                      <div
                        key={a.id}
                        data-testid={`aide-card-${a.slug}`}
                        className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${TYPE_COLORS[a.type_aide] ?? ''}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="font-semibold text-[var(--text-primary)] leading-tight">{a.nom}</h3>
                          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] bg-white/5 px-2 py-1 rounded-full shrink-0">
                            {a.organisme}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">{a.description}</p>

                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-semibold text-[var(--emerald)]">{formatMontant(a)}</span>
                          {isOpenFisca ? (
                            <span
                              data-testid={`badge-openfisca-${a.slug}`}
                              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--emerald)] bg-[var(--emerald)]/15 border border-[var(--emerald)]/30 rounded-full px-2 py-0.5 shrink-0"
                            >
                              <Calculator className="h-3 w-3" /> OpenFisca
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)] bg-white/5 border border-[var(--border)] rounded-full px-2 py-0.5 shrink-0">
                              Plafond estimatif
                            </span>
                          )}
                        </div>

                        {refs.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/5">
                            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
                              <BookOpen className="h-3 w-3" /> Base légale
                            </p>
                            <ul className="space-y-0.5">
                              {refs.map((ref, i) => (
                                <li key={i}>
                                  <a
                                    href={legifranceSearchUrl(ref)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--emerald)] transition-colors inline-flex items-center gap-1"
                                  >
                                    {ref} <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex items-center justify-end mt-3">
                          <a
                            href={a.url_officielle}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            Faire la demande <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-2xl border border-[var(--border)] bg-white/5 px-6 py-3.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all inline-flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Modifier mon profil
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    data-testid="financer-next-pdf"
                    className="flex-1 rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all inline-flex items-center justify-center gap-2"
                  >
                    Générer mon dossier <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.section>
            )}

            {/* STEP 3 — PDF */}
            {step === 3 && (
              <motion.section
                key="s3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="glass-card-static rounded-3xl p-8 md:p-12 text-center"
              >
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[var(--emerald)]/20 to-[var(--sage)]/10 flex items-center justify-center mx-auto mb-6">
                  <Download className="h-8 w-8 text-[var(--emerald)]" />
                </div>
                <h2 className="font-[family-name:var(--font-display)] text-3xl font-light mb-3">
                  Ton dossier est prêt.
                </h2>
                <p className="text-[var(--text-secondary)] max-w-lg mx-auto mb-8">
                  Un PDF clair avec les {aides.length} aides, les liens officiels et les démarches. À télécharger et garder sur toi.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setStep(2)}
                    className="rounded-2xl border border-[var(--border)] bg-white/5 px-6 py-3.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
                  >
                    Revoir mes aides
                  </button>
                  <button
                    onClick={handleGeneratePDF}
                    data-testid="financer-download-pdf"
                    className="rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all inline-flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" /> Télécharger le PDF
                  </button>
                </div>
              </motion.section>
            )}

            {/* STEP 4 — SUIVI */}
            {step === 4 && (
              <motion.section
                key="s4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="glass-card-static rounded-3xl p-8 md:p-12 text-center"
              >
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[var(--emerald)]/20 to-[var(--sage)]/10 flex items-center justify-center mx-auto mb-6">
                  <Check className="h-8 w-8 text-[var(--emerald)]" />
                </div>
                <h2 className="font-[family-name:var(--font-display)] text-3xl font-light mb-3">
                  Et maintenant ?
                </h2>
                <p className="text-[var(--text-secondary)] max-w-lg mx-auto mb-8">
                  Crée un compte VIDA pour suivre tes demandes, recevoir des rappels, et débloquer de nouvelles aides dès qu&apos;elles sortent.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/signup"
                    className="rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all inline-flex items-center justify-center gap-2"
                  >
                    Créer mon compte VIDA <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => { setStep(1); setSituation([]); setAides([]); setCumul(0) }}
                    className="rounded-2xl border border-[var(--border)] bg-white/5 px-6 py-3.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
                  >
                    Refaire un bilan
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-[var(--text-muted)] mt-10 max-w-2xl mx-auto">
            VIDA n&apos;est pas un organisme social. Ces montants sont des plafonds indicatifs. Vérifie ton éligibilité réelle sur chaque site officiel.
          </p>
        </div>
      </main>
    </>
  )
}
