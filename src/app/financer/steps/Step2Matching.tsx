'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ExternalLink, Calculator, BookOpen } from 'lucide-react'
import { type Aide, formatMontant, TYPE_COLORS, legifranceSearchUrl } from '../utils'

interface Step2MatchingProps {
  aides: Aide[]
  cumul: number
  simulationOk: boolean
  setStep: (s: 1 | 2 | 3 | 4) => void
}

export default function Step2Matching({ aides, cumul, simulationOk, setStep }: Step2MatchingProps) {
  return (
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
  )
}
