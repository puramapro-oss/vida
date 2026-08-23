'use client'

import { motion } from 'framer-motion'
import { fadeUp, staggerParent, scaleIn } from './animations'
import { ACTIONS } from './constants'

export default function ActionsGrid() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--emerald)] mb-4">
            Ce que tu peux faire
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-light leading-[1.15]">
            Six gestes. <span className="text-[var(--emerald)]">Infinies traces.</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerParent}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {ACTIONS.map((a) => (
            <motion.div
              key={a.title}
              variants={scaleIn}
              className="glass-card p-6 rounded-3xl group"
            >
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br from-[var(--emerald)]/20 to-[var(--sage)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <a.icon className="h-5 w-5 text-[var(--emerald)]" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-medium mb-1.5">
                    {a.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {a.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
