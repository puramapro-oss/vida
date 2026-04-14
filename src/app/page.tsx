'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Leaf, Heart, Sparkles, ArrowRight, Menu, X, Globe, Users, Check } from 'lucide-react'

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-[100] transition-all duration-300 ${
        scrolled ? 'backdrop-blur-xl bg-[rgba(3,8,6,0.85)] border-b border-[var(--border)]' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-[var(--emerald)]" />
            <span className="gradient-text font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">VIDA</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-[var(--text-secondary)]">
            <a href="#manifeste" className="hover:text-[var(--text-primary)] transition-colors">Manifeste</a>
            <a href="#piliers" className="hover:text-[var(--text-primary)] transition-colors">Piliers</a>
            <Link href="/pricing" className="hover:text-[var(--text-primary)] transition-colors">Tarifs</Link>
            <Link href="/aide" className="hover:text-[var(--text-primary)] transition-colors">Aide</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
            >
              Commencer
            </Link>
          </div>

          <button
            className="md:hidden text-[var(--text-secondary)] p-2"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-[rgba(3,8,6,0.95)] backdrop-blur-xl">
          <div className="px-4 py-4 flex flex-col gap-3">
            <a href="#manifeste" onClick={() => setOpen(false)} className="text-sm text-[var(--text-secondary)] py-2">Manifeste</a>
            <a href="#piliers" onClick={() => setOpen(false)} className="text-sm text-[var(--text-secondary)] py-2">Piliers</a>
            <Link href="/pricing" onClick={() => setOpen(false)} className="text-sm text-[var(--text-secondary)] py-2">Tarifs</Link>
            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
              <Link href="/login" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-center text-[var(--text-secondary)]">
                Connexion
              </Link>
              <Link href="/signup" className="rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-4 py-2.5 text-sm font-semibold text-white text-center">
                Commencer
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const } },
}

export default function LandingPage() {
  return (
    <>
      <div className="vida-nature-bg" />
      <div className="aurora" />

      <Nav />

      <main className="relative">
        {/* HERO */}
        <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="vida-chip mb-8 mx-auto inline-flex">
              <span className="vida-pulse-dot" />
              Un mouvement vivant
            </div>

            <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-6xl md:text-7xl font-light tracking-tight leading-[1.05] mb-6">
              <span className="text-[var(--text-primary)]">Chaque action,</span>
              <br />
              <span className="gradient-text font-semibold">un impact réel.</span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
              VIDA transforme tes gestes quotidiens — marcher, donner, partager, planter — en trace vivante pour le monde.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="group w-full sm:w-auto rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-8 py-4 text-base font-semibold text-white shadow-[0_8px_32px_rgba(16,185,129,0.35)] hover:shadow-[0_12px_40px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Commencer — 14 jours offerts
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/how-it-works"
                className="w-full sm:w-auto rounded-2xl border border-[var(--border)] bg-white/5 backdrop-blur-xl px-8 py-4 text-base text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
              >
                Comment ça marche
              </Link>
            </div>

            <p className="text-xs text-[var(--text-muted)] mt-6">Sans carte bancaire · Résiliable en 1 clic · 10% reversés à l'association</p>
          </motion.div>
        </section>

        {/* MANIFESTE */}
        <section id="manifeste" className="py-24 px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            className="max-w-3xl mx-auto text-center"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--emerald)] mb-4">Manifeste</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light leading-relaxed mb-6">
              On ne veut plus d'une appli qui mesure.
              <br />
              <span className="text-[var(--emerald)]">On veut une appli qui transforme.</span>
            </h2>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Chaque pas que tu fais, chaque don que tu donnes, chaque souffle que tu poses —
              c'est une graine. VIDA te rend cette graine visible, et la relie à celles des autres.
            </p>
          </motion.div>
        </section>

        {/* PILIERS */}
        <section id="piliers" className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center mb-16"
            >
              <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-light mb-4">
                Trois piliers. <span className="text-[var(--emerald)]">Un chemin.</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Heart,
                  title: 'Ton Fil de Vie',
                  desc: 'Chaque action devient une page de ton histoire vivante. Retrace ton chemin, revis tes victoires.',
                },
                {
                  icon: Globe,
                  title: 'Impact mondial',
                  desc: 'Ta graine rejoint celles de milliers d\'autres sur une carte vivante. Tu vois le monde changer.',
                },
                {
                  icon: Sparkles,
                  title: 'Rituels collectifs',
                  desc: 'Chaque dimanche, un rituel mondial. Respirer, remercier, poser une intention — ensemble.',
                },
              ].map((p, i) => (
                <motion.div
                  key={p.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-8 rounded-3xl hover:bg-[var(--bg-card-hover)] transition-all"
                >
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--emerald)]/20 to-[var(--sage)]/10 flex items-center justify-center mb-6">
                    <p.icon className="h-6 w-6 text-[var(--emerald)]" />
                  </div>
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-medium mb-3">{p.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{p.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
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
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light mb-4">
              Premium, <span className="text-[var(--emerald)]">9,90€ / mois</span>
            </h2>
            <p className="text-[var(--text-secondary)] mb-8">14 jours offerts · résiliable en 1 clic · 10% reversés à l'association</p>
            <ul className="text-left grid sm:grid-cols-2 gap-3 max-w-xl mx-auto mb-10">
              {[
                'Fil de Vie illimité',
                'Missions rémunérées',
                'Rituels collectifs',
                'Communauté d\'amour',
                'IA VIDA chaleureuse',
                'Retrait wallet dès 5€',
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
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

        {/* FOOTER */}
        <footer className="border-t border-[var(--border)] py-10 px-4 text-center text-sm text-[var(--text-muted)]">
          <p className="mb-4 italic">« Ce que tu fais change le monde. Même quand tu ne le vois pas. »</p>
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <Link href="/mentions-legales" className="hover:text-[var(--text-secondary)]">Mentions légales</Link>
            <Link href="/cgv" className="hover:text-[var(--text-secondary)]">CGV</Link>
            <Link href="/cgu" className="hover:text-[var(--text-secondary)]">CGU</Link>
            <Link href="/politique-confidentialite" className="hover:text-[var(--text-secondary)]">Confidentialité</Link>
            <Link href="/aide" className="hover:text-[var(--text-secondary)]">Aide</Link>
            <Link href="/contact" className="hover:text-[var(--text-secondary)]">Contact</Link>
          </div>
          <p className="mt-6 text-[var(--text-muted)]">© 2026 SASU PURAMA · Frasne (25560) · art. 293B</p>
        </footer>
      </main>
    </>
  )
}
