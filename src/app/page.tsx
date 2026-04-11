'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, X, Zap, Sparkles, Code2, Globe, Brain, Video, Bot, Store, Workflow, Gamepad2, Menu } from 'lucide-react'

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled ? 'backdrop-blur-xl bg-[rgba(3,4,10,0.85)] border-b border-white/[0.06]' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="gradient-text font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
              VIDA
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm text-[var(--text-secondary)]">
            <a href="#univers" className="hover:text-[var(--text-primary)] transition-colors">Outils</a>
            <a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-[var(--text-primary)] transition-colors">FAQ</a>
            <a href="#api" className="hover:text-[var(--text-primary)] transition-colors">API</a>
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] px-4 py-2 text-sm font-medium text-white glow-pulse hover:opacity-90 transition-opacity"
              data-testid="nav-cta-signup"
            >
              Essai Gratuit →
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-[var(--text-secondary)] p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/[0.06] bg-[rgba(3,4,10,0.95)] backdrop-blur-xl"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              <a href="#univers" onClick={() => setMenuOpen(false)} className="text-sm text-[var(--text-secondary)] py-2">Outils</a>
              <a href="#pricing" onClick={() => setMenuOpen(false)} className="text-sm text-[var(--text-secondary)] py-2">Tarifs</a>
              <a href="#faq" onClick={() => setMenuOpen(false)} className="text-sm text-[var(--text-secondary)] py-2">FAQ</a>
              <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
                <Link href="/login" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-center text-[var(--text-secondary)]">
                  Connexion
                </Link>
                <Link href="/signup" className="rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] px-4 py-2.5 text-sm font-medium text-white text-center">
                  Essai Gratuit →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

// ─── Fade In Wrapper ──────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Section 2: Hero ──────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--cyan)]/20 bg-[var(--cyan)]/5 px-4 py-1.5 text-xs font-medium text-[var(--cyan)]"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--cyan)] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--cyan)]" />
        </span>
        🌌 Le premier ecosysteme IA tout-en-un au monde
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="gradient-text font-[family-name:var(--font-display)] text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl max-w-4xl"
      >
        Tous les outils IA.<br />Un seul abonnement.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)] leading-relaxed"
      >
        47 outils IA premium reunis en une seule plateforme. Cree, automatise, code et genere — sans jamais changer d&apos;app.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
      >
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] px-8 py-4 text-base font-semibold text-white glow-pulse hover:opacity-90 transition-opacity"
          data-testid="hero-cta-signup"
        >
          Commencer gratuitement →
        </Link>
        <a
          href="#pricing"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
        >
          Voir les tarifs <ChevronDown size={16} />
        </a>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6"
      >
        {[
          { value: '47+', label: 'Outils IA' },
          { value: 'Des 7€', label: 'par mois' },
          { value: '4', label: 'Univers' },
          { value: '100%', label: 'RGPD' },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-2xl px-6 py-4 text-center">
            <div className="gradient-text font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">{stat.value}</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-6 text-xs text-[var(--text-muted)]"
      >
        ✓ Sans carte bancaire &middot; ✓ 14 jours gratuits &middot; ✓ Resiliation en 1 clic
      </motion.p>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-[var(--text-muted)]"
        >
          <ChevronDown size={20} />
        </motion.div>
      </motion.div>
    </section>
  )
}

// ─── Section 3: Comparison ─────────────────────────────────────────────────────
function Comparison() {
  const competitors = [
    { name: 'ChatGPT+', price: '20€' },
    { name: 'Cursor', price: '20€' },
    { name: 'ElevenLabs', price: '22€' },
    { name: 'Midjourney', price: '10€' },
    { name: 'n8n Cloud', price: '20€' },
    { name: 'Runway', price: '15€' },
  ]

  return (
    <section className="relative z-10 py-24 px-4">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center mb-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl text-[var(--text-primary)]">
            Arrete de payer{' '}
            <span className="text-[var(--pink)] line-through">107€/mois</span>{' '}
            pour 6 apps separees
          </h2>
          <p className="mt-4 text-[var(--text-secondary)]">Tous ces outils sont inclus dans VIDA.</p>
        </FadeIn>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* VIDA */}
          <FadeIn delay={0.1}>
            <div className="glass rounded-3xl p-8 border border-[var(--gold)]/30 relative overflow-hidden">
              <div className="absolute top-4 right-4 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 px-3 py-1 text-xs font-semibold text-[var(--gold)]">
                VIDA
              </div>
              <div className="space-y-4">
                {[
                  '47 outils IA inclus',
                  'Des 7€/mois seulement',
                  '1 seul compte unifie',
                  'Marketplace agents IA',
                  'Collaboration temps reel',
                  'API pour developpeurs',
                  'Gamification XP',
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--green)]/20">
                      <Check size={12} className="text-[var(--green)]" />
                    </div>
                    <span className="text-[var(--text-primary)] text-sm">{feat}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <div className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--gold)]">7€</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">par mois</div>
              </div>
            </div>
          </FadeIn>

          {/* Les Autres */}
          <FadeIn delay={0.2}>
            <div className="glass rounded-3xl p-8 border border-white/[0.04] opacity-75">
              <div className="absolute top-4 right-4 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
                Les Autres
              </div>
              <div className="space-y-4">
                {[
                  '1 outil par application',
                  '107€/mois cumules',
                  '6 comptes differents',
                  '✗ Pas de Marketplace',
                  '✗ Pas de collaboration',
                  '✗ API souvent payante en plus',
                  '✗ Aucune gamification',
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10">
                      <X size={12} className="text-red-400" />
                    </div>
                    <span className="text-[var(--text-secondary)] text-sm">{feat}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <div className="font-[family-name:var(--font-display)] text-4xl font-bold text-red-400 line-through">107€</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">par mois</div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Breakdown list */}
        <FadeIn delay={0.3}>
          <div className="mt-12 glass rounded-2xl p-6">
            <div className="text-center mb-6 text-sm text-[var(--text-secondary)] font-medium">
              Ce que tu economies avec VIDA
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {competitors.map((c) => (
                <div key={c.name} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-2.5 border border-white/[0.04]">
                  <span className="text-sm text-[var(--text-secondary)]">{c.name}</span>
                  <span className="text-xs text-[var(--pink)] line-through">{c.price}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center text-sm font-medium text-[var(--text-secondary)]">
              Total :{' '}
              <span className="text-red-400 line-through">107€</span>{' '}
              →{' '}
              <span className="text-[var(--gold)] font-bold text-lg">7€</span>
              {' '}avec VIDA
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

// ─── Section 4: 4 Univers ─────────────────────────────────────────────────────
function Univers() {
  const univers = [
    {
      icon: '⚡',
      name: 'AUTOMATE',
      color: 'var(--cyan)',
      desc: 'Tes taches se font seules pendant que tu dors. Workflows, agents, automatisations sans code.',
      badge: null,
      cta: 'Explorer →',
    },
    {
      icon: '🎬',
      name: 'CREATE',
      color: 'var(--pink)',
      desc: 'Cree des images, videos, musique et voix en quelques secondes avec les meilleures IA generatives.',
      badge: null,
      cta: 'Explorer →',
    },
    {
      icon: '💻',
      name: 'BUILD',
      color: 'var(--green)',
      desc: 'Code et deploie des apps 10x plus vite. Multi-IA, debugging intelligent, deploy one-click.',
      badge: null,
      cta: 'Explorer →',
    },
    {
      icon: '🌌',
      name: 'COMPLET',
      color: 'var(--gold)',
      desc: 'Les 47 outils sans aucune limite. Acces total a tous les univers, modeles et fonctionnalites.',
      badge: 'TOUT INCLUS',
      cta: 'Tout avoir →',
    },
  ]

  return (
    <section id="univers" className="relative z-10 py-24 px-4">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center mb-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl text-[var(--text-primary)]">
            4 Univers, 47 outils
          </h2>
          <p className="mt-4 text-[var(--text-secondary)] max-w-xl mx-auto">
            Choisis le plan adapte a ton usage, ou prends tout.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {univers.map((u, i) => (
            <FadeIn key={u.name} delay={i * 0.1}>
              <div
                className="glass glass-hover rounded-3xl p-6 flex flex-col gap-4 h-full transition-all duration-300 group cursor-pointer"
                style={{ borderColor: `${u.color}20` }}
              >
                {u.badge && (
                  <span
                    className="self-start rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ background: `${u.color}15`, color: u.color, border: `1px solid ${u.color}30` }}
                  >
                    {u.badge}
                  </span>
                )}
                <div className="text-3xl">{u.icon}</div>
                <div>
                  <div
                    className="font-[family-name:var(--font-display)] text-lg font-bold tracking-wide mb-2"
                    style={{ color: u.color }}
                  >
                    {u.name}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{u.desc}</p>
                </div>
                <Link
                  href="/signup"
                  className="mt-auto text-sm font-medium transition-colors"
                  style={{ color: u.color }}
                >
                  {u.cta}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section 5: 6 Super-Pouvoirs ──────────────────────────────────────────────
function Superpowers() {
  const features = [
    {
      icon: <Brain size={20} />,
      name: 'Multi-IA Flash',
      color: 'var(--cyan)',
      desc: 'Parle a Claude, GPT-4o, Gemini, Mistral et 8 autres modeles dans le meme chat. Compare et choisis le meilleur.',
    },
    {
      icon: <Video size={20} />,
      name: 'Studio Creatif',
      color: 'var(--pink)',
      desc: 'Genere images (FLUX, DALL-E), videos (Runway), musique (Suno) et voix (ElevenLabs) en un seul endroit.',
    },
    {
      icon: <Bot size={20} />,
      name: 'Agents Autonomes',
      color: 'var(--purple)',
      desc: 'Cree des agents IA qui travaillent 24h/24 pour toi. Recherche, redaction, analyse, tout en automatique.',
    },
    {
      icon: <Store size={20} />,
      name: 'Marketplace',
      color: 'var(--gold)',
      desc: 'Vends tes propres agents IA et workflows sur le Marketplace VIDA. Monetise tes creations.',
    },
    {
      icon: <Workflow size={20} />,
      name: 'Automatisation Totale',
      color: 'var(--green)',
      desc: 'Connecte n8n, Make et Zapier. Tes workflows tournent sans toi. 1000+ integrations disponibles.',
    },
    {
      icon: <Gamepad2 size={20} />,
      name: 'Gamification',
      color: 'var(--orange)',
      desc: 'Gagne des XP a chaque action. Monte en niveau. Debloques des fonctionnalites exclusives et des recompenses.',
    },
  ]

  return (
    <section className="relative z-10 py-24 px-4">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center mb-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl text-[var(--text-primary)]">
            6 Super-Pouvoirs inclus
          </h2>
          <p className="mt-4 text-[var(--text-secondary)]">
            Pas un simple chatbot. Un ecosysteme complet.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FadeIn key={f.name} delay={i * 0.08}>
              <div className="glass glass-hover rounded-3xl p-6 h-full transition-all duration-300">
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ background: `${f.color}15`, color: f.color, border: `1px solid ${f.color}20` }}
                >
                  {f.icon}
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)] mb-2">
                  {f.name}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section 6: Demo ──────────────────────────────────────────────────────────
function Demo() {
  const [activeTab, setActiveTab] = useState<'chat' | 'studio' | 'agents'>('chat')

  return (
    <section className="relative z-10 py-24 px-4">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="text-center mb-12">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl text-[var(--text-primary)]">
            Vois VIDA en action
          </h2>
          <p className="mt-4 text-[var(--text-secondary)]">Une interface, trois puissances.</p>
        </FadeIn>

        <FadeIn delay={0.1}>
          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            {(['chat', 'studio', 'agents'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-5 py-2 text-sm font-medium transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] text-white'
                    : 'glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab === 'chat' ? '💬 Chat' : tab === 'studio' ? '🎬 Studio' : '🤖 Agents'}
              </button>
            ))}
          </div>

          {/* Mock browser */}
          <div className="glass rounded-3xl overflow-hidden border border-white/[0.08]">
            {/* Browser bar */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-5 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/50" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                <div className="h-3 w-3 rounded-full bg-green-500/50" />
              </div>
              <div className="mx-auto flex items-center gap-2 rounded-lg bg-white/[0.04] px-4 py-1.5 text-xs text-[var(--text-muted)]">
                <span>🔒</span>
                <span>vida.purama.dev/dashboard</span>
              </div>
            </div>

            {/* Content area */}
            <div className="min-h-[360px] p-6">
              {activeTab === 'chat' && (
                <div className="flex flex-col gap-4">
                  <div className="text-xs text-[var(--text-muted)] mb-2 text-center">Chat Multi-IA — Comparaison en temps reel</div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[var(--cyan)]/20 flex items-center justify-center text-xs text-[var(--cyan)]">T</div>
                    <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-[var(--text-secondary)] max-w-xs">
                      Analyse ce contrat en 3 points cles et identifie les risques.
                    </div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[var(--purple)]/20 flex items-center justify-center text-xs">🤖</div>
                    <div className="bg-[var(--purple)]/10 border border-[var(--purple)]/20 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-[var(--text-secondary)] max-w-sm">
                      <span className="text-[var(--purple)] text-xs font-medium block mb-1.5">Claude Sonnet 4</span>
                      Voici les 3 points cles : 1) Clause de resiliation abusive (art. 12)...
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex-1 glass rounded-xl px-4 py-2.5 text-xs text-[var(--text-muted)]">Pose une question...</div>
                    <button className="h-9 w-9 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] flex items-center justify-center">
                      <Zap size={14} className="text-white" />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'studio' && (
                <div className="flex flex-col gap-4">
                  <div className="text-xs text-[var(--text-muted)] mb-2 text-center">Studio Creatif — Image, Video, Musique, Voix</div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { label: 'Image', color: 'var(--pink)', emoji: '🖼️', model: 'FLUX Pro' },
                      { label: 'Video', color: 'var(--purple)', emoji: '🎬', model: 'Runway' },
                      { label: 'Musique', color: 'var(--gold)', emoji: '🎵', model: 'Suno' },
                      { label: 'Voix', color: 'var(--cyan)', emoji: '🎙️', model: 'ElevenLabs' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border p-4 flex flex-col items-center gap-2 text-center"
                        style={{ background: `${item.color}08`, borderColor: `${item.color}20` }}
                      >
                        <div className="text-2xl">{item.emoji}</div>
                        <div className="text-sm font-medium" style={{ color: item.color }}>{item.label}</div>
                        <div className="text-xs text-[var(--text-muted)]">{item.model}</div>
                      </div>
                    ))}
                  </div>
                  <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                    <Sparkles size={16} className="text-[var(--pink)]" />
                    <span className="text-sm text-[var(--text-muted)]">Un paysage cyberpunk sous la pluie, neon reflections...</span>
                    <button className="ml-auto rounded-lg bg-[var(--pink)]/20 border border-[var(--pink)]/30 px-3 py-1 text-xs text-[var(--pink)] font-medium">
                      Generer
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'agents' && (
                <div className="flex flex-col gap-4">
                  <div className="text-xs text-[var(--text-muted)] mb-2 text-center">Agents Autonomes — Travaillent 24h/24</div>
                  {[
                    { name: 'Agent Veille Concurrentielle', status: 'Actif', color: 'var(--green)', runs: '3 fois/jour' },
                    { name: 'Agent Newsletter IA', status: 'En cours', color: 'var(--cyan)', runs: 'Chaque lundi' },
                    { name: 'Agent Analyse Donnees', status: 'Pret', color: 'var(--gold)', runs: 'A la demande' },
                  ].map((agent) => (
                    <div key={agent.name} className="glass rounded-2xl px-4 py-3 flex items-center gap-4">
                      <div
                        className="h-2 w-2 rounded-full animate-pulse"
                        style={{ background: agent.color }}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[var(--text-primary)]">{agent.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">{agent.runs}</div>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: `${agent.color}15`, color: agent.color }}
                      >
                        {agent.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

// ─── Section 7: Pricing ───────────────────────────────────────────────────────
function Pricing() {
  const plans = [
    {
      name: 'Free',
      color: 'var(--text-muted)',
      price: '0€',
      desc: 'Pour decouvrir',
      features: ['10 questions/jour', 'Chat Multi-IA basique', 'Acces communaute'],
      cta: 'Commencer',
      highlight: false,
    },
    {
      name: 'AUTOMATE',
      color: 'var(--cyan)',
      price: 'Des 7€',
      desc: '/mois',
      features: ['Workflows automatises', 'Agents basiques', 'Integrations n8n/Make', '100+ requetes/jour'],
      cta: 'Choisir',
      highlight: false,
    },
    {
      name: 'CREATE',
      color: 'var(--pink)',
      price: 'Des 7€',
      desc: '/mois',
      features: ['Studio creatif complet', 'FLUX, DALL-E, Suno', 'ElevenLabs integre', '100+ generatrions/jour'],
      cta: 'Choisir',
      highlight: false,
    },
    {
      name: 'COMPLET',
      color: 'var(--gold)',
      price: 'Des 22€',
      desc: '/mois',
      features: ['47 outils sans limite', 'Tous les univers', 'Marketplace acces', 'API developpeurs'],
      cta: 'Tout prendre',
      highlight: true,
    },
  ]

  return (
    <section id="pricing" className="relative z-10 py-24 px-4">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center mb-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl text-[var(--text-primary)]">
            Tarifs simples et transparents
          </h2>
          <p className="mt-4 text-[var(--text-secondary)]">
            Commence gratuitement. Evolue selon tes besoins.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.1}>
              <div
                className={`glass rounded-3xl p-6 flex flex-col gap-5 h-full transition-all duration-300 ${
                  plan.highlight ? 'border-[var(--gold)]/40' : ''
                }`}
                style={plan.highlight ? { boxShadow: `0 0 40px ${plan.color}15` } : {}}
              >
                {plan.highlight && (
                  <div
                    className="self-start rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ background: `${plan.color}15`, color: plan.color, border: `1px solid ${plan.color}30` }}
                  >
                    POPULAIRE
                  </div>
                )}
                <div>
                  <div className="font-[family-name:var(--font-display)] text-sm font-bold tracking-widest uppercase" style={{ color: plan.color }}>
                    {plan.name}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
                      {plan.price}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{plan.desc}</span>
                  </div>
                </div>
                <ul className="flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center rounded-xl py-2.5 text-sm font-medium transition-all ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--orange)] text-black hover:opacity-90'
                      : 'border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.4}>
          <div className="mt-8 text-center">
            <Link href="/pricing" className="text-sm text-[var(--cyan)] hover:underline">
              Voir tous les tarifs et options details →
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

// ─── Section 8: Social Proof ──────────────────────────────────────────────────
function SocialProof() {
  return (
    <section className="relative z-10 py-24 px-4">
      <div className="mx-auto max-w-4xl">
        <FadeIn>
          <div className="glass rounded-3xl p-10 text-center border border-[var(--cyan)]/20">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 px-4 py-1.5 text-xs font-medium text-[var(--cyan)] mb-6">
              🚀 Lancement 2026
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)] mb-4">
              Rejoins les early adopters VIDA
            </h2>
            <p className="text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
              Sois parmi les premiers a decouvrir le futur de la creation et de l&apos;automatisation par IA. Acces prioritaire, prix fondateur, et ton avis compte.
            </p>
            <div className="grid grid-cols-3 gap-6 mb-8">
              {[
                { value: '47+', label: 'Outils integres', color: 'var(--cyan)' },
                { value: '100%', label: 'Conforme RGPD', color: 'var(--green)' },
                { value: '🇫🇷', label: 'Made in France', color: 'var(--gold)' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold font-[family-name:var(--font-display)]" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] px-8 py-3.5 text-sm font-semibold text-white glow-pulse hover:opacity-90 transition-opacity"
            >
              Rejoindre maintenant →
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

// ─── Section 9: FAQ ───────────────────────────────────────────────────────────
const faqs = [
  {
    q: "C'est quoi VIDA ?",
    a: "VIDA est un ecosysteme IA tout-en-un qui reunit 47+ outils dans une seule plateforme : chat multi-modeles, generation d'images et de videos, agents autonomes, automatisation de workflows, marketplace d'agents, et gamification. Tout ca pour un abonnement mensuel, sans changer d'app."
  },
  {
    q: "Combien ca coute ?",
    a: "Les plans specialises (AUTOMATE, CREATE, BUILD) commencent a 7€/mois. Le plan COMPLET qui donne acces aux 47 outils commence a 22€/mois. Il y a aussi un plan Gratuit avec 10 requetes par jour, sans carte bancaire requise."
  },
  {
    q: "Je peux annuler quand je veux ?",
    a: "Oui, la resiliation se fait en 1 clic depuis les Parametres de ton compte. Aucun engagement, aucuns frais caches. Tu restes sur ton plan jusqu'a la fin de la periode facturee."
  },
  {
    q: "Mes donnees sont-elles securisees ?",
    a: "100% conforme RGPD. Tes donnees sont hebergees en Europe, chiffrees en transit et au repos. Nous ne revendons jamais tes donnees. Tu peux exporter ou supprimer ton compte a tout moment depuis les Parametres."
  },
  {
    q: "C'est quoi la Marketplace ?",
    a: "La Marketplace VIDA est un store d'agents IA et de workflows crees par la communaute. Tu peux acheter des agents prets-a-l'emploi ou vendre tes propres creations et gagner de l'argent. Accessible en plan Pro et superieur."
  },
  {
    q: "Comment marche le mode hors-ligne ?",
    a: "Grace a l'integration de modeles locaux (WebLLM / Llama), certaines fonctionnalites basiques continuent de fonctionner sans connexion. Le mode hors-ligne est progressivement etendu aux nouvelles versions."
  },
  {
    q: "Je suis developpeur, il y a une API ?",
    a: "Oui ! Une API REST complete est disponible en plan Pro COMPLET et superieur. Tu peux integrer VIDA dans tes propres apps : chat, generation d'images, agents, et plus. Documentation disponible sur /api."
  },
  {
    q: "C'est quoi le systeme XP ?",
    a: "Un systeme de gamification integre. Tu gagnes des XP en utilisant l'app : messages envoyes, images generees, agents crees, fidelite quotidienne, parrainages, etc. Les XP font monter ton niveau et debloquent des fonctionnalites et recompenses exclusives."
  },
]

function FAQ() {
  return (
    <section id="faq" className="relative z-10 py-24 px-4">
      <div className="mx-auto max-w-3xl">
        <FadeIn className="text-center mb-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl text-[var(--text-primary)]">
            Questions frequentes
          </h2>
        </FadeIn>

        <div className="space-y-3">
          {faqs.map((item, i) => (
            <FadeIn key={i} delay={i * 0.04}>
              <details className="glass rounded-2xl overflow-hidden group">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-[var(--text-primary)] hover:text-[var(--cyan)] transition-colors list-none">
                  {item.q}
                  <ChevronDown size={16} className="text-[var(--text-muted)] transition-transform group-open:rotate-180 flex-shrink-0 ml-4" />
                </summary>
                <div className="px-6 pb-5 text-sm text-[var(--text-secondary)] leading-relaxed border-t border-white/[0.04] pt-4">
                  {item.a}
                </div>
              </details>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section 10: CTA Final ────────────────────────────────────────────────────
function CTAFinal() {
  return (
    <section className="relative z-10 py-32 px-4">
      <div className="mx-auto max-w-3xl text-center">
        <FadeIn>
          <h2 className="gradient-text font-[family-name:var(--font-display)] text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Pret a tout changer ?
          </h2>
          <p className="mt-6 text-xl text-[var(--text-secondary)]">
            47 outils IA. 1 abonnement. 0 limite.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--cyan)] via-[var(--purple)] to-[var(--pink)] px-10 py-5 text-lg font-bold text-white glow-pulse hover:opacity-90 transition-opacity"
              data-testid="footer-cta-signup"
            >
              Commencer gratuitement →
            </Link>
            <p className="text-xs text-[var(--text-muted)]">
              Pas de carte bancaire requise · 14 jours gratuits · Resiliation instantanee
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

// ─── Section 11: Footer ───────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] py-16 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="gradient-text font-[family-name:var(--font-display)] text-xl font-bold mb-3">
              VIDA
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Le premier ecosysteme IA tout-en-un. 47+ outils pour creer, automatiser et coder.
            </p>
          </div>

          {/* Produit */}
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">Produit</div>
            <ul className="space-y-2">
              {[
                { label: 'Outils', href: '#univers' },
                { label: 'Tarifs', href: '#pricing' },
                { label: 'Marketplace', href: '/signup' },
                { label: 'API', href: '#api' },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">Ressources</div>
            <ul className="space-y-2">
              {[
                { label: 'Documentation', href: '/aide' },
                { label: 'Status', href: '/status' },
                { label: 'Changelog', href: '/changelog' },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">Legal</div>
            <ul className="space-y-2">
              {[
                { label: 'Mentions legales', href: '/mentions-legales' },
                { label: 'CGU', href: '/cgu' },
                { label: 'CGV', href: '/cgv' },
                { label: 'Confidentialite', href: '/politique-confidentialite' },
                { label: 'Cookies', href: '/cookies' },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">Contact</div>
            <ul className="space-y-2">
              <li>
                <a href="mailto:matiss.frasne@gmail.com" className="text-xs text-[var(--text-secondary)] hover:text-[var(--cyan)] transition-colors break-all">
                  matiss.frasne@gmail.com
                </a>
              </li>
              <li>
                <span className="text-xs text-[var(--text-muted)]">Frasne, France 🇫🇷</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-white/[0.06] pt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-xs text-[var(--text-muted)]">
            © 2026 VIDA par SASU PURAMA — Frasne, France 🇫🇷
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Made with ❤️ in France · TVA non applicable, art. 293 B du CGI
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Comparison />
        <Univers />
        <Superpowers />
        <Demo />
        <Pricing />
        <SocialProof />
        <FAQ />
        <CTAFinal />
      </main>
      <Footer />
    </>
  )
}
