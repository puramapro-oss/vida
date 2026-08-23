import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MaMemoirePage, type LegalAcceptanceRow } from '@/lib/legal'
import { APP_NAME } from '@/lib/constants'

export const metadata = {
  title: 'Ma mémoire — VIDA',
  robots: { index: false, follow: false },
}

/**
 * Route self-service RGPD (NIYAMA-BRIEF.md §1) — exporter/consulter/supprimer ses données.
 * Corrige CONFORMITE.md Gaps #3-#6 : socle légal existait mais n'était monté nulle part,
 * export RGPD était un faux `toast.success()`, suppression de compte ouvrait un `mailto:`.
 */
export default async function MaMemoirePageRoute() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/ma-memoire')

  const [{ data: acceptancesRaw }, { data: deletionRequest }] = await Promise.all([
    supabase
      .from('legal_acceptances')
      .select('doc_type, version, accepted_at')
      .eq('user_id', user.id),
    supabase
      .from('account_deletion_requests')
      .select('scheduled_for, status')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .maybeSingle(),
  ])

  const acceptations: LegalAcceptanceRow[] = (acceptancesRaw ?? []).map((a) => ({
    docType: a.doc_type,
    version: a.version,
    acceptedAt: a.accepted_at,
  }))

  return (
    <MaMemoirePage
      appName={APP_NAME}
      acceptations={acceptations}
      deletionScheduledFor={deletionRequest?.scheduled_for ?? null}
    />
  )
}
