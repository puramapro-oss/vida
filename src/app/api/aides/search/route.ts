import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'

export const runtime = 'nodejs'

const OPENFISCA_API = 'https://api.openfisca.fr/api/latest/calculate'
const OPENFISCA_VARIABLES = [
  'rsa', 'aide_logement', 'als', 'prime_activite',
  'aah', 'cheque_energie', 'pension_invalidite',
]

const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6h

const profilSchema = z.object({
  situation:          z.array(z.enum([
    'etudiant', 'demandeur_emploi', 'salarie', 'independant', 'retraite',
    'parent', 'famille_monoparentale', 'handicape', 'senior', 'jeune',
    'locataire', 'proprietaire', 'zfrr',
  ])).min(1),
  age:                z.number().int().min(15).max(110).optional(),
  revenus_mensuels:   z.number().int().min(0).max(20_000).optional(),
  enfants:            z.number().int().min(0).max(20).optional(),
  region:             z.string().optional(),
  loyer_mensuel:      z.number().int().min(0).max(5_000).optional(),
})

type Profil = z.infer<typeof profilSchema>

// Map activité from our profil tags to OpenFisca activite enum
function toActivite(sit: string[]): string {
  if (sit.includes('salarie'))          return 'salarie'
  if (sit.includes('demandeur_emploi')) return 'chomeur'
  if (sit.includes('etudiant'))         return 'etudiant'
  if (sit.includes('retraite'))         return 'retraite'
  if (sit.includes('independant'))      return 'independant'
  return 'inactif'
}

// Build OpenFisca situation object from our profil
function buildOpenFiscaSituation(profil: Profil): object {
  const today    = new Date()
  const month    = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const birthYear = profil.age ? today.getFullYear() - profil.age : 1985
  const dateNaissance = `${birthYear}-06-15`

  const individu: Record<string, unknown> = {
    activite:              { [month]: toActivite(profil.situation) },
    date_naissance:        dateNaissance,
    salaire_net:           { [month]: profil.situation.includes('salarie') ? (profil.revenus_mensuels ?? 0) : 0 },
    chomage_net:           { [month]: profil.situation.includes('demandeur_emploi') ? (profil.revenus_mensuels ?? 0) : 0 },
    handicap:              { [month]: profil.situation.includes('handicape') },
    retraite_brute:        { [month]: profil.situation.includes('retraite') ? (profil.revenus_mensuels ?? 0) : 0 },
  }

  const statut_occupation: string =
    profil.situation.includes('locataire') ? 'locataire' :
    profil.situation.includes('proprietaire') ? 'primo_accedant' :
    'loge_gratuitement'

  const menage: Record<string, unknown> = {
    personne_de_reference: ['individu_0'],
    enfants:               Array.from({ length: profil.enfants ?? 0 }, (_, i) => `enfant_${i}`),
    statut_occupation_logement: { [month]: statut_occupation },
    loyer:                 { [month]: profil.loyer_mensuel ?? 600 },
    depcom:                profil.region ? regionToDepcom(profil.region) : '75056',
  }

  const enfantsObj: Record<string, Record<string, unknown>> = {}
  for (let i = 0; i < (profil.enfants ?? 0); i++) {
    enfantsObj[`enfant_${i}`] = {
      date_naissance: `${today.getFullYear() - (i + 1) * 2}-01-01`,
      garde_alternee: { [month]: false },
    }
  }

  return {
    individus: { individu_0: individu, ...enfantsObj },
    menages: { _: menage },
    familles: {
      _: {
        parents: ['individu_0'],
        enfants: Object.keys(enfantsObj),
      },
    },
    foyers_fiscaux: {
      _: {
        declarants: ['individu_0'],
        personnes_a_charge: Object.keys(enfantsObj),
      },
    },
  }
}

function regionToDepcom(region: string): string {
  const map: Record<string, string> = {
    'ile-de-france': '75056', 'idf': '75056',
    'paca': '13055', 'auvergne-rhone-alpes': '69123',
    'bretagne': '35238', 'normandie': '76540',
    'nouvelle-aquitaine': '33063', 'occitanie': '31555',
    'hauts-de-france': '59350', 'grand-est': '67482',
    'pays-de-la-loire': '44109', 'bourgogne-franche-comte': '21231',
    'centre-val-de-loire': '45234', 'corse': '2A004',
  }
  return map[region.toLowerCase()] ?? '75056'
}

interface OpenFiscaResult {
  montants: Partial<Record<string, number>>
  simule: boolean
}

function hashProfil(profil: Profil): string {
  const normalized = {
    situation:        [...profil.situation].sort(),
    age:              profil.age        ?? null,
    revenus_mensuels: profil.revenus_mensuels ?? null,
    enfants:          profil.enfants    ?? null,
    loyer_mensuel:    profil.loyer_mensuel    ?? null,
    region:           (profil.region ?? '').toLowerCase().trim() || null,
  }
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
}

async function getCachedOpenFisca(
  service: ReturnType<typeof createServiceClient>,
  hash: string,
): Promise<OpenFiscaResult | null> {
  const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString()
  const { data } = await service
    .from('openfisca_cache')
    .select('result, created_at')
    .eq('profil_hash', hash)
    .gte('created_at', cutoff)
    .maybeSingle()

  if (!data) return null
  const result = data.result as OpenFiscaResult
  if (!result || typeof result.simule !== 'boolean') return null
  return result
}

async function setCachedOpenFisca(
  service: ReturnType<typeof createServiceClient>,
  hash: string,
  result: OpenFiscaResult,
): Promise<void> {
  // Upsert — refresh created_at si même profil re-simulé
  await service.from('openfisca_cache').upsert(
    { profil_hash: hash, result, created_at: new Date().toISOString() },
    { onConflict: 'profil_hash' },
  )
}

async function runOpenFiscaSimulation(profil: Profil): Promise<OpenFiscaResult> {
  const situation = buildOpenFiscaSituation(profil)
  const today     = new Date()
  const month     = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const payload = {
    situations:       [situation],
    variables:        OPENFISCA_VARIABLES,
    intermediate_variables: false,
    max_spiral_loops: 4,
    output_format:    'variables',
    period:           month,
  }

  const res = await fetch(OPENFISCA_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8_000),
  })

  if (!res.ok) throw new Error(`OpenFisca HTTP ${res.status}`)

  const json: Record<string, Record<string, number[]>> = await res.json()

  // Extract first value for each variable (single individu/menage situation)
  const montants: Partial<Record<string, number>> = {}
  for (const varName of OPENFISCA_VARIABLES) {
    const vals = json[varName]?.[month]
    if (Array.isArray(vals) && vals.length > 0) {
      montants[varName] = Math.round(vals[0] * 12) // annualise
    }
  }

  return { montants, simule: true }
}

interface AideRow {
  id: string
  slug: string
  nom: string
  type_aide: string
  organisme: string
  profil_eligible: string[]
  montant_max: number
  periodicite: string
  url_officielle: string
  description: string
  cumulable: boolean
  openfisca_variable: string | null
  legifrance_refs: string[]
  simulation_possible: boolean
}

export async function POST(req: NextRequest) {
  // Auth check — recherche accessible aux users connectés uniquement
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Connexion requise pour lancer une simulation.' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = profilSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Profil invalide.' },
      { status: 400 }
    )
  }
  const profil = parsed.data
  const service = createServiceClient()

  // Super-admin skip cache (debug flow) — détecte email DB sans bloquer si absent
  const { data: profileRow } = await service
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .maybeSingle()
  const skipCache = profileRow?.email === SUPER_ADMIN_EMAIL

  // 1. Requête statique Supabase — aides éligibles selon profil
  const { data: aides, error } = await service
    .from('aides')
    .select('id,slug,nom,type_aide,organisme,profil_eligible,montant_max,periodicite,url_officielle,description,cumulable,openfisca_variable,legifrance_refs,simulation_possible')
    .eq('active', true)
    .overlaps('profil_eligible', profil.situation)
    .order('montant_max', { ascending: false })

  if (error || !aides) {
    return NextResponse.json(
      { error: 'Impossible de charger les aides. Réessaie dans un instant.' },
      { status: 500 }
    )
  }

  // 2. OpenFisca simulation — check cache d'abord (6h TTL), fallback API, fallback silencieux
  const hash = hashProfil(profil)
  let simulation: OpenFiscaResult = { montants: {}, simule: false }
  let cacheHit = false

  if (!skipCache) {
    const cached = await getCachedOpenFisca(service, hash).catch(() => null)
    if (cached) {
      simulation = cached
      cacheHit   = true
    }
  }

  if (!cacheHit) {
    try {
      simulation = await runOpenFiscaSimulation(profil)
      // Cache uniquement les résultats réussis (sinon on cache les 503)
      if (simulation.simule) {
        setCachedOpenFisca(service, hash, simulation).catch(() => {
          // Best-effort — ignore silencieusement si cache DB down
        })
      }
    } catch {
      // API unavailable — on continue avec montants statiques
    }
  }

  // 3. Enrichir les aides avec montants simulés quand disponible
  const aidesEnrichies = (aides as AideRow[]).map((aide) => {
    const montant_simule = aide.openfisca_variable
      ? (simulation.montants[aide.openfisca_variable] ?? null)
      : null

    return {
      ...aide,
      montant_affiche:  montant_simule ?? aide.montant_max,
      montant_simule,
      source_montant:   montant_simule !== null ? 'openfisca' : 'estimatif',
    }
  })

  const cumul_estime = aidesEnrichies
    .filter((a) => a.cumulable)
    .reduce((sum, a) => sum + a.montant_affiche, 0)

  return NextResponse.json({
    count:           aidesEnrichies.length,
    cumul_estime,
    simulation_ok:   simulation.simule,
    cache_hit:       cacheHit,
    aides:           aidesEnrichies,
  })
}
