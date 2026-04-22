import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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
  loyer_mensuel: z.number().int().min(0).max(5000).optional(),
  region: z.string().optional(),
})

type Profil = z.infer<typeof profilSchema>

function hashProfil(profil: Profil): string {
  const normalized = {
    situation:        [...profil.situation].sort(),
    age:              profil.age              ?? null,
    revenus_mensuels: profil.revenus_mensuels ?? null,
    enfants:          profil.enfants          ?? null,
    loyer_mensuel:    profil.loyer_mensuel    ?? null,
    region:           (profil.region ?? '').toLowerCase().trim() || null,
  }
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
}

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

    const profil = parsed.data
    const supabase = createServiceClient()

    // User optionnel — /financer est public, on loggue user_id si présent
    const serverSb = await createServerSupabaseClient()
    const { data: { user } } = await serverSb.auth.getUser()

    // profil_eligible contient l'un des tags user → match
    const { data: aides, error } = await supabase
      .from('aides')
      .select('id, slug, nom, type_aide, organisme, profil_eligible, montant_max, periodicite, url_officielle, description, cumulable, legifrance_refs')
      .eq('active', true)
      .overlaps('profil_eligible', profil.situation)
      .order('montant_max', { ascending: false })

    if (error) {
      console.error('[/api/financer/match] supabase error:', error)
      return NextResponse.json(
        { error: 'Impossible de charger les aides. Réessaie dans un instant.' },
        { status: 500 }
      )
    }

    const cumul_estime = (aides ?? []).reduce((sum, a) => sum + (a.cumulable ? a.montant_max : 0), 0)

    // Traçabilité (best-effort — await pour garantir l'exécution en serverless)
    const { error: simError } = await supabase.from('aide_simulations').insert({
      user_id:          user?.id             ?? null,
      profil_hash:      hashProfil(profil),
      situation:        profil.situation,
      age:              profil.age            ?? null,
      revenus_mensuels: profil.revenus_mensuels ?? null,
      enfants:          profil.enfants        ?? null,
      loyer_mensuel:    profil.loyer_mensuel  ?? null,
      region:           profil.region         ?? null,
      aides_count:      aides?.length         ?? 0,
      cumul_estime,
      simulation_ok:    false,
      cache_hit:        false,
      source:           'static',
    })
    if (simError) console.error('[/api/financer/match] sim log:', simError.message)

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
