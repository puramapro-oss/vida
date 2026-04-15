import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import AbonnementClient from './AbonnementClient'

export default async function AbonnementPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/settings/abonnement')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_period, subscription_status, subscription_started_at, trial_ends_at, subscription_canceled_at, stripe_subscription_id')
    .eq('id', user.id)
    .single()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, plan, period, amount_cents, current_period_end, canceled_at')
    .eq('status', 'trialing')
    .or(`status.eq.active,status.eq.past_due`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: engagement } = await supabase
    .from('engagement_modes')
    .select('mode, multiplicateur, fin')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle()

  return (
    <AbonnementClient
      profile={profile}
      subscription={sub}
      engagement={engagement}
    />
  )
}
