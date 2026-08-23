'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

export default function HeroParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const yHeadline = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -60])
  const yOrb = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 120])
  const opacityHeadline = useTransform(scrollYProgress, [0, 0.8], [1, reduced ? 1 : 0.4])

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-16 overflow-hidden"
    >
      {/* Orb derrière — parallax inverse */}
      <motion.div
        aria-hidden="true"
        style={{ y: yOrb }}
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.18)_0%,transparent_60%)] blur-[40px]"
      />
      <motion.div
        style={{ y: yHeadline, opacity: opacityHeadline }}
        className="relative z-10 max-w-4xl mx-auto text-center w-full"
      >
        {children}
      </motion.div>
    </section>
  )
}
