export type JobStatus = 'running' | 'success' | 'failed' | 'partial'

export interface Job {
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

export interface CodeStat {
  code: string
  nom: string
  articles_count: number
  last_synced_at: string | null
}

export interface SyncLog {
  id: string
  job_id: string
  level: 'info' | 'warn' | 'error'
  message: string
  context: Record<string, unknown> | null
  created_at: string
}

export interface StatusResponse {
  jobs: Job[]
  codeStats: CodeStat[]
  targetedCodes: string[]
}

export interface JobDetailResponse {
  job: Job
  recentLogs: SyncLog[]
}
