'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Leaf, Trees, Droplets, Trash2, Users, Activity, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface ThreadEntry {
  id: string
  action_type: string
  title: string
  description: string | null
  icon: string | null
  xp_earned: number | null
  points_earned: number | null
  created_at: string
}

interface Impact {
  total_co2_saved_kg: number
  total_waste_removed_g: number
  total_water_protected_l: number
  total_trees_funded: number
  total_people_helped: number
  total_missions_completed: number
  total_actions: number
  first_action_at: string | null
}

export default function UniversPage() {
  const [thread, setThread] = useState<ThreadEntry[]>([])
  const [impact, setImpact] = useState<Impact | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('life_thread_entries').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('user_impact').select('*').maybeSingle(),
    ])
      .then(([t, i]) => {
        setThread((t.data ?? []) as ThreadEntry[])
        setImpact(i.data as Impact | null)
      })
      .finally(() => setLoading(false))
  }, [])

  const STATS = [
    { icon: Leaf, label: 'CO₂ évité', value: impact?.total_co2_saved_kg ?? 0, unit: 'kg', color: 'text-emerald-400' },
    { icon: Trees, label: 'Arbres financés', value: impact?.total_trees_funded ?? 0, unit: '', color: 'text-lime-400' },
    { icon: Droplets, label: 'Eau protégée', value: impact?.total_water_protected_l ?? 0, unit: 'L', color: 'text-sky-400' },
    { icon: Trash2, label: 'Déchets retirés', value: (impact?.total_waste_removed_g ?? 0) / 1000, unit: 'kg', color: 'text-amber-400' },
    { icon: Users, label: 'Personnes aidées', value: impact?.total_people_helped ?? 0, unit: '', color: 'text-rose-400' },
    { icon: Activity, label: 'Actions totales', value: impact?.total_actions ?? 0, unit: '', color: 'text-violet-400' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <header>
        <div className="vida-chip mb-3"><Sparkles className="h-3.5 w-3.5" /> Mon Univers VIDA</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light mb-2">
          Ton empreinte vivante.
        </h1>
        <p className="text-[var(--text-secondary)]">Chaque action que tu poses laisse une trace. Voici la tienne.</p>
      </header>

      {/* Impact Profile */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {STATS.map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="impact-counter text-2xl md:text-3xl">
              {typeof s.value === 'number' ? s.value.toFixed(s.unit === 'kg' || s.unit === 'L' ? 1 : 0) : s.value}
              {s.unit && <span className="text-base ml-1 text-[var(--text-secondary)]">{s.unit}</span>}
            </p>
          </div>
        ))}
      </section>

      {/* Fil de Vie */}
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-medium mb-4">
          Mon Fil de Vie™
        </h2>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
        ) : thread.length === 0 ? (
          <div className="glass-card-static rounded-3xl p-10 text-center">
            <Sparkles className="h-10 w-10 text-[var(--emerald)] mx-auto mb-4" />
            <p className="text-[var(--text-primary)] font-medium mb-2">Ton histoire commence ici.</p>
            <p className="text-sm text-[var(--text-muted)]">
              Dès ta première action — mission, respiration, gratitude — une trace apparaîtra ici.
            </p>
          </div>
        ) : (
          <motion.ol
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
            className="relative border-l-2 border-[var(--emerald)]/20 ml-4 space-y-4"
          >
            {thread.map(e => (
              <motion.li
                key={e.id}
                variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}
                className="relative pl-6"
              >
                <span className="absolute -left-[9px] top-4 h-4 w-4 rounded-full bg-[var(--emerald)] shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                <div className="glass-card rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-[var(--text-primary)] text-sm">{e.title}</h3>
                    <time className="text-xs text-[var(--text-muted)] shrink-0">
                      {new Date(e.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </time>
                  </div>
                  {e.description && <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">{e.description}</p>}
                  <div className="flex items-center gap-3 text-xs">
                    {(e.xp_earned ?? 0) > 0 && <span className="text-[var(--emerald)]">+{e.xp_earned} XP</span>}
                    {(e.points_earned ?? 0) > 0 && <span className="text-[var(--sage)]">+{e.points_earned} graines</span>}
                  </div>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        )}
      </section>
    </div>
  )
}
