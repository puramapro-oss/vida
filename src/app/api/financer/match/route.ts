import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

const profilSchema = z.object({
  situation: z.array(z.enum([
    'etudiant', 'demandeur_emploi', 'salarie', 'independant', 'retraite',
    'parent', 'famille_monoparentale', 'handicape', 'senior', 'jeune',
    'locataire', 'proprietaire', 'zfrr',
  ])).min(1, 'Sélectionne au moins une situation'),
  age: z.number().int().min(15).max(110).optional(),
  revenus_mensuels: z.number().int().min(0).max(20000).optional(),
  enfants: z.number().int().min(0).max(20).optional(),
  region: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = profilSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Profil invalide. Vérifie les champs.', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { situation } = parsed.data
    const supabase = createServiceClient()

    // profil_eligible contient l'un des tags user → match
    const { data: aides, error } = await supabase
      .from('aides')
      .select('id, slug, nom, type_aide, organisme, profil_eligible, montant_max, periodicite, url_officielle, description, cumulable')
      .eq('active', true)
      .overlaps('profil_eligible', situation)
      .order('montant_max', { ascending: false })

    if (error) {
      console.error('[/api/financer/match] supabase error:', error)
      return NextResponse.json(
        { error: 'Impossible de charger les aides. Réessaie dans un instant.' },
        { status: 500 }
      )
    }

    const cumul_estime = (aides ?? []).reduce((sum, a) => sum + (a.cumulable ? a.montant_max : 0), 0)

    return NextResponse.json({
      count: aides?.length ?? 0,
      cumul_estime,
      aides: aides ?? [],
    })
  } catch (e) {
    console.error('[/api/financer/match] unexpected:', e)
    return NextResponse.json({ error: 'Une erreur inattendue. Recharge la page.' }, { status: 500 })
  }
}
