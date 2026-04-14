'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Users, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Ritual {
  id: string
  theme: string
  title: string
  description: string | null
  emoji: string | null
  week_number: number
  year: number
  scheduled_at: string
  duration_minutes: number | null
  participants_count: number | null
  status: string
}

const DEFAULT_THEMES = [
  { theme: 'respiration', emoji: '🌬️', label: 'Respiration collective' },
  { theme: 'gratitude', emoji: '✨', label: 'Cercle de gratitude' },
  { theme: 'intention', emoji: '🎯', label: 'Intention partagée' },
  { theme: 'meditation', emoji: '🧘', label: 'Méditation guidée' },
  { theme: 'gratitude_silence', emoji: '🌙', label: 'Silence sacré' },
  { theme: 'celebration', emoji: '🌟', label: 'Célébration des victoires' },
]

export default function RituelsPage() {
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('weekly_rituals')
      .select('*')
      .order('scheduled_at', { ascending: true })
      .limit(12)
      .then(({ data }) => setRituals((data ?? []) as Ritual[]))
      .then(() => setLoading(false))
  }, [])

  const upcoming = rituals.filter(r => r.status === 'upcoming' || new Date(r.scheduled_at) > new Date())
  const nextRitual = upcoming[0]

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="vida-chip mb-3"><Calendar className="h-3.5 w-3.5" /> Rituels collectifs</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light mb-2">
          On respire ensemble, chaque dimanche.
        </h1>
        <p className="text-[var(--text-secondary)]">
          Un thème, 20 minutes, partout sur Terre. Tu t'y joins — et le monde s'élève.
        </p>
      </header>

      {/* Next ritual hero */}
      {nextRitual && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-static rounded-3xl p-8 md:p-10 relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-[var(--emerald)]/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">{nextRitual.emoji ?? '🌿'}</span>
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--emerald)]">Prochain rituel</span>
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-light mb-3">
              {nextRitual.title}
            </h2>
            {nextRitual.description && (
              <p className="text-[var(--text-secondary)] mb-5 max-w-2xl leading-relaxed">{nextRitual.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />
                {new Date(nextRitual.scheduled_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />
                {new Date(nextRitual.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {nextRitual.duration_minutes ?? 20} min
              </span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />
                {nextRitual.participants_count ?? 0} âmes inscrites
              </span>
            </div>
            <button
              data-testid="ritual-join"
              className="mt-6 rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all"
              onClick={() => alert('Bientôt : inscription + lien visio live pour rejoindre le rituel.')}
            >
              Je me joins au rituel
            </button>
          </div>
        </motion.section>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      )}

      {/* Empty → themes gallery */}
      {!loading && rituals.length === 0 && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-medium mb-4">Les thèmes qui reviendront</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DEFAULT_THEMES.map(t => (
              <div key={t.theme} className="glass-card rounded-2xl p-5">
                <div className="text-3xl mb-3">{t.emoji}</div>
                <p className="font-semibold text-[var(--text-primary)]">{t.label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-2">Cycle en préparation — dimanche à venir.</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Future rituals list */}
      {!loading && upcoming.length > 1 && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-medium mb-4">À venir</h2>
          <div className="space-y-2">
            {upcoming.slice(1).map(r => (
              <div key={r.id} className="glass-card rounded-2xl p-4 flex items-center gap-4">
                <span className="text-2xl">{r.emoji ?? '🌿'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{r.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(r.scheduled_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span className="text-xs text-[var(--text-muted)]">{r.participants_count ?? 0} 👥</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
