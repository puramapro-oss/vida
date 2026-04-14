'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { shouldShowAffirmationModal, markAffirmationShown, getQuoteForSlot } from '@/lib/awakening'

interface Affirmation {
  id: string
  category: string
  text_fr: string
}

export default function SpiritualLayer() {
  const [affirmation, setAffirmation] = useState<Affirmation | null>(null)
  const [open, setOpen] = useState(false)
  const [integrating, setIntegrating] = useState(false)
  const [confetti, setConfetti] = useState(false)

  useEffect(() => {
    if (!shouldShowAffirmationModal()) return
    fetch('/api/spiritual/affirmation')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.id) {
          setAffirmation(data)
          setOpen(true)
        }
      })
      .catch(() => { /* silent */ })
  }, [])

  const handleIntegrate = async () => {
    setIntegrating(true)
    setConfetti(true)
    markAffirmationShown()
    // Track awakening event (best-effort, ignore if not auth)
    fetch('/api/spiritual/affirmation/track', { method: 'POST' }).catch(() => {})
    setTimeout(() => {
      setOpen(false)
      setIntegrating(false)
      setConfetti(false)
    }, 1600)
  }

  return (
    <AnimatePresence>
      {open && affirmation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => { setOpen(false); markAffirmationShown() }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            onClick={e => e.stopPropagation()}
            className="relative max-w-lg w-full rounded-3xl bg-gradient-to-br from-[var(--bg-forest)]/95 to-[var(--bg-nebula)]/95 backdrop-blur-2xl border border-[var(--emerald)]/30 p-8 md:p-12 shadow-[0_20px_80px_rgba(16,185,129,0.25)]"
          >
            <button
              onClick={() => { setOpen(false); markAffirmationShown() }}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <div className="h-10 w-10 rounded-2xl bg-[var(--emerald)]/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-[var(--emerald)]" />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--emerald)]">
                Affirmation du jour
              </span>
            </div>

            <p className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-light leading-relaxed text-[var(--text-primary)] mb-8">
              « {affirmation.text_fr} »
            </p>

            <button
              onClick={handleIntegrate}
              disabled={integrating}
              data-testid="affirmation-integrate"
              className="w-full rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-6 py-4 text-base font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-60"
            >
              {integrating ? 'J\'intègre…' : 'J\'intègre ✨'}
            </button>
          </motion.div>

          {/* Confetti */}
          {confetti && (
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
              {Array.from({ length: 40 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute top-0 animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.4}s`,
                    color: ['#10B981', '#84cc16', '#f472b6', '#fef3c7'][i % 4],
                    fontSize: `${12 + Math.random() * 14}px`,
                  }}
                >
                  ✦
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function WisdomFooter() {
  const [q, setQ] = useState(() => getQuoteForSlot(30))
  useEffect(() => {
    const t = setInterval(() => setQ(getQuoteForSlot(30)), 30 * 60 * 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <p className="text-center text-xs text-[var(--text-muted)] italic px-4 py-3 border-t border-[var(--border)]">
      « {q.text} » — <span className="not-italic">{q.author}</span>
    </p>
  )
}
