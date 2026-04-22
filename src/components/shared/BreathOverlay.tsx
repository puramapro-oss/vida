'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'

interface BreathOverlayProps {
  open: boolean
  onClose: () => void
  cycles?: number
}

type Phase = 'idle' | 'inspire' | 'hold' | 'expire' | 'done'

const TIMINGS = { inspire: 4000, hold: 7000, expire: 8000 } as const
const LABELS: Record<Phase, string> = {
  idle: 'Prêt·e ?',
  inspire: 'Inspire',
  hold: 'Retiens',
  expire: 'Expire',
  done: 'Merci',
}

export default function BreathOverlay({ open, onClose, cycles = 3 }: BreathOverlayProps) {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('idle')
  const [cycle, setCycle] = useState(0)
  const closeRef = useRef<HTMLButtonElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ESC + focus close button
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Run the breathing cycle
  useEffect(() => {
    if (!open) {
      setPhase('idle')
      setCycle(0)
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }
    if (reduced) {
      setPhase('done')
      return
    }

    const start = setTimeout(() => setPhase('inspire'), 800)
    return () => clearTimeout(start)
  }, [open, reduced])

  useEffect(() => {
    if (!open || reduced || phase === 'idle' || phase === 'done') return

    if (phase === 'inspire') {
      timerRef.current = setTimeout(() => setPhase('hold'), TIMINGS.inspire)
    } else if (phase === 'hold') {
      timerRef.current = setTimeout(() => setPhase('expire'), TIMINGS.hold)
    } else if (phase === 'expire') {
      timerRef.current = setTimeout(() => {
        const next = cycle + 1
        if (next >= cycles) {
          setPhase('done')
        } else {
          setCycle(next)
          setPhase('inspire')
        }
      }, TIMINGS.expire)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [phase, cycle, cycles, open, reduced])

  const circleScale =
    phase === 'inspire' ? 1.6 : phase === 'hold' ? 1.6 : phase === 'expire' ? 1 : 1.1
  const transitionDuration =
    phase === 'inspire'
      ? TIMINGS.inspire / 1000
      : phase === 'expire'
        ? TIMINGS.expire / 1000
        : 0.4

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="breath-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-[#030806]/95 backdrop-blur-xl"
        >
          {/* Close button */}
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Fermer la respiration"
            className="absolute top-6 right-6 rounded-full p-3 text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#10B981]"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>

          <h2 id="breath-title" className="sr-only">
            Respiration guidée 4-7-8
          </h2>

          {/* Breath circle */}
          <div className="relative flex items-center justify-center w-72 h-72 md:w-80 md:h-80">
            <motion.div
              aria-hidden="true"
              animate={{ scale: reduced ? 1 : circleScale }}
              transition={{ duration: transitionDuration, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.45)_0%,rgba(16,185,129,0.1)_60%,transparent_100%)]"
            />
            <motion.div
              aria-hidden="true"
              animate={{ scale: reduced ? 1 : circleScale * 0.85 }}
              transition={{ duration: transitionDuration, ease: 'easeInOut' }}
              className="absolute inset-4 rounded-full border border-[#10B981]/40"
            />
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative text-center"
            >
              <p className="font-[family-name:var(--font-display)] text-4xl md:text-5xl text-white font-light tracking-wide">
                {LABELS[phase]}
              </p>
              {phase !== 'idle' && phase !== 'done' && (
                <p className="mt-3 text-xs uppercase tracking-[0.3em] text-[#6ee7b7]">
                  Cycle {cycle + 1} / {cycles}
                </p>
              )}
            </motion.div>
          </div>

          {/* Subtitle */}
          <div className="mt-12 max-w-md text-center px-4">
            {phase === 'idle' && (
              <p className="text-white/60 text-sm">La respiration commence dans un instant. Assieds-toi confortablement.</p>
            )}
            {phase === 'inspire' && (
              <p className="text-white/70 text-sm">Inspire par le nez, lentement, pendant 4 secondes.</p>
            )}
            {phase === 'hold' && (
              <p className="text-white/70 text-sm">Retiens ton souffle pendant 7 secondes. Sens l&apos;énergie circuler.</p>
            )}
            {phase === 'expire' && (
              <p className="text-white/70 text-sm">Expire par la bouche, tout doucement, pendant 8 secondes.</p>
            )}
            {phase === 'done' && (
              <p className="text-white/70 text-sm">
                Tu viens d&apos;offrir 57 secondes à ton corps. Merci. 🌿
              </p>
            )}
          </div>

          {phase === 'done' && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={onClose}
              className="mt-8 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#84cc16] px-8 py-3 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 transition-transform"
            >
              Continuer
            </motion.button>
          )}

          <button
            onClick={onClose}
            className="absolute bottom-8 text-white/40 text-sm hover:text-white/70 transition-colors"
          >
            Passer →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
