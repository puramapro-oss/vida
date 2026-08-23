'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { fadeUp } from './animations'
import { FAQ } from './constants'

export default function FAQSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--emerald)] mb-4">
            Questions
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-light leading-[1.15]">
            Ce qu&apos;on nous demande <span className="text-[var(--emerald)]">souvent.</span>
          </h2>
        </motion.div>

        <div className="space-y-4">
          {FAQ.map((item, i) => (
            <motion.details
              key={item.q}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-6 group"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-[family-name:var(--font-display)] text-base md:text-lg font-medium pr-4">
                  {item.q}
                </span>
                <span className="h-8 w-8 shrink-0 rounded-full border border-[var(--emerald)]/30 flex items-center justify-center text-[var(--emerald)] group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm md:text-base text-[var(--text-secondary)] leading-relaxed">
                {item.a}
              </p>
            </motion.details>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/aide"
            className="text-sm text-[var(--emerald)] hover:underline"
          >
            Voir toute l&apos;aide →
          </Link>
        </div>
      </div>
    </section>
  )
}
