'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Leaf } from 'lucide-react'

export default function CinematicIntro() {
  const [visible, setVisible] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && !localStorage.getItem('vida_intro_seen')) {
        // prefers-reduced-motion : on skip l'intro entièrement
        if (reduced) {
          localStorage.setItem('vida_intro_seen', '1')
          return
        }
        setVisible(true)
        const t = setTimeout(() => dismiss(), 4000)
        return () => clearTimeout(t)
      }
    } catch {}
  }, [reduced])

  function dismiss() {
    try { localStorage.setItem('vida_intro_seen', '1') } catch {}
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#030806]"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Leaf className="h-20 w-20 text-[#10B981]" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="font-[family-name:var(--font-display)] text-5xl font-bold text-white tracking-tight"
            >
              VIDA
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="text-[#10B981] text-lg font-light tracking-widest uppercase"
            >
              Chaque action compte
            </motion.p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            onClick={dismiss}
            className="absolute bottom-10 text-white/40 text-sm hover:text-white/70 transition-colors"
          >
            Passer →
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
