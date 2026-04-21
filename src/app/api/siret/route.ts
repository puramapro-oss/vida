import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const schema = z.object({
  siret: z
    .string()
    .trim()
    .regex(/^\d{14}$/, 'Le SIRET doit contenir exactement 14 chiffres'),
})

interface SiretCacheRow {
  siret: string
  data: SiretNormalized
  fetched_at: string
}

interface SiretNormalized {
  siret: string
  siren: string
  denomination: string
  activite: string
  codeNaf: string
  adresse: string
  codePostal: string
  ville: string
  statut: 'actif' | 'fermé' | 'inconnu'
  dateCreation: string | null
  dateFermeture: string | null
}

// Simple in-process rate limiter: 25 req/min per IP
const ipWindowMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 25
const WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipWindowMap.get(ip)
  if (!entry || now > entry.resetAt) {
    ipWindowMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

async function fetchInsee(siret: string): Promise<SiretNormalized> {
  const url = `https://api.insee.fr/entreprises/sirene/V3.11/siret/${siret}`
  const res = await fetch(url, {
    headers: {
      'X-INSEE-Api-Key-Integration': process.env.INSEE_API_KEY ?? '',
      Accept: 'application/json',
    },
    next: { revalidate: 0 },
  })

  if (res.status === 404) {
    return {
      siret,
      siren: siret.slice(0, 9),
      denomination: 'SIRET non trouvé',
      activite: '',
      codeNaf: '',
      adresse: '',
      codePostal: '',
      ville: '',
      statut: 'inconnu',
      dateCreation: null,
      dateFermeture: null,
    }
  }

  if (!res.ok) {
    throw new Error(`INSEE API erreur ${res.status}`)
  }

  const json = await res.json()
  const etablissement = json?.etablissement ?? {}
  const uniteLegale = etablissement?.uniteLegale ?? {}
  const adresseEtab = etablissement?.adresseEtablissement ?? {}

  const etatAdm = etablissement?.periodesEtablissement?.[0]?.etatAdministratifEtablissement
  const statut: SiretNormalized['statut'] =
    etatAdm === 'A' ? 'actif' : etatAdm === 'F' ? 'fermé' : 'inconnu'

  const rawDenom =
    (uniteLegale?.denominationUniteLegale as string | undefined) ??
    `${uniteLegale?.prenomUsuelUniteLegale ?? ''} ${uniteLegale?.nomUniteLegale ?? ''}`.trim()
  const denomination = rawDenom || 'Dénomination inconnue'

  const numero = adresseEtab?.numeroVoieEtablissement ?? ''
  const typeVoie = adresseEtab?.typeVoieEtablissement ?? ''
  const libelleVoie = adresseEtab?.libelleVoieEtablissement ?? ''
  const adresse = [numero, typeVoie, libelleVoie].filter(Boolean).join(' ')

  return {
    siret,
    siren: siret.slice(0, 9),
    denomination,
    activite: uniteLegale?.activitePrincipaleUniteLegale ?? '',
    codeNaf: uniteLegale?.activitePrincipaleUniteLegale ?? '',
    adresse,
    codePostal: adresseEtab?.codePostalEtablissement ?? '',
    ville: adresseEtab?.libelleCommuneEtablissement ?? '',
    statut,
    dateCreation: etablissement?.dateCreationEtablissement ?? null,
    dateFermeture: etablissement?.dateFermetureEtablissement ?? null,
  }
}

const TTL_DAYS = 30
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }

  // Rate limit
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessaie dans une minute.' },
      { status: 429 }
    )
  }

  // Input validation
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'SIRET invalide' },
      { status: 400 }
    )
  }
  const { siret } = parsed.data

  const service = createServiceClient()

  // Cache lookup (TTL 30 jours)
  const { data: cached } = await service
    .from('siret_cache')
    .select('siret, data, fetched_at')
    .eq('siret', siret)
    .single<SiretCacheRow>()

  if (cached) {
    const age = Date.now() - new Date(cached.fetched_at).getTime()
    if (age < TTL_MS) {
      return NextResponse.json({ ...cached.data, cached: true })
    }
  }

  // Cache miss or expired → appel INSEE
  try {
    const normalized = await fetchInsee(siret)

    // Upsert dans le cache
    await service.from('siret_cache').upsert({
      siret,
      data: normalized,
      fetched_at: new Date().toISOString(),
    })

    return NextResponse.json({ ...normalized, cached: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur INSEE'
    return NextResponse.json(
      { error: `Impossible de vérifier ce SIRET. ${message}` },
      { status: 502 }
    )
  }
}
