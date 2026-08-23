'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import { Leaf } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import FinancerDisclaimer from '@/components/shared/FinancerDisclaimer'
import {
  type SituationTag,
  type Aide,
} from './utils'
import { generatePDF } from './pdf'
import Step1Profile from './steps/Step1Profile'
import Step2Matching from './steps/Step2Matching'
import Step3PDF from './steps/Step3PDF'
import Step4Suivi from './steps/Step4Suivi'

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
            {step === 1 && (
              <Step1Profile
                situation={situation}
                toggleTag={toggleTag}
                advanced={advanced}
                setAdvanced={setAdvanced}
                age={age}
                setAge={setAge}
                revenus={revenus}
                setRevenus={setRevenus}
                enfants={enfants}
                setEnfants={setEnfants}
                loyer={loyer}
                setLoyer={setLoyer}
                region={region}
                setRegion={setRegion}
                hasAnyPrecision={hasAnyPrecision}
                user={user}
                error={error}
                loading={loading}
                submitMatch={submitMatch}
              />
            )}

            {step === 2 && (
              <Step2Matching
                aides={aides}
                cumul={cumul}
                simulationOk={simulationOk}
                setStep={setStep}
              />
            )}

            {step === 3 && (
              <Step3PDF
                aides={aides}
                setStep={setStep}
                handleGeneratePDF={handleGeneratePDF}
              />
            )}

            {step === 4 && (
              <Step4Suivi
                setStep={setStep}
                setSituation={setSituation}
                setAides={setAides}
                setCumul={setCumul}
              />
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
