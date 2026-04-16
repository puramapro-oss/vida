'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Globe, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const ImpactMap = dynamic(() => import('@/components/shared/ImpactMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[460px] rounded-3xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-xs text-[var(--text-muted)]">
      La carte du vivant s'ouvre…
    </div>
  ),
})

export default function CartePage() {
  const [counts, setCounts] = useState<{ actions: number; users: number; countries: number } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('impact_events').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase
        .from('impact_events')
        .select('location_city')
        .not('location_city', 'is', null),
    ])
      .then(([a, u, c]) => {
        const uniqueCities = new Set((c.data ?? []).map((r: { location_city: string }) => r.location_city).filter(Boolean))
        setCounts({ actions: a.count ?? 0, users: u.count ?? 0, countries: uniqueCities.size })
      })
      .catch(() => setCounts({ actions: 0, users: 0, countries: 0 }))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="vida-chip mb-3"><Globe className="h-3.5 w-3.5" /> Carte mondiale d'impact</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light mb-2">
          On cultive la Terre, partout.
        </h1>
        <p className="text-[var(--text-secondary)]">
          Chaque point lumineux = une action réelle. La communauté VIDA en mouvement, en temps réel.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-2xl p-5 text-center">
          <p className="impact-counter text-2xl md:text-3xl">{counts?.actions ?? '—'}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Actions posées</p>
        </div>
        <div className="glass-card rounded-2xl p-5 text-center">
          <p className="impact-counter text-2xl md:text-3xl">{counts?.users ?? '—'}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Âmes vivantes</p>
        </div>
        <div className="glass-card rounded-2xl p-5 text-center">
          <p className="impact-counter text-2xl md:text-3xl">{counts?.countries ?? '—'}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Lieux touchés</p>
        </div>
      </section>

      <ImpactMap />

      <section className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-[var(--emerald)] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">Chaque action laisse une empreinte.</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Lorsque tu valides une mission géolocalisée — plantation, ramassage, soutien local — un point vert apparaît ici.
              Anonymisé, jamais pisté. Juste la preuve que la vie avance.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
