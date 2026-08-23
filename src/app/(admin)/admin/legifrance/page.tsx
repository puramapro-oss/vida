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
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { StatusResponse, JobDetailResponse } from './types'
import { CodeStatsSection } from './components/CodeStatsSection'
import { SyncControlSection } from './components/SyncControlSection'
import { ActiveJobLogsSection } from './components/ActiveJobLogsSection'
import { JobsHistorySection } from './components/JobsHistorySection'
import { InfoSection } from './components/InfoSection'

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

  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

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
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-light">Legifrance RAG</h1>
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

      {status && <CodeStatsSection codeStats={status.codeStats} />}

      {status && (
        <SyncControlSection
          runningJob={runningJob}
          codeStats={status.codeStats}
          selectedCodes={selectedCodes}
          skipEmbeddings={skipEmbeddings}
          maxPerCode={maxPerCode}
          launching={launching}
          onToggleCode={toggleCode}
          onSkipEmbeddingsChange={setSkipEmbeddings}
          onMaxPerCodeChange={setMaxPerCode}
          onLaunchSync={() => void launchSync()}
        />
      )}

      {activeJob && <ActiveJobLogsSection activeJob={activeJob} />}

      {status && <JobsHistorySection jobs={status.jobs} />}

      <InfoSection />
    </div>
  )
}
