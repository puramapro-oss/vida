import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { askClaude } from '@/lib/claude'

export const runtime = 'nodejs'

const schema = z.object({
  query:     z.string().min(5).max(500),
  aide_slug: z.string().optional(),
})

const LAW_CONTEXT = `
ARTICLES DE LOI SOCIAUX FRANÇAIS (base de connaissances VIDA) :

RSA — Art. L262-1 CASF : "Toute personne résidant en France de manière stable et effective, dont le foyer dispose de ressources inférieures à un montant forfaitaire, a droit au RSA." Montant socle 2026 : 635,71€/mois personne seule.

ARE — Art. L5422-1 Code du travail : Droit à l'allocation d'aide au retour à l'emploi pour tout salarié involontairement privé d'emploi justifiant d'une période d'affiliation minimale (6 mois sur 24). Durée indemnisation = durée d'affiliation (min 6 mois, max 36 mois). Taux = 40,4 % du SJR + 12,05 €/j (plancher 31,97 €/j).

ASS — Art. L5423-1 Code du travail : 18,17€/j pour demandeurs d'emploi ayant épuisé leurs droits ARE + 5 ans de travail dans les 10 ans. Renouvelable tous les 6 mois sous conditions d'activité de recherche.

APL/ALS — Art. L821-1 CCH : Aides au logement calculées selon ressources N-2, loyer, zone géographique, composition familiale. Simulateur CAF officiel obligatoire pour montant exact.

Prime d'activité — Art. L842-1 CSS : Versée aux travailleurs (salariés ou non) dont les revenus d'activité sont inférieurs à un plafond (~1,5 SMIC). Base : 653,27€ (2026) + 61% revenus professionnels – revenus du foyer.

AAH — Art. L821-1 CSS : ~1 016,05€/mois (taux plein 2026) pour personne en situation de handicap avec taux d'incapacité ≥ 80% (ou 50-79% + restriction d'accès à l'emploi). Attribution MDPH.

PCH — Art. L245-1 CASF : Financement aide humaine (jusqu'à 1 707,27€/mois) + aide technique + aménagement logement/véhicule. Attribution MDPH, sans condition de ressources.

PAJE — Art. L531-1 CSS : Prime naissance 1 019,04€ (7e mois grossesse). Allocation de base 184,62€/mois (enfant < 3 ans). Sous plafond ressources variable selon nb d'enfants et situation familiale.

CMU-C / CSS — Art. L861-1 CSS : Couverture maladie universelle complémentaire (remplacée Complémentaire Santé Solidaire). Gratuite sous ~900€/mois (personne seule). Participation 1€/mois entre 900€ et ~1 300€.

Chèque énergie — Art. L124-1 Code énergie : Entre 48€ et 277€/an selon revenus (RFR < 10 800€/UC en 2026). Attribution automatique DGFiP, aucune démarche requise.

MDPH — Art. L146-3 CASF : Maison Départementale des Personnes Handicapées. Compétente RQTH, AAH, PCH, AEEH, Carte mobilité inclusion. Dépôt dossier en ligne via monparcourshandicap.gouv.fr.

Compte Épargne Formation (CEP) — Art. L6111-6 Code du travail : Accompagnement gratuit par un conseiller en évolution professionnelle pour tout actif. Via Mon Compte Formation.
`.trim()

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Requête invalide.' },
      { status: 400 }
    )
  }
  const { query } = parsed.data

  try {
    const response = await askClaude(
      [{ role: 'user', content: query }],
      'premium',
      undefined,
      { articles: [LAW_CONTEXT] }
    )

    return NextResponse.json({ response, source: 'vida_law_rag' })
  } catch {
    return NextResponse.json(
      { error: 'Le service juridique est temporairement indisponible. Réessaie dans quelques instants.' },
      { status: 503 }
    )
  }
}
