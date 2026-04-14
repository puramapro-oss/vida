'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Check } from 'lucide-react'

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'done'

const TIMINGS = { inhale: 4, hold: 7, exhale: 8 } as const
const CYCLE = TIMINGS.inhale + TIMINGS.hold + TIMINGS.exhale // 19s

export default function BreathePage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [cycles, setCycles] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [saved, setSaved] = useState(false)
  const tickRef = useRef<number | null>(null)
  const startRef = useRef<number>(0)

  useEffect(() => {
    if (phase === 'idle' || phase === 'done') return
    const tick = () => {
      const dt = (Date.now() - startRef.current) / 1000
      setElapsed(Math.floor(dt))
      const t = dt % CYCLE
      if (t < TIMINGS.inhale) setPhase('inhale')
      else if (t < TIMINGS.inhale + TIMINGS.hold) setPhase('hold')
      else setPhase('exhale')
      const done = Math.floor(dt / CYCLE)
      setCycles(done)
      tickRef.current = window.requestAnimationFrame(tick)
    }
    tickRef.current = window.requestAnimationFrame(tick)
    return () => { if (tickRef.current) window.cancelAnimationFrame(tickRef.current) }
  }, [phase])

  const start = () => {
    startRef.current = Date.now()
    setElapsed(0)
    setCycles(0)
    setSaved(false)
    setPhase('inhale')
  }

  const stop = async () => {
    setPhase('done')
    if (tickRef.current) window.cancelAnimationFrame(tickRef.current)
    // Save to DB if authenticated — best-effort
    if (elapsed >= 10) {
      try {
        await fetch('/api/spiritual/breath', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ duration_seconds: elapsed, cycles, technique: '4-7-8' }),
        })
        setSaved(true)
      } catch { /* silent */ }
    }
  }

  const reset = () => {
    setPhase('idle')
    setElapsed(0)
    setCycles(0)
    setSaved(false)
  }

  const scale = phase === 'inhale' ? 1.45 : phase === 'hold' ? 1.45 : phase === 'exhale' ? 0.85 : 1
  const label = phase === 'inhale' ? 'Inspire' : phase === 'hold' ? 'Retiens' : phase === 'exhale' ? 'Expire' : phase === 'done' ? 'Merci' : 'Prêt·e ?'

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center mb-10">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--emerald)] mb-3">Respiration 4-7-8</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light mb-3">
          Pose tes épaules. Laisse venir.
        </h1>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          Inspire 4 secondes, retiens 7, expire 8. Trois minutes suffisent pour changer ta journée.
        </p>
      </div>

      <div className="relative flex items-center justify-center h-[360px] w-[360px] mb-10">
        <motion.div
          animate={{ scale }}
          transition={{ duration: phase === 'inhale' ? TIMINGS.inhale : phase === 'exhale' ? TIMINGS.exhale : 0.5, ease: 'easeInOut' }}
          className="absolute h-56 w-56 rounded-full bg-gradient-to-br from-[var(--emerald)]/40 to-[var(--sage)]/20 blur-2xl"
        />
        <motion.div
          animate={{ scale }}
          transition={{ duration: phase === 'inhale' ? TIMINGS.inhale : phase === 'exhale' ? TIMINGS.exhale : 0.5, ease: 'easeInOut' }}
          className="relative h-48 w-48 rounded-full bg-gradient-to-br from-[var(--emerald)] to-[var(--sage)] shadow-[0_0_80px_rgba(16,185,129,0.5)] flex items-center justify-center"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="font-[family-name:var(--font-display)] text-2xl font-light text-white tracking-wide"
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Cycles</p>
          <p className="impact-counter text-3xl">{cycles}</p>
        </div>
        <div className="h-10 w-px bg-[var(--border)]" />
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Durée</p>
          <p className="impact-counter text-3xl">{elapsed}s</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {phase === 'idle' && (
          <button
            onClick={start}
            data-testid="breathe-start"
            className="rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-8 py-4 text-base font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
          >
            <Play className="h-4 w-4" /> Commencer
          </button>
        )}
        {(phase === 'inhale' || phase === 'hold' || phase === 'exhale') && (
          <button
            onClick={stop}
            data-testid="breathe-stop"
            className="rounded-2xl border border-[var(--border)] bg-white/5 px-8 py-4 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all inline-flex items-center gap-2"
          >
            <Pause className="h-4 w-4" /> Terminer la session
          </button>
        )}
        {phase === 'done' && (
          <>
            {saved && (
              <span className="inline-flex items-center gap-2 text-sm text-[var(--emerald)]">
                <Check className="h-4 w-4" /> +50 XP intégrés
              </span>
            )}
            <button
              onClick={reset}
              className="rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-6 py-3 text-sm font-semibold text-white inline-flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" /> Recommencer
            </button>
          </>
        )}
      </div>
    </div>
  )
}
