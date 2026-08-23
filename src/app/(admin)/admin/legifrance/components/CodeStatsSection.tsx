import { ScrollText } from 'lucide-react'
import type { CodeStat } from '../types'
import { formatDate } from '../utils'

interface CodeStatsSectionProps {
  codeStats: CodeStat[]
}

export function CodeStatsSection({ codeStats }: CodeStatsSectionProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {codeStats.map((stat) => (
        <div key={stat.code} className="glass-card rounded-2xl p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">{stat.nom}</p>
              <p className="impact-counter text-3xl">{stat.articles_count.toLocaleString('fr-FR')}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">articles en base</p>
            </div>
            <ScrollText className="h-4 w-4 text-[var(--emerald)]" />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Dernier sync: <span className="text-[var(--text-secondary)]">{formatDate(stat.last_synced_at)}</span>
          </p>
        </div>
      ))}
    </section>
  )
}
