/**
 * C7 F9 — Admin UI monitoring Legifrance RAG dynamique.
 *
 * Affiche :
 *  - Stats par code (articles_count, last_synced_at) — les 3 codes ciblés
 *  - Liste des 10 derniers jobs (cron + admin manuel)
 *  - Bouton "Force sync" (codes sélectionnés + skipEmbeddings + maxArticlesPerCode)
 *  - Si job actif → polling auto 3s avec logs récents + durée
 *
 * Auth : layout admin gère déjà le guard super_admin, pas à refaire ici.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  ScrollText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  PlayCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type JobStatus = 'running' | 'success' | 'failed' | 'partial'

interface Job {
  id: string
  status: JobStatus
  triggered_by: string
  codes: string[]
  articles_synced: number | null
  articles_failed: number | null
  started_at: string
  finished_at: string | null
  error_message: string | null
  created_at: string
}

interface CodeStat {
  code: string
  nom: string
  articles_count: number
  last_synced_at: string | null
}

interface SyncLog {
  id: string
  job_id: string
  level: 'info' | 'warn' | 'error'
  message: string
  context: Record<string, unknown> | null
  created_at: string
}

interface StatusResponse {
  jobs: Job[]
  codeStats: CodeStat[]
  targetedCodes: string[]
}

interface JobDetailResponse {
  job: Job
  recentLogs: SyncLog[]
}

const STATUS_BADGE: Record<JobStatus, { label: string; cls: string; icon: typeof Loader2 }> = {
  running: { label: 'En cours', cls: 'text-sky-300 bg-sky-500/10 border-sky-500/30', icon: Loader2 },
  success: { label: 'Succès', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 },
  partial: { label: 'Partiel', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30', icon: AlertCircle },
  failed: { label: 'Échec', cls: 'text-rose-300 bg-rose-500/10 border-rose-500/30', icon: AlertCircle },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function durationLabel(startedAt: string, finishedAt: string | null): string {
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now()
  const s = Math.round((end - new Date(startedAt).getTime()) / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}min ${s % 60}s`
}

export default function AdminLegifrancePage() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [activeJob, setActiveJob] = useState<JobDetailResponse | null>(null)
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [skipEmbeddings, setSkipEmbeddings] = useState(true)
  const [maxPerCode, setMaxPerCode] = useState<number>(200)
  const [loading, setLoading] = useState(true)
  const [launching, setLaunching] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sync-legifrance', { cache: 'no-store' })
      if (!res.ok) {
        toast.error('Impossible de charger le statut Legifrance')
        return
      }
      const data = (await res.json()) as StatusResponse
      setStatus(data)
      if (selectedCodes.length === 0 && data.targetedCodes.length > 0) {
        setSelectedCodes(data.targetedCodes)
      }
    } catch {
      toast.error('Erreur réseau — réessaie dans un instant')
    } finally {
      setLoading(false)
    }
  }, [selectedCodes.length])

  const fetchActiveJob = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/admin/sync-legifrance?jobId=${jobId}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as JobDetailResponse
      setActiveJob(data)
    } catch {
      // silent — polling
    }
  }, [])

  // Initial load
  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

  // Poll running job every 3s
  useEffect(() => {
    const runningJob = status?.jobs.find((j) => j.status === 'running')
    if (!runningJob) {
      setActiveJob(null)
      return
    }
    void fetchActiveJob(runningJob.id)
    const interval = setInterval(() => {
      void fetchActiveJob(runningJob.id)
      void fetchStatus()
    }, 3000)
    return () => clearInterval(interval)
  }, [status?.jobs, fetchActiveJob, fetchStatus])

  const launchSync = async () => {
    if (selectedCodes.length === 0) {
      toast.error('Sélectionne au moins un code')
      return
    }
    setLaunching(true)
    try {
      const res = await fetch('/api/admin/sync-legifrance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codes: selectedCodes,
          skipEmbeddings,
          maxArticlesPerCode: maxPerCode,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; jobId?: string; estimated_duration_s?: number }
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Sync refusé')
        return
      }
      toast.success(`Sync lancé — ${data.estimated_duration_s ?? '?'}s estimé`)
      void fetchStatus()
    } catch {
      toast.error('Erreur réseau — réessaie dans un instant')
    } finally {
      setLaunching(false)
    }
  }

  const toggleCode = (code: string) => {
    setSelectedCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Chargement du cockpit Legifrance...</p>
        </div>
      </div>
    )
  }

  const runningJob = status?.jobs.find((j) => j.status === 'running') ?? null

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--emerald)] mb-2"
          >
            <ArrowLeft className="h-3 w-3" /> Cockpit
          </Link>
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light">
            Legifrance RAG
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Base légale dynamique — Code du travail, sécurité sociale, action sociale.
          </p>
        </div>
        <button
          onClick={() => void fetchStatus()}
          className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm hover:bg-white/10 transition"
        >
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      </header>

      {/* Stats 3 codes */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {status?.codeStats.map((stat) => (
          <div key={stat.code} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  {stat.nom}
                </p>
                <p className="impact-counter text-3xl">
                  {stat.articles_count.toLocaleString('fr-FR')}
                </p>
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

      {/* Force sync */}
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
                {status?.codeStats.map((stat) => {
                  const active = selectedCodes.includes(stat.code)
                  return (
                    <button
                      key={stat.code}
                      type="button"
                      onClick={() => toggleCode(stat.code)}
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
                  onChange={(e) => setSkipEmbeddings(e.target.checked)}
                  className="accent-[var(--emerald)]"
                />
                <span>Skip embeddings <span className="text-[var(--text-muted)]">(~3× plus rapide)</span></span>
              </label>

              <label className="flex items-center gap-2 text-sm">
                <span className="text-[var(--text-muted)] shrink-0">Max par code:</span>
                <input
                  type="number"
                  min={1}
                  max={50000}
                  value={maxPerCode}
                  onChange={(e) => setMaxPerCode(Math.max(1, Math.min(50000, Number(e.target.value) || 200)))}
                  className="w-24 rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-sm"
                />
              </label>
            </div>

            <button
              onClick={() => void launchSync()}
              disabled={launching || selectedCodes.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--emerald)] text-black px-4 py-2 text-sm font-medium hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              Lancer le sync
            </button>
          </div>
        )}
      </section>

      {/* Active job logs */}
      {activeJob && activeJob.job.status === 'running' && (
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
      )}

      {/* Jobs history */}
      <section className="glass-card-static rounded-3xl p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-medium mb-4 flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-[var(--emerald)]" /> Jobs récents
        </h2>
        {!status?.jobs.length ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">
            Aucun sync encore lancé. Le premier CRON hebdo s&apos;exécute dimanche 3h UTC.
          </p>
        ) : (
          <div className="space-y-2">
            {status.jobs.map((job) => {
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
                      <span className="text-xs text-[var(--text-muted)]">
                        {job.triggered_by}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {formatDate(job.started_at)} · {durationLabel(job.started_at, job.finished_at)}
                    </p>
                    {job.error_message && (
                      <p className="text-xs text-rose-300 mt-1 truncate">{job.error_message}</p>
                    )}
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

      {/* Info */}
      <section className="glass-card rounded-2xl p-5 text-sm text-[var(--text-secondary)] space-y-2">
        <p className="flex items-start gap-2">
          <span className="text-[var(--emerald)] shrink-0">◆</span>
          <span>
            CRON hebdomadaire — dimanche 3h UTC — sync les 3 codes en ordre. Idempotent, reprise possible.
          </span>
        </p>
        <p className="flex items-start gap-2">
          <span className="text-amber-400 shrink-0">◆</span>
          <span>
            Cache 5 tiers : Upstash 30j → Postgres FTS français → Pinecone semantic → PISTE live → static bundled.
          </span>
        </p>
        <p className="flex items-start gap-2">
          <span className="text-sky-400 shrink-0">◆</span>
          <span>
            Kill switch : <code className="bg-white/5 px-1.5 py-0.5 rounded">LEGIFRANCE_DYNAMIC=false</code> force le
            fallback LAW_CONTEXT (12 articles) dans /api/chat.
          </span>
        </p>
      </section>
    </div>
  )
}
