'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Leaf, Users, Wallet, Heart, Home, Briefcase, Baby,
  Accessibility, GraduationCap, UserCheck, MapPin,
  ArrowRight, ArrowLeft, Check, Download, ExternalLink, Sparkles,
  Euro, TrendingUp, ChevronDown, ChevronUp,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import { useAuth } from '@/hooks/useAuth'

type SituationTag =
  | 'etudiant' | 'demandeur_emploi' | 'salarie' | 'independant' | 'retraite'
  | 'parent' | 'famille_monoparentale' | 'handicape' | 'senior' | 'jeune'
  | 'locataire' | 'proprietaire' | 'zfrr'

interface Aide {
  id: string
  slug: string
  nom: string
  type_aide: string
  organisme: string
  profil_eligible: SituationTag[]
  montant_max: number
  periodicite: 'mensuelle' | 'annuelle' | 'ponctuelle'
  url_officielle: string
  description: string
  cumulable: boolean
  // Optional OpenFisca-enriched fields (present when /api/aides/search used)
  montant_affiche?: number
  montant_simule?: number | null
  source_montant?: 'openfisca' | 'estimatif'
  openfisca_variable?: string | null
  legifrance_refs?: string[]
  simulation_possible?: boolean
}

const SITUATIONS: { tag: SituationTag; label: string; icon: typeof Users; hint: string }[] = [
  { tag: 'demandeur_emploi', label: 'Demandeur d\'emploi', icon: Briefcase, hint: 'Inscrit Pôle Emploi / fin de contrat' },
  { tag: 'salarie', label: 'Salarié', icon: UserCheck, hint: 'CDI, CDD, intérim' },
  { tag: 'independant', label: 'Indépendant', icon: Briefcase, hint: 'Micro-entrepreneur, freelance, TNS' },
  { tag: 'etudiant', label: 'Étudiant', icon: GraduationCap, hint: 'Bac+1 et plus' },
  { tag: 'jeune', label: 'Jeune (16-29 ans)', icon: Sparkles, hint: 'Peu importe le statut' },
  { tag: 'retraite', label: 'Retraité', icon: Heart, hint: 'Régime général / privé / public' },
  { tag: 'senior', label: 'Senior (60+)', icon: Heart, hint: 'Perte d\'autonomie ou préparation' },
  { tag: 'parent', label: 'Parent', icon: Baby, hint: '1 enfant ou plus à charge' },
  { tag: 'famille_monoparentale', label: 'Parent isolé', icon: Baby, hint: 'Sans conjoint·e' },
  { tag: 'handicape', label: 'Handicap', icon: Accessibility, hint: 'Taux ≥50% (RQTH, MDPH)' },
  { tag: 'locataire', label: 'Locataire', icon: Home, hint: 'Privé, social, résidence' },
  { tag: 'proprietaire', label: 'Propriétaire', icon: Home, hint: 'Résidence principale' },
  { tag: 'zfrr', label: 'Zone Ruralité (ZFRR)', icon: MapPin, hint: 'Commune en Zone France Ruralité Revitalisation' },
]

const REGIONS: { value: string; label: string }[] = [
  { value: '',                       label: 'Non précisée' },
  { value: 'ile-de-france',          label: 'Île-de-France' },
  { value: 'auvergne-rhone-alpes',   label: 'Auvergne-Rhône-Alpes' },
  { value: 'nouvelle-aquitaine',     label: 'Nouvelle-Aquitaine' },
  { value: 'occitanie',              label: 'Occitanie' },
  { value: 'hauts-de-france',        label: 'Hauts-de-France' },
  { value: 'grand-est',              label: 'Grand Est' },
  { value: 'provence-alpes-cote-d-azur', label: 'PACA' },
  { value: 'pays-de-la-loire',       label: 'Pays de la Loire' },
  { value: 'bretagne',               label: 'Bretagne' },
  { value: 'normandie',              label: 'Normandie' },
  { value: 'bourgogne-franche-comte', label: 'Bourgogne-Franche-Comté' },
  { value: 'centre-val-de-loire',    label: 'Centre-Val de Loire' },
  { value: 'corse',                  label: 'Corse' },
  { value: 'outre-mer',              label: 'Outre-mer' },
]

const TYPE_COLORS: Record<string, string> = {
  revenu: 'from-emerald-500/20 to-emerald-400/5',
  logement: 'from-sky-500/20 to-sky-400/5',
  sante: 'from-rose-500/20 to-rose-400/5',
  handicap: 'from-violet-500/20 to-violet-400/5',
  famille: 'from-amber-500/20 to-amber-400/5',
  jeune: 'from-pink-500/20 to-pink-400/5',
  emploi: 'from-indigo-500/20 to-indigo-400/5',
  energie: 'from-lime-500/20 to-lime-400/5',
  senior: 'from-teal-500/20 to-teal-400/5',
  fiscal: 'from-yellow-500/20 to-yellow-400/5',
  transport: 'from-orange-500/20 to-orange-400/5',
}

function formatMontant(a: Aide): string {
  if (a.montant_max === 0) return 'Avantage en nature'
  const suf = a.periodicite === 'mensuelle' ? '/an (en cumulé)' : a.periodicite === 'annuelle' ? '/an' : 'en une fois'
  return `jusqu'à ${a.montant_max.toLocaleString('fr-FR')}€ ${suf}`
}

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

  const generatePDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 48
    let y = margin

    doc.setFillColor(16, 185, 129)
    doc.rect(0, 0, pageW, 80, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('VIDA — Dossier de financement', margin, 50)

    y = 120
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, margin, y)
    y += 20
    doc.text(`Situation : ${situation.join(', ')}`, margin, y)
    y += 20
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(16, 185, 129)
    doc.text(`Cumul estimé : jusqu'à ${cumul.toLocaleString('fr-FR')} € par an`, margin, y)
    y += 30

    doc.setDrawColor(16, 185, 129)
    doc.line(margin, y, pageW - margin, y)
    y += 20

    aides.forEach((a, i) => {
      if (y > 720) { doc.addPage(); y = margin }
      doc.setTextColor(30, 30, 30)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(`${i + 1}. ${a.nom}`, margin, y)
      y += 16
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(80, 80, 80)
      doc.text(`Organisme : ${a.organisme}  ·  ${formatMontant(a)}`, margin, y)
      y += 14
      const desc = doc.splitTextToSize(a.description, pageW - margin * 2)
      doc.text(desc, margin, y)
      y += desc.length * 12 + 4
      doc.setTextColor(16, 185, 129)
      doc.textWithLink('→ Faire la demande officielle', margin, y, { url: a.url_officielle })
      y += 22
    })

    if (y > 700) { doc.addPage(); y = margin }
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(9)
    doc.text('Ces montants sont estimatifs et soumis à conditions. VIDA n\'est pas un organisme social.', margin, y + 20)
    doc.text('Vérifie ton éligibilité sur chaque site officiel. SASU PURAMA · Frasne (25560).', margin, y + 34)

    doc.save(`VIDA-financement-${new Date().toISOString().slice(0, 10)}.pdf`)
    setStep(4)
  }

  return (
    <>
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
                <p className="text-[var(--text-secondary)] mb-8">Coche tout ce qui s'applique à toi (plusieurs choix possibles).</p>

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
                  <p className="text-sm text-[var(--text-muted)]">par an (montants plafonds, soumis à conditions)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {aides.map(a => (
                    <div
                      key={a.id}
                      className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${TYPE_COLORS[a.type_aide] ?? ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-semibold text-[var(--text-primary)] leading-tight">{a.nom}</h3>
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] bg-white/5 px-2 py-1 rounded-full shrink-0">
                          {a.organisme}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">{a.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[var(--emerald)]">{formatMontant(a)}</span>
                        <a
                          href={a.url_officielle}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          Source <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
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
                    onClick={generatePDF}
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
                  Crée un compte VIDA pour suivre tes demandes, recevoir des rappels, et débloquer de nouvelles aides dès qu'elles sortent.
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
            VIDA n'est pas un organisme social. Ces montants sont des plafonds indicatifs. Vérifie ton éligibilité réelle sur chaque site officiel.
          </p>
        </div>
      </main>
    </>
  )
}
