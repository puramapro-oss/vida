'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import { fadeUp, scaleIn, staggerParent } from './animations'

export default function ImpactSection() {
  const [data, setData] = useState<{
    missions_count: number
    aides_count: number
    faq_count: number
    users_count: number
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/impact/public', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setData(d)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!data) return null

  const stats = [
    { value: data.missions_count, label: 'missions réelles', color: 'var(--emerald)' },
    { value: data.aides_count, label: 'aides recensées', color: 'var(--sage)' },
    { value: data.faq_count, label: 'réponses claires', color: 'var(--emerald)' },
    { value: data.users_count, label: 'graines plantées', color: 'var(--sage)' },
  ]

  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--emerald)] mb-4">
            Ensemble
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-light leading-[1.15]">
            On construit, <span className="text-[var(--emerald)]">pas à pas.</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerParent}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={scaleIn}
              className="glass-card rounded-3xl p-6 md:p-8 text-center"
            >
              <div className="impact-counter text-4xl md:text-5xl mb-2">
                <AnimatedCounter value={s.value} duration={1.6} />
              </div>
              <p className="text-xs md:text-sm text-[var(--text-secondary)] uppercase tracking-[0.15em]">
                {s.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
