'use client'

import { motion } from 'framer-motion'
import { fadeUp, staggerParent, slideInLeft, slideInRight } from './animations'
import { PILIERS } from './constants'

export default function PiliersSection() {
  return (
    <section id="piliers" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--emerald)] mb-4">
            Les trois piliers
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-light leading-[1.15]">
            Trois piliers. <span className="text-[var(--emerald)]">Un chemin.</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerParent}
          className="grid md:grid-cols-3 gap-6"
        >
          {PILIERS.map((p, i) => (
            <motion.div
              key={p.title}
              variants={i === 0 ? slideInLeft : i === 2 ? slideInRight : fadeUp}
              className="glass-card p-8 rounded-3xl hover:bg-[var(--bg-card-hover)] transition-all"
            >
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--emerald)]/20 to-[var(--sage)]/10 flex items-center justify-center mb-6">
                <p.icon className="h-6 w-6 text-[var(--emerald)]" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-medium mb-3">
                {p.title}
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
