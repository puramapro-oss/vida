import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { CURRENT_LEGAL_VERSIONS } from '@/lib/legal/versions'

type SupabaseServer = Awaited<ReturnType<typeof createServerSupabaseClient>>

/**
 * Enregistre la preuve d'acceptation CGU/CGV/confidentialité (NIYAMA-BRIEF.md §1) au tout
 * premier passage d'un utilisateur ici (premier login Google OAuth = moment réel de
 * "création de compte" pour ce flux, qui n'affiche pas la case CGU du formulaire email).
 * Gardé par un check "0 ligne existante" pour ne jamais ré-insérer à chaque login suivant.
 * Corrige CONFORMITE.md Gap #2 (comptes Google sans aucune preuve d'acceptation).
 */
async function recordLegalAcceptanceIfFirstTime(supabase: SupabaseServer, userId: string) {
  const { count } = await supabase
    .from('legal_acceptances')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (count && count > 0) return

  const docTypes: Array<keyof typeof CURRENT_LEGAL_VERSIONS> = ['cgu', 'cgv', 'confidentialite']
  await supabase.from('legal_acceptances').insert(
    docTypes.map((docType) => ({
      user_id: userId,
      doc_type: docType,
      version: CURRENT_LEGAL_VERSIONS[docType],
    }))
  )
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) await recordLegalAcceptanceIfFirstTime(supabase, user.id)

      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
}
