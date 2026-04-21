import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Euro, TrendingUp, Heart, Users } from 'lucide-react'

async function getPools() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
      db: { schema: 'vida_sante' },
    },
  )

  const [pools, recentTx] = await Promise.all([
    supabase.from('pool_balances').select('*').order('pool_type'),
    supabase.from('pool_transactions').select('*').order('created_at', { ascending: false }).limit(20),
  ])

  return {
    pools: (pools.data ?? []) as { pool_type: string; balance: number; total_in: number; total_out: number }[],
    transactions: (recentTx.data ?? []) as { id: string; pool_type: string; amount: number; direction: string; reason: string; created_at: string }[],
  }
}

const POOL_META: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  reward: {
    label: 'Pool Récompenses Users',
    color: 'text-emerald-400',
    icon: <Users className="h-5 w-5 text-emerald-400" />,
    description: '50% des abonnements. Distribué quotidiennement entre les users actifs.',
  },
  asso: {
    label: 'Pool Association PURAMA',
    color: 'text-pink-400',
    icon: <Heart className="h-5 w-5 text-pink-400" />,
    description: '10% des abonnements. Virement mensuel vers l\'asso (mécénat IS -60%).',
  },
  partner: {
    label: 'Pool Partenaires',
    color: 'text-amber-400',
    icon: <TrendingUp className="h-5 w-5 text-amber-400" />,
    description: 'Dépôts sponsors + partenaires B2B. Commission 15% Purama.',
  },
}

export default async function FinancementPage() {
  const { pools, transactions } = await getPools()

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <Link href="/admin" className="rounded-lg bg-white/5 border border-white/10 p-2 hover:bg-white/10">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-light">
            Financement & Pools
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">Split 50/10/40 automatique via webhook Stripe.</p>
        </div>
      </header>

      {/* Pool cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pools.length === 0 ? (
          <div className="col-span-3 glass-card rounded-2xl p-8 text-center text-[var(--text-secondary)]">
            Aucun pool trouvé. Ils apparaissent après le premier paiement Stripe.
          </div>
        ) : pools.map(pool => {
          const meta = POOL_META[pool.pool_type] ?? { label: pool.pool_type, color: 'text-white', icon: <Euro className="h-5 w-5" />, description: '' }
          return (
            <div key={pool.pool_type} className="glass-card-static rounded-3xl p-6">
              <div className="flex items-start justify-between mb-4">
                {meta.icon}
                <span className={`text-xs uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
              </div>
              <p className={`impact-counter text-3xl font-bold ${meta.color} mb-1`}>
                {(pool.balance / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-3">{meta.description}</p>
              <div className="flex gap-3 text-xs text-[var(--text-muted)]">
                <span>+{(pool.total_in / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} entrées</span>
                <span>−{(pool.total_out / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} sorties</span>
              </div>
            </div>
          )
        })}
      </section>

      {/* SASU context */}
      <section className="glass-card rounded-2xl p-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-medium mb-3 flex items-center gap-2">
          <Euro className="h-4 w-4 text-[var(--emerald)]" /> Boucliers fiscaux actifs
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {[
            { label: 'ZFRR Frasne 25560', value: '0% IS — 5 ans', color: 'text-emerald-400' },
            { label: 'JEI R&D', value: 'Charges exonérées', color: 'text-lime-400' },
            { label: 'CIR', value: '30% dépenses R&D', color: 'text-sky-400' },
            { label: 'IP Box', value: '10% IS revenus algos', color: 'text-violet-400' },
            { label: 'Mécénat Asso', value: 'IS −60% max', color: 'text-pink-400' },
            { label: 'IS combiné', value: '0–3% à vie', color: 'text-amber-400' },
          ].map(b => (
            <div key={b.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
              <p className="text-[var(--text-muted)] text-xs mb-1">{b.label}</p>
              <p className={`font-semibold ${b.color}`}>{b.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent pool transactions */}
      <section className="glass-card-static rounded-3xl p-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-medium mb-4">
          Dernières transactions pools
        </h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">Aucune transaction. En attente du premier abonnement Stripe.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--text-muted)] border-b border-white/[0.06]">
                  <th className="pb-2 pr-4">Pool</th>
                  <th className="pb-2 pr-4">Raison</th>
                  <th className="pb-2 pr-4">Direction</th>
                  <th className="pb-2 pr-4">Montant</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {transactions.map(tx => (
                  <tr key={tx.id} className="text-[var(--text-secondary)]">
                    <td className="py-2 pr-4 font-medium text-[var(--text-primary)]">{tx.pool_type}</td>
                    <td className="py-2 pr-4">{tx.reason}</td>
                    <td className="py-2 pr-4">
                      <span className={tx.direction === 'in' ? 'text-emerald-400' : 'text-rose-400'}>
                        {tx.direction === 'in' ? '↑ entrée' : '↓ sortie'}
                      </span>
                    </td>
                    <td className="py-2 pr-4 font-mono">
                      {(tx.amount / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="py-2 text-xs text-[var(--text-muted)]">
                      {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
