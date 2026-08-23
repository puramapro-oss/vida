'use client'

import { motion } from 'framer-motion'
import { Download } from 'lucide-react'

interface Step3PDFProps {
  aides: unknown[]
  setStep: (s: 1 | 2 | 3 | 4) => void
  handleGeneratePDF: () => void
}

export default function Step3PDF({ aides, setStep, handleGeneratePDF }: Step3PDFProps) {
  return (
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
  )
}
