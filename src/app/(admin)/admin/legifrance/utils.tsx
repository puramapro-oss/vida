import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { JobStatus } from './types'

export const STATUS_BADGE: Record<JobStatus, { label: string; cls: string; icon: typeof Loader2 }> = {
  running: { label: 'En cours', cls: 'text-sky-300 bg-sky-500/10 border-sky-500/30', icon: Loader2 },
  success: { label: 'Succès', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 },
  partial: { label: 'Partiel', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30', icon: AlertCircle },
  failed: { label: 'Échec', cls: 'text-rose-300 bg-rose-500/10 border-rose-500/30', icon: AlertCircle },
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function durationLabel(startedAt: string, finishedAt: string | null): string {
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now()
  const s = Math.round((end - new Date(startedAt).getTime()) / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}min ${s % 60}s`
}
