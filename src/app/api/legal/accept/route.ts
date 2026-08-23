/**
 * POST /api/legal/accept — enregistre une preuve d'acceptation horodatée (qui/quelle
 * version/quand) d'un document légal (mentions, CGU, CGV ou politique de confidentialité).
 * Appelé à la création de compte (signup) et par LegalReacceptanceGate quand une version
 * change. La version enregistrée est TOUJOURS CURRENT_LEGAL_VERSIONS[docType] calculée
 * côté serveur — jamais une valeur envoyée par le client (piège PIEGES.md §16).
 *
 * `upsert` (pas `insert`) : une 2e acceptation du même doc_type par le même utilisateur
 * (ré-acceptation après bump de version) violerait sinon la contrainte UNIQUE(user_id,doc_type).
 */
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { CURRENT_LEGAL_VERSIONS } from '@/lib/legal/versions'
import { enforceRateLimit } from '@/lib/rate-limit'

const bodySchema = z.object({
  docType: z.enum(['mentions', 'cgu', 'cgv', 'confidentialite']),
})

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const limited = enforceRateLimit(`legal-accept:${user.id}`, 30, 60_000)
  if (limited) return limited

  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const { error } = await supabase.from('legal_acceptances').upsert(
    {
      user_id: user.id,
      doc_type: parsed.data.docType,
      version: CURRENT_LEGAL_VERSIONS[parsed.data.docType],
      accepted_at: new Date().toISOString(),
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      user_agent: req.headers.get('user-agent'),
    },
    { onConflict: 'user_id,doc_type' }
  )

  if (error) {
    return NextResponse.json({ error: 'Enregistrement impossible.', debug: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
