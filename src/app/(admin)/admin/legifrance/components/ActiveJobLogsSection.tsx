import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JobDetailResponse } from '../types'

interface ActiveJobLogsSectionProps {
  activeJob: JobDetailResponse
}

export function ActiveJobLogsSection({ activeJob }: ActiveJobLogsSectionProps) {
  if (activeJob.job.status !== 'running') return null

  return (
    <section className="glass-card-static rounded-3xl p-6">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-medium mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-sky-400" /> Logs récents
      </h2>
      {activeJob.recentLogs.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">En attente des premiers logs...</p>
      ) : (
        <ul className="space-y-1 max-h-60 overflow-y-auto font-mono text-xs">
          {activeJob.recentLogs.map((log) => (
            <li
              key={log.id}
              className={cn(
                'px-3 py-1.5 rounded-lg border',
                log.level === 'error'
                  ? 'text-rose-300 border-rose-500/30 bg-rose-500/5'
                  : log.level === 'warn'
                    ? 'text-amber-300 border-amber-500/30 bg-amber-500/5'
                    : 'text-[var(--text-muted)] border-white/[0.06] bg-white/[0.02]',
              )}
            >
              <span className="text-[var(--text-muted)]">
                {new Date(log.created_at).toLocaleTimeString('fr-FR')}
              </span>{' '}
              · {log.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
