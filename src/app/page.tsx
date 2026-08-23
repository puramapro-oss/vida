'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
const CinematicIntro = dynamic(() => import('@/components/shared/CinematicIntro'), { ssr: false })
const BreathOverlay = dynamic(() => import('@/components/shared/BreathOverlay'), { ssr: false })
import {
  Heart,
  Sparkles,
  ArrowRight,
  Users,
  Check,
  Shield,
  Zap,
  Wind,
  Leaf,
} from 'lucide-react'
import Nav from './landing/Nav'
import HeroParallax from './landing/HeroParallax'
import ImpactSection from './landing/ImpactSection'
import PiliersSection from './landing/PiliersSection'
import ActionsGrid from './landing/ActionsGrid'
import CommentSection from './landing/CommentSection'
import FAQSection from './landing/FAQSection'
import { fadeUp } from './landing/animations'
export default function LandingPage() {
  const [breathOpen, setBreathOpen] = useState(false)

  return (
    <>
      <CinematicIntro />
      <BreathOverlay open={breathOpen} onClose={() => setBreathOpen(false)} />
      <div className="vida-nature-bg" />
      <div className="aurora" />

      <Nav />

      <main className="relative">
        {/* HERO */}
        <HeroParallax>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <div className="vida-chip mb-8 mx-auto inline-flex">
              <span className="vida-pulse-dot" />
              Un mouvement vivant
            </div>

            <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[1.02] mb-8">
              <span className="text-[var(--text-primary)]">Chaque action,</span>
              <br />
              <span className="gradient-text font-semibold">un impact réel.</span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed">
              VIDA transforme tes gestes quotidiens — marcher, donner, respirer, partager —
              en trace vivante pour le monde.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="group w-full sm:w-auto rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-8 py-4 text-base font-semibold text-white shadow-[0_8px_32px_rgba(16,185,129,0.35)] hover:shadow-[0_12px_40px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Commencer — 14 jours offerts
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#comment"
                className="w-full sm:w-auto rounded-2xl border border-[var(--border)] bg-white/5 backdrop-blur-xl px-8 py-4 text-base text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
              >
                Comment ça marche
              </a>
            </div>

            <p className="text-xs text-[var(--text-muted)] mt-8">
              Sans carte bancaire · Résiliable en 1 clic · 10% reversés à l&apos;association
            </p>

            {/* trust badges */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { icon: Shield, label: 'Données EU' },
                { icon: Heart, label: '10% à l\'asso' },
                { icon: Zap, label: 'Sans pub' },
                { icon: Leaf, label: 'Neutre carbone' },
              ].map((b) => (
                <div
                  key={b.label}
                  className="glass-card rounded-2xl px-4 py-3 flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)]"
                >
                  <b.icon className="h-4 w-4 text-[var(--emerald)]" />
                  {b.label}
                </div>
              ))}
            </div>
          </motion.div>
        </HeroParallax>

        {/* MANIFESTE */}
        <section id="manifeste" className="py-24 px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            className="max-w-3xl mx-auto text-center"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--emerald)] mb-4">
              Manifeste
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-light leading-[1.15] mb-8">
              On ne veut plus d&apos;une appli qui mesure.
              <br />
              <span className="text-[var(--emerald)]">On veut une appli qui transforme.</span>
            </h2>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Chaque pas que tu fais, chaque don que tu donnes, chaque souffle que tu poses —
              c&apos;est une graine. VIDA te rend cette graine visible, et la relie à celles des
              autres. Ce n&apos;est pas une app de santé. C&apos;est un rituel quotidien pour
              devenir ce que tu sais déjà être.
            </p>
          </motion.div>
        </section>

        <PiliersSection />

        {/* IMPACT — compteurs réels DB */}
        <ImpactSection />

        <ActionsGrid />

        <CommentSection />

        {/* RITUEL BANNER */}
        <section className="py-24 px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="max-w-4xl mx-auto relative overflow-hidden rounded-[32px] border border-[var(--emerald)]/25 bg-gradient-to-br from-[rgba(16,185,129,0.08)] via-[rgba(5,150,105,0.04)] to-transparent backdrop-blur-xl p-10 md:p-16 text-center"
          >
            <div className="absolute inset-0 -z-10 opacity-40">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[var(--emerald)]/20 blur-[120px]" />
            </div>
            <Sparkles className="h-10 w-10 text-[var(--emerald)] mx-auto mb-6" />
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--emerald)] mb-4">
              Dimanche 20:00
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-light leading-[1.15] mb-6">
              Le monde respire
              <br />
              <span className="gradient-text font-semibold">au même instant.</span>
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
              Chaque dimanche soir, la communauté VIDA se synchronise pour 9 minutes de respiration,
              gratitude et intention partagée. Tu n&apos;es jamais seul.
            </p>
            <button
              type="button"
              onClick={() => setBreathOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--emerald)]/40 bg-[var(--emerald)]/10 px-6 py-3 text-sm font-medium text-[var(--emerald)] hover:bg-[var(--emerald)]/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--emerald)]"
            >
              <Wind className="h-4 w-4" aria-hidden="true" />
              Respire avec moi — 57 secondes
            </button>
          </motion.div>
        </section>

        {/* PRICING TEASE */}
        <section className="py-24 px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="max-w-3xl mx-auto glass-card rounded-3xl p-10 md:p-14 text-center"
          >
            <Users className="h-10 w-10 text-[var(--emerald)] mx-auto mb-4" />
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light mb-3">
              Premium, <span className="text-[var(--emerald)]">9,90€ / mois</span>
            </h2>
            <p className="text-[var(--text-secondary)] mb-8">
              14 jours offerts · résiliable en 1 clic · 10% reversés à l&apos;association
            </p>
            <ul className="text-left grid sm:grid-cols-2 gap-3 max-w-xl mx-auto mb-10">
              {[
                'Fil de Vie illimité',
                'Missions rémunérées',
                'Rituels collectifs',
                'Communauté d\'amour',
                'IA VIDA chaleureuse',
                'Retrait wallet dès 5€',
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                >
                  <Check className="h-4 w-4 text-[var(--emerald)] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-8 py-4 text-base font-semibold text-white shadow-[0_8px_32px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 transition-all"
            >
              Voir les tarifs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </section>

        <FAQSection />

        {/* FINAL CTA */}
        <section className="py-24 px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-light leading-[1.05] mb-6">
              Ta première graine
              <br />
              <span className="gradient-text font-semibold">se plante aujourd&apos;hui.</span>
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-10 max-w-xl mx-auto">
              14 jours offerts. Sans carte. Sans engagement. Juste toi, et le monde qui
              t&apos;attend.
            </p>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-10 py-5 text-lg font-semibold text-white shadow-[0_12px_40px_rgba(16,185,129,0.4)] hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(16,185,129,0.55)] transition-all duration-300"
            >
              Commencer maintenant
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[var(--border)] py-12 px-4 text-center text-sm text-[var(--text-muted)]">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="h-4 w-4 text-[var(--emerald)]" />
            <span className="gradient-text font-[family-name:var(--font-display)] font-semibold">
              VIDA
            </span>
          </div>
          <p className="mb-6 italic max-w-md mx-auto">
            « Ce que tu fais change le monde. Même quand tu ne le vois pas. »
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs mb-6">
            <Link href="/mentions-legales" className="hover:text-[var(--text-secondary)]">
              Mentions légales
            </Link>
            <Link href="/cgv" className="hover:text-[var(--text-secondary)]">
              CGV
            </Link>
            <Link href="/cgu" className="hover:text-[var(--text-secondary)]">
              CGU
            </Link>
            <Link href="/politique-confidentialite" className="hover:text-[var(--text-secondary)]">
              Confidentialité
            </Link>
            <Link href="/cookies" className="hover:text-[var(--text-secondary)]">
              Cookies
            </Link>
            <Link href="/aide" className="hover:text-[var(--text-secondary)]">
              Aide
            </Link>
            <Link href="/contact" className="hover:text-[var(--text-secondary)]">
              Contact
            </Link>
            <Link href="/ecosystem" className="hover:text-[var(--text-secondary)]">
              Écosystème
            </Link>
          </div>
          <p className="text-[var(--text-muted)]">
            © 2026 SASU PURAMA · Frasne (25560) · art. 293B
          </p>
        </footer>
      </main>
    </>
  )
}
