'use client'

import { useEffect, useState } from 'react'
import { Globe, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function CartePage() {
  const [counts, setCounts] = useState<{ actions: number; users: number } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('impact_events').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ])
      .then(([a, u]) => setCounts({ actions: a.count ?? 0, users: u.count ?? 0 }))
      .catch(() => setCounts({ actions: 0, users: 0 }))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="vida-chip mb-3"><Globe className="h-3.5 w-3.5" /> Carte mondiale d'impact</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light mb-2">
          On cultive la Terre, partout.
        </h1>
        <p className="text-[var(--text-secondary)]">Chaque graine plantée, chaque action posée — une lumière de plus sur la carte du vivant.</p>
      </header>

      <section className="glass-card-static rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,var(--emerald)_0%,transparent_70%)]" />
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[var(--emerald)]/30 to-[var(--sage)]/10 flex items-center justify-center mx-auto mb-6 animate-breathe">
            <Globe className="h-12 w-12 text-[var(--emerald)]" />
          </div>

          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-8">
            <div>
              <p className="impact-counter text-4xl md:text-5xl">{counts?.actions ?? '—'}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">Actions posées</p>
            </div>
            <div>
              <p className="impact-counter text-4xl md:text-5xl">{counts?.users ?? '—'}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">Âmes vivantes</p>
            </div>
          </div>

          <p className="text-[var(--text-secondary)] max-w-lg mx-auto mb-2">
            La carte interactive arrive bientôt. Chaque point lumineux représentera une action réelle,
            géolocalisée avec ton consentement.
          </p>
          <p className="text-xs text-[var(--text-muted)] italic">
            « Là où je pose mon attention, l'amour grandit. »
          </p>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-[var(--emerald)] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">En attendant la carte…</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Chaque mission validée ajoutera automatiquement un point anonyme à la carte mondiale.
              Ton action compte, même invisible.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
