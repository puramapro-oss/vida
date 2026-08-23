import { createServiceClient } from './supabase'

export async function updateProfileByCustomer(customerId: string, data: Record<string, unknown>) {
  const db = createServiceClient()
  await db.from('profiles').update(data).eq('stripe_customer_id', customerId)
}

export async function updateProfileById(userId: string, data: Record<string, unknown>) {
  const db = createServiceClient()
  await db.from('profiles').update(data).eq('id', userId)
}

export async function distributeToPool(
  poolType: 'reward' | 'asso',
  amountCents: number,
  reason: string,
  referenceId: string
) {
  const db = createServiceClient()
  const { data: pool } = await db
    .from('pool_balances')
    .select('balance_cents, total_in_cents')
    .eq('pool_type', poolType)
    .single()

  const newBalance = (pool?.balance_cents ?? 0) + amountCents
  const newTotalIn = (pool?.total_in_cents ?? 0) + amountCents

  await db
    .from('pool_balances')
    .update({ balance_cents: newBalance, total_in_cents: newTotalIn, updated_at: new Date().toISOString() })
    .eq('pool_type', poolType)

  await db.from('pool_transactions').insert({
    pool_type: poolType,
    amount_cents: amountCents,
    direction: 'in',
    reason,
    reference_id: referenceId,
  })
}
