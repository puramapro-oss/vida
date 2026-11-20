import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  const [wallet, transactions, withdrawals] = await Promise.all([
    db.from('wallets').select('balance,total_earned').eq('user_id', user.id).maybeSingle(),
    db.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    db.from('withdrawals').select('*').eq('user_id', user.id).order('requested_at', { ascending: false }),
  ])
  if (wallet.error || transactions.error || withdrawals.error) {
    return NextResponse.json({ error: 'Le relevé du portefeuille est indisponible.' }, { status: 503 })
  }

  return NextResponse.json({
    balance: Number(wallet.data?.balance ?? 0),
    total_earned: Number(wallet.data?.total_earned ?? 0),
    transactions: transactions.data,
    withdrawals: withdrawals.data,
  })
}

export async function POST() {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  // Phase 2 requires an atomic ledger and the payout provider.
  return NextResponse.json({ error: 'Les retraits bancaires sont indisponibles.' }, { status: 503 })
}
