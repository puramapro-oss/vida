'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Leaf, Heart, Users, Sparkles, Megaphone, Trophy, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Mission {
  id: string
  title: string
  description: string | null
  category: string
  type: string
  difficulty: string | null
  reward_points: number
  reward_money_cents: number
  reward_tickets: number
  impact_co2_kg: number | null
  impact_trees: number | null
  impact_people: number | null
  is_paid: boolean
  is_active: boolean
}

const CATEGORY_META: Record<string, { icon: typeof Leaf; label: string; color: string }> = {
  ecology:   { icon: Leaf,      label: 'Écologie',  color: 'text-emerald-400' },
  health:    { icon: Heart,     label: 'Santé',     color: 'text-rose-400' },
  human:     { icon: Users,     label: 'Humain',    color: 'text-sky-400' },
  community: { icon: Sparkles,  label: 'Communauté', color: 'text-violet-400' },
  pub_vida:  { icon: Megaphone, label: 'Partage',   color: 'text-amber-400' },
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('missions')
      .select('id, title, description, category, type, difficulty, reward_points, reward_money_cents, reward_tickets, impact_co2_kg, impact_trees, impact_people, is_paid, is_active')
      .eq('is_active', true)
      .order('reward_points', { ascending: false })
      .then(({ data, error }) => {
        if (error) { setError('Impossible de charger les missions.'); return }
        setMissions((data ?? []) as Mission[])
      })
      .then(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return missions
    if (filter === 'paid') return missions.filter(m => m.is_paid)
    return missions.filter(m => m.category === filter)
  }, [missions, filter])

  const FILTERS = [
    { id: 'all', label: 'Toutes' },
    { id: 'paid', label: 'Rémunérées' },
    { id: 'ecology', label: 'Écologie' },
    { id: 'health', label: 'Santé' },
    { id: 'community', label: 'Communauté' },
    { id: 'human', label: 'Humain' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="vida-chip mb-3">
          <Trophy className="h-3.5 w-3.5" /> {missions.length} missions vivantes
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light mb-2">
          Passe à l'action.
        </h1>
        <p className="text-[var(--text-secondary)]">Chaque mission compte. Pour toi, pour le vivant, pour ce qu'on construit.</p>
      </header>

      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-2">
        <Filter className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            data-testid={`filter-${f.id}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
              filter === f.id
                ? 'bg-[var(--emerald)] text-[#052e16]'
                : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-16 text-[var(--text-muted)] italic">L'espace de toutes les possibilités.</p>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {filtered.map(m => {
            const meta = CATEGORY_META[m.category] ?? CATEGORY_META.community
            return (
              <motion.article
                key={m.id}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                className="glass-card rounded-2xl p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <meta.icon className={`h-5 w-5 ${meta.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{meta.label}</span>
                      {m.is_paid && (
                        <span className="rounded-full bg-[var(--emerald)]/10 border border-[var(--emerald)]/30 px-2 py-0.5 text-[10px] font-semibold text-[var(--emerald)]">
                          rémunérée
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1 leading-tight">{m.title}</h3>
                    {m.description && <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">{m.description}</p>}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs">
                      {m.reward_points > 0 && (
                        <span className="text-[var(--sage)]"><Leaf className="inline h-3 w-3 mr-1" />{m.reward_points} pts</span>
                      )}
                      {m.reward_money_cents > 0 && (
                        <span className="text-[var(--emerald)] font-semibold">{(m.reward_money_cents / 100).toFixed(2)}€</span>
                      )}
                      {m.reward_tickets > 0 && (
                        <span className="text-amber-400">+{m.reward_tickets} ticket{m.reward_tickets > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  data-testid={`mission-start-${m.id}`}
                  className="w-full mt-4 rounded-xl border border-[var(--emerald)]/30 bg-[var(--emerald)]/10 px-4 py-2.5 text-sm font-semibold text-[var(--emerald)] hover:bg-[var(--emerald)]/20 transition-all"
                  onClick={() => alert('Bientôt : soumettre une preuve (photo/GPS) pour valider cette mission.')}
                >
                  Commencer la mission
                </button>
              </motion.article>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
