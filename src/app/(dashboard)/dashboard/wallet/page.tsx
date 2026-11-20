'use client'

import { useEffect, useState } from 'react'
import { Wallet, ArrowUpRight, ArrowDownRight, CreditCard, Clock, TrendingUp } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'

interface WalletData {
  balance: number
  total_earned: number
}

interface Transaction {
  id: string
  amount: number
  type: string
  description: string | null
  created_at: string
}

export default function WalletPage() {
  const { user } = useAuth()
  return user ? <AccountWallet key={user.id} /> : <Skeleton className="h-8 w-48" />
}

function AccountWallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch('/api/wallet', { signal: controller.signal })
        if (!response.ok) throw new Error('Portefeuille indisponible')
        const result = await response.json()
        if (controller.signal.aborted) return
        setWallet({ balance: result.balance, total_earned: result.total_earned })
        setTransactions(result.transactions)
        setUnavailable(false)
      } catch {
        if (!controller.signal.aborted) setUnavailable(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  if (unavailable) {
    return <div role="status" className="p-6">Le relevé du portefeuille est indisponible.</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Wallet</h1>
        <p className="mt-1 text-[var(--text-secondary)]">Gere tes gains et fais des retraits</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--cyan)]/10">
              <Wallet className="h-6 w-6 text-[var(--cyan)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Solde disponible</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {(wallet?.balance ?? 0).toFixed(2)} EUR
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Total gagne</p>
              <p className="text-2xl font-bold text-emerald-400">
                {(wallet?.total_earned ?? 0).toFixed(2)} EUR
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6 flex flex-col items-center justify-center gap-2">
          <Button disabled icon={<CreditCard className="h-4 w-4" />}>
            Retrait bancaire indisponible
          </Button>
          <p className="text-center text-xs text-[var(--text-secondary)]">Les retraits seront disponibles en phase 2.</p>
        </Card>
      </div>

      {/* Historique */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Historique</h2>
        {transactions.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-12 w-12" />}
            title="Aucune transaction"
            description="Tes transactions apparaitront ici"
          />
        ) : (
          <div className="space-y-2">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] p-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.amount > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {t.amount > 0 ? <ArrowDownRight className="h-4 w-4 text-emerald-400" /> : <ArrowUpRight className="h-4 w-4 text-red-400" />}
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-primary)]">{t.description ?? t.type}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{formatDate(t.created_at)}</p>
                  </div>
                </div>
                <span className={`font-semibold ${t.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.amount > 0 ? '+' : ''}{t.amount.toFixed(2)} EUR
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
