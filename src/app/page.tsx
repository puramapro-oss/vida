'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
const CinematicIntro = dynamic(() => import('@/components/shared/CinematicIntro'), { ssr: false })
import {
  Leaf,
  Heart,
  Sparkles,
  ArrowRight,
  Menu,
  X,
  Globe,
  Users,
  Check,
  Footprints,
  HandHeart,
  Wind,
  BookHeart,
  MapPin,
  Trophy,
  Shield,
  Zap,
} from 'lucide-react'

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
        scrolled
          ? 'backdrop-blur-xl bg-[rgba(3,8,6,0.85)] border-b border-[var(--border)]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-[var(--emerald)]" />
            <span className="gradient-text font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
              VIDA
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-[var(--text-secondary)]">
            <a href="#manifeste" className="hover:text-[var(--text-primary)] transition-colors">
              Manifeste
            </a>
            <a href="#piliers" className="hover:text-[var(--text-primary)] transition-colors">
              Piliers
            </a>
            <a href="#comment" className="hover:text-[var(--text-primary)] transition-colors">
              Comment
            </a>
            <Link href="/pricing" className="hover:text-[var(--text-primary)] transition-colors">
              Tarifs
            </Link>
            <Link href="/aide" className="hover:text-[var(--text-primary)] transition-colors">
              Aide
            </Link>
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
            <a
              href="#manifeste"
              onClick={() => setOpen(false)}
              className="text-sm text-[var(--text-secondary)] py-2"
            >
              Manifeste
            </a>
            <a
              href="#piliers"
              onClick={() => setOpen(false)}
              className="text-sm text-[var(--text-secondary)] py-2"
            >
              Piliers
            </a>
            <a
              href="#comment"
              onClick={() => setOpen(false)}
              className="text-sm text-[var(--text-secondary)] py-2"
            >
              Comment ça marche
            </a>
            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className="text-sm text-[var(--text-secondary)] py-2"
            >
              Tarifs
            </Link>
            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
              <Link
                href="/login"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-center text-[var(--text-secondary)]"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-4 py-2.5 text-sm font-semibold text-white text-center"
              >
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
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const },
  },
}

const PILIERS = [
  {
    icon: BookHeart,
    title: 'Ton Fil de Vie',
    desc: 'Chaque geste, chaque souffle, chaque don devient une page vivante. Ton histoire s\'écrit — tu la relis quand tu veux.',
  },
  {
    icon: Globe,
    title: 'Carte vivante',
    desc: 'Ta graine rejoint celles des autres sur une carte mondiale. Tu vois, en temps réel, les liens que tu tisses.',
  },
  {
    icon: Sparkles,
    title: 'Rituels collectifs',
    desc: 'Chaque dimanche soir, un rituel mondial. Respirer, remercier, poser une intention — ensemble, au même instant.',
  },
]

const ACTIONS = [
  { icon: Footprints, title: 'Marcher', desc: '10 000 pas = 1 graine plantée, validée par HealthKit ou Health Connect.' },
  { icon: HandHeart, title: 'Donner', desc: 'Don de sang, bénévolat, mission écologique — preuve en photo GPS.' },
  { icon: Wind, title: 'Respirer', desc: 'Cycle 4-7-8 guidé. 3 minutes par jour, streak quotidien, récompenses.' },
  { icon: Heart, title: 'Remercier', desc: 'Journal de gratitude. 3 lignes par soir — tu verras la courbe monter.' },
  { icon: MapPin, title: 'Partager', desc: 'Ta mission devient visible sur la carte. D\'autres viennent t\'épauler.' },
  { icon: Trophy, title: 'Célébrer', desc: 'Paliers, confettis, cartes partageables. Tes victoires sont réelles.' },
]

const COMMENT = [
  { num: '01', title: 'Tu t\'inscris', desc: '14 jours offerts. Sans carte. Onboarding 10 secondes, chaleureux, sans jugement.' },
  { num: '02', title: 'Tu vis', desc: 'Tu marches, tu donnes, tu respires. VIDA transforme chaque geste en trace.' },
  { num: '03', title: 'Tu vois', desc: 'Ton Fil de Vie se remplit. La carte s\'éclaire. Le dimanche, le monde respire avec toi.' },
]

const FAQ = [
  {
    q: 'VIDA, c\'est quoi au juste ?',
    a: 'Une appli qui transforme tes actions réelles — marcher, donner, respirer, planter — en un Fil de Vie visible, partageable, relié à une communauté mondiale qui agit avec toi.',
  },
  {
    q: 'Ça remplace une appli santé ?',
    a: 'Non. VIDA lit tes données HealthKit / Health Connect et leur donne un sens. Tes pas deviennent des graines. Ton sommeil devient une respiration du monde.',
  },
  {
    q: 'Pourquoi payer ?',
    a: 'La version gratuite donne l\'essentiel. Premium débloque missions rémunérées, Fil de Vie illimité, rituels privés, wallet retirable dès 5€. 10% du chiffre va à l\'association.',
  },
  {
    q: 'Mes données sont-elles protégées ?',
    a: 'Oui. Hébergement européen, RLS sur chaque table, zéro revente, export et suppression en un clic. RGPD strict.',
  },
]

export default function LandingPage() {
  return (
    <>
      <CinematicIntro />
      <div className="vida-nature-bg" />
      <div className="aurora" />

      <Nav />

      <main className="relative">
        {/* HERO */}
        <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
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
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--emerald)] mb-4">
                Les trois piliers
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-light leading-[1.15]">
                Trois piliers. <span className="text-[var(--emerald)]">Un chemin.</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {PILIERS.map((p, i) => (
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
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-medium mb-3">
                    {p.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{p.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ACTIONS GRID */}
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

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {ACTIONS.map((a, i) => (
                <motion.div
                  key={a.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  transition={{ delay: (i % 3) * 0.08 }}
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
            </div>
          </div>
        </section>

        {/* COMMENT ÇA MARCHE */}
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

            <div className="grid md:grid-cols-3 gap-6">
              {COMMENT.map((s, i) => (
                <motion.div
                  key={s.num}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  transition={{ delay: i * 0.12 }}
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
            </div>
          </div>
        </section>

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
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              Chaque dimanche soir, la communauté VIDA se synchronise pour 9 minutes de respiration,
              gratitude et intention partagée. Tu n&apos;es jamais seul.
            </p>
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

        {/* FAQ */}
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
