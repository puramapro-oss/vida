import { ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Job } from '../types'
import { STATUS_BADGE, formatDate, durationLabel } from '../utils'

interface JobsHistorySectionProps {
  jobs: Job[]
}

export function JobsHistorySection({ jobs }: JobsHistorySectionProps) {
  return (
    <section className="glass-card-static rounded-3xl p-6">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-medium mb-4 flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-[var(--emerald)]" /> Jobs récents
      </h2>
      {!jobs.length ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-6">
          Aucun sync encore lancé. Le premier CRON hebdo s&apos;exécute dimanche 3h UTC.
        </p>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => {
            const badge = STATUS_BADGE[job.status]
            const Icon = badge.icon
            return (
              <div
                key={job.id}
                className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 flex items-start justify-between gap-3 flex-wrap"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border', badge.cls)}>
                      <Icon className={cn('h-3 w-3', job.status === 'running' && 'animate-spin')} />
                      {badge.label}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{job.triggered_by}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatDate(job.started_at)} · {durationLabel(job.started_at, job.finished_at)}
                  </p>
                  {job.error_message && <p className="text-xs text-rose-300 mt-1 truncate">{job.error_message}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {(job.articles_synced ?? 0).toLocaleString('fr-FR')}
                    {(job.articles_failed ?? 0) > 0 && (
                      <span className="text-rose-300 text-xs"> (-{job.articles_failed})</span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">articles</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
