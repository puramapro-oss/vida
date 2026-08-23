'use client'

import { motion } from 'framer-motion'
import { fadeUp, staggerParent, scaleIn } from './animations'
import { COMMENT } from './constants'

export default function CommentSection() {
  return (
    <section id="comment" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--emerald)] mb-4">
            Comment ça marche
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-light leading-[1.15]">
            Trois pas. <span className="text-[var(--emerald)]">Une vie.</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerParent}
          className="grid md:grid-cols-3 gap-6"
        >
          {COMMENT.map((s) => (
            <motion.div
              key={s.num}
              variants={scaleIn}
              className="glass-card p-8 rounded-3xl relative overflow-hidden"
            >
              <div className="absolute -top-2 -right-2 font-[family-name:var(--font-display)] text-7xl font-bold text-[var(--emerald)]/10 select-none">
                {s.num}
              </div>
              <div className="relative">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--emerald)] mb-3">
                  Étape {s.num}
                </p>
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-medium mb-3">
                  {s.title}
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
