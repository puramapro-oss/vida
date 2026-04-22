'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, Check } from 'lucide-react'

const STORAGE_KEY = 'vida_financer_disclaimer_ack'
const TTL_DAYS    = 365

/**
 * Modal de 1ère visite /financer — conformité CNIL/DGCCRF.
 * Affiche une fois par navigateur, 365j. Cookie localStorage opt-in.
 */
export default function FinancerDisclaimer() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        // Laisse le temps à la page de se charger (évite flash)
        const t = window.setTimeout(() => setShow(true), 300)
        return () => window.clearTimeout(t)
      }
      const { expiresAt } = JSON.parse(stored) as { expiresAt: number }
      if (Date.now() > expiresAt) {
        const t = window.setTimeout(() => setShow(true), 300)
        return () => window.clearTimeout(t)
      }
    } catch {
      // localStorage bloqué / navigation privée → ne pas forcer, skip
    }
  }, [])

  const ack = () => {
    try {
      const expiresAt = Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ expiresAt }))
    } catch {
      // ignore
    }
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="fin-disclaimer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="financer-disclaimer-title"
          data-testid="financer-disclaimer"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card-static max-w-md w-full rounded-3xl p-6 md:p-8"
          >
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--emerald)]/20 to-[var(--sage)]/10 flex items-center justify-center mb-5">
              <Info className="h-6 w-6 text-[var(--emerald)]" />
            </div>
            <h2
              id="financer-disclaimer-title"
              className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-medium text-[var(--text-primary)] mb-3"
            >
              Avant de commencer
            </h2>
            <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
              <p>
                <strong className="text-[var(--text-primary)]">VIDA n&apos;est pas un organisme social.</strong>{' '}
                Nous ne versons aucune aide. Nous t&apos;aidons seulement à identifier celles auxquelles tu es susceptible d&apos;avoir droit.
              </p>
              <p>
                Les montants affichés sont <strong className="text-[var(--text-primary)]">indicatifs</strong> (plafonds ou simulations). Les droits réels dépendent de ta situation précise et des règles en vigueur.
              </p>
              <p>
                Vérifie toujours ton éligibilité et fais tes démarches sur les <strong className="text-[var(--text-primary)]">sites officiels</strong>{' '}
                (CAF, France&nbsp;Travail, CPAM, MDPH, impots.gouv.fr…).
              </p>
            </div>
            <button
              onClick={ack}
              data-testid="financer-disclaimer-ack"
              className="w-full rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all inline-flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" /> J&apos;ai compris, continuer
            </button>
            <p className="text-[11px] text-[var(--text-muted)] text-center mt-4">
              SASU PURAMA · Frasne (25560) · Ce message s&apos;affiche une seule fois.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
