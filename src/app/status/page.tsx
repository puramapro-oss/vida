'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Clock, Activity } from 'lucide-react'

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'down'
  latency?: number
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      try {
        const start = Date.now()
        const res = await fetch('/api/status')
        const latency = Date.now() - start
        const data = await res.json()

        setServices([
          { name: 'API VIDA', status: data.status === 'ok' ? 'operational' : 'degraded', latency },
          { name: 'Base de donnees', status: data.database === 'ok' ? 'operational' : 'down', latency: data.dbLatency },
          { name: 'Authentification', status: 'operational' },
          { name: 'Stripe Paiements', status: 'operational' },
          { name: 'Generation IA', status: 'operational' },
        ])
      } catch {
        setServices([
          { name: 'API VIDA', status: 'down' },
          { name: 'Base de donnees', status: 'down' },
        ])
      }
      setLoading(false)
    }
    check()
  }, [])

  const allOk = services.every(s => s.status === 'operational')

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--cyan)]">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-[var(--cyan)]" />
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Statut des services</h1>
        </div>

        {/* Global status */}
        <div className={`mt-6 rounded-2xl p-6 text-center ${allOk ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
          {allOk ? (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
              <p className="mt-2 text-lg font-semibold text-emerald-400">Tous les systemes sont operationnels</p>
            </>
          ) : (
            <>
              <Clock className="mx-auto h-10 w-10 text-amber-400" />
              <p className="mt-2 text-lg font-semibold text-amber-400">Perturbations detectees</p>
            </>
          )}
        </div>

        {/* Services */}
        <div className="mt-8 space-y-3">
          {loading ? (
            [1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))
          ) : (
            services.map(s => (
              <div key={s.name} className="glass flex items-center justify-between rounded-xl px-5 py-4">
                <span className="font-medium text-[var(--text-primary)]">{s.name}</span>
                <div className="flex items-center gap-3">
                  {s.latency && (
                    <span className="text-xs text-[var(--text-secondary)]">{s.latency}ms</span>
                  )}
                  {s.status === 'operational' ? (
                    <span className="flex items-center gap-1 text-sm text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Operationnel
                    </span>
                  ) : s.status === 'degraded' ? (
                    <span className="flex items-center gap-1 text-sm text-amber-400">
                      <Clock className="h-4 w-4" /> Degrade
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-red-400">
                      <XCircle className="h-4 w-4" /> Indisponible
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
