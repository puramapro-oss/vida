import { Loader2, Zap, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Job, CodeStat } from '../types'
import { durationLabel } from '../utils'

interface SyncControlSectionProps {
  runningJob: Job | null
  codeStats: CodeStat[]
  selectedCodes: string[]
  skipEmbeddings: boolean
  maxPerCode: number
  launching: boolean
  onToggleCode: (code: string) => void
  onSkipEmbeddingsChange: (skip: boolean) => void
  onMaxPerCodeChange: (max: number) => void
  onLaunchSync: () => void
}

export function SyncControlSection({
  runningJob,
  codeStats,
  selectedCodes,
  skipEmbeddings,
  maxPerCode,
  launching,
  onToggleCode,
  onSkipEmbeddingsChange,
  onMaxPerCodeChange,
  onLaunchSync,
}: SyncControlSectionProps) {
  return (
    <section className="glass-card-static rounded-3xl p-6">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-medium mb-4 flex items-center gap-2">
        <Zap className="h-4 w-4 text-amber-400" /> Forcer un sync
      </h2>

      {runningJob ? (
        <div className="rounded-2xl bg-sky-500/10 border border-sky-500/30 p-4">
          <div className="flex items-center gap-2 text-sky-300 mb-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="font-medium text-sm">Sync en cours — attend la fin avant d&apos;en lancer un autre</p>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Déclenché par {runningJob.triggered_by} · {durationLabel(runningJob.started_at, null)} écoulées
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Codes à sync</p>
            <div className="flex flex-wrap gap-2">
              {codeStats.map((stat) => {
                const active = selectedCodes.includes(stat.code)
                return (
                  <button
                    key={stat.code}
                    type="button"
                    onClick={() => onToggleCode(stat.code)}
                    className={cn(
                      'rounded-xl px-3 py-1.5 text-sm border transition',
                      active
                        ? 'bg-[var(--emerald)]/10 border-[var(--emerald)]/40 text-[var(--emerald)]'
                        : 'bg-white/[0.02] border-white/10 text-[var(--text-secondary)] hover:bg-white/5',
                    )}
                  >
                    {stat.nom}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={skipEmbeddings}
                onChange={(e) => onSkipEmbeddingsChange(e.target.checked)}
                className="accent-[var(--emerald)]"
              />
              <span>
                Skip embeddings <span className="text-[var(--text-muted)]">(~3× plus rapide)</span>
              </span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <span className="text-[var(--text-muted)] shrink-0">Max par code:</span>
              <input
                type="number"
                min={1}
                max={50000}
                value={maxPerCode}
                onChange={(e) => onMaxPerCodeChange(Math.max(1, Math.min(50000, Number(e.target.value) || 200)))}
                className="w-24 rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-sm"
              />
            </label>
          </div>

          <button
            onClick={onLaunchSync}
            disabled={launching || selectedCodes.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--emerald)] text-black px-4 py-2 text-sm font-medium hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Lancer le sync
          </button>
        </div>
      )}
    </section>
  )
}
