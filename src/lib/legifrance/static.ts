/**
 * Fallback ultime : 12 articles hardcodés — jamais de "VIDA down".
 * Ces articles sont servis si tous les autres étages de cache échouent
 * (Upstash + Postgres + Pinecone + PISTE + OpenData tous down).
 *
 * Structure identique à LegifranceArticle pour interopérabilité avec le RAG.
 * Source : ancien LAW_CONTEXT (src/lib/legifrance.ts — toujours exporté pour compat).
 */

import type { LegifranceArticle } from './types'

const NOW_ISO = '2026-04-22T00:00:00.000Z'

export const LAW_CONTEXT_STATIC: LegifranceArticle[] = [
  {
    cid: 'STATIC_RSA_L262-1',
    code: 'LEGITEXT000006074069',
    code_nom: "Code de l'action sociale et des familles",
    numero: 'L262-1',
    titre: 'Revenu de solidarité active (RSA)',
    texte: "Toute personne résidant en France de manière stable et effective, dont le foyer dispose de ressources inférieures à un montant forfaitaire, a droit au RSA. Montant socle 2026 : 635,71€/mois personne seule.",
    date_debut: '2009-06-01T00:00:00.000Z',
    date_fin: null,
    etat: 'VIGUEUR',
    url_legifrance: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033973826',
    version_num: 1,
    last_synced_at: NOW_ISO,
  },
  {
    cid: 'STATIC_ARE_L5422-1',
    code: 'LEGITEXT000006072050',
    code_nom: 'Code du travail',
    numero: 'L5422-1',
    titre: "Allocation d'aide au retour à l'emploi (ARE)",
    texte: "Droit à l'allocation d'aide au retour à l'emploi pour tout salarié involontairement privé d'emploi justifiant d'une période d'affiliation minimale (6 mois sur 24). Durée indemnisation = durée d'affiliation (min 6 mois, max 36 mois). Taux = 40,4 % du SJR + 12,05 €/j (plancher 31,97 €/j).",
    date_debut: '2008-05-01T00:00:00.000Z',
    date_fin: null,
    etat: 'VIGUEUR',
    url_legifrance: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047068744',
    version_num: 1,
    last_synced_at: NOW_ISO,
  },
  {
    cid: 'STATIC_ASS_L5423-1',
    code: 'LEGITEXT000006072050',
    code_nom: 'Code du travail',
    numero: 'L5423-1',
    titre: 'Allocation de solidarité spécifique (ASS)',
    texte: "18,17€/j pour demandeurs d'emploi ayant épuisé leurs droits ARE + 5 ans de travail dans les 10 ans. Renouvelable tous les 6 mois sous conditions d'activité de recherche.",
    date_debut: '2008-05-01T00:00:00.000Z',
    date_fin: null,
    etat: 'VIGUEUR',
    url_legifrance: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045827395',
    version_num: 1,
    last_synced_at: NOW_ISO,
  },
  {
    cid: 'STATIC_APL_L821-1_CCH',
    code: 'LEGITEXT000006074096', // Code de la construction et de l'habitation
    code_nom: "Code de la construction et de l'habitation",
    numero: 'L821-1',
    titre: 'Aide personnalisée au logement (APL/ALS)',
    texte: "Aides au logement calculées selon ressources N-2, loyer, zone géographique, composition familiale. Simulateur CAF officiel obligatoire pour montant exact.",
    date_debut: '2019-01-01T00:00:00.000Z',
    date_fin: null,
    etat: 'VIGUEUR',
    url_legifrance: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038814689',
    version_num: 1,
    last_synced_at: NOW_ISO,
  },
  {
    cid: 'STATIC_PRIME_L842-1',
    code: 'LEGITEXT000006073189',
    code_nom: 'Code de la sécurité sociale',
    numero: 'L842-1',
    titre: "Prime d'activité",
    texte: "Versée aux travailleurs (salariés ou non) dont les revenus d'activité sont inférieurs à un plafond (~1,5 SMIC). Base : 653,27€ (2026) + 61% revenus professionnels – revenus du foyer.",
    date_debut: '2016-01-01T00:00:00.000Z',
    date_fin: null,
    etat: 'VIGUEUR',
    url_legifrance: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000031694143',
    version_num: 1,
    last_synced_at: NOW_ISO,
  },
  {
    cid: 'STATIC_AAH_L821-1_CSS',
    code: 'LEGITEXT000006073189',
    code_nom: 'Code de la sécurité sociale',
    numero: 'L821-1',
    titre: 'Allocation aux adultes handicapés (AAH)',
    texte: "~1 016,05€/mois (taux plein 2026) pour personne en situation de handicap avec taux d'incapacité ≥ 80% (ou 50-79% + restriction d'accès à l'emploi). Attribution MDPH.",
    date_debut: '2005-02-11T00:00:00.000Z',
    date_fin: null,
    etat: 'VIGUEUR',
    url_legifrance: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047566290',
    version_num: 1,
    last_synced_at: NOW_ISO,
  },
  {
    cid: 'STATIC_PCH_L245-1',
    code: 'LEGITEXT000006074069',
    code_nom: "Code de l'action sociale et des familles",
    numero: 'L245-1',
    titre: 'Prestation de compensation du handicap (PCH)',
    texte: "Financement aide humaine (jusqu'à 1 707,27€/mois) + aide technique + aménagement logement/véhicule. Attribution MDPH, sans condition de ressources.",
    date_debut: '2006-01-01T00:00:00.000Z',
    date_fin: null,
    etat: 'VIGUEUR',
    url_legifrance: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047566255',
    version_num: 1,
    last_synced_at: NOW_ISO,
  },
  {
    cid: 'STATIC_PAJE_L531-1',
    code: 'LEGITEXT000006073189',
    code_nom: 'Code de la sécurité sociale',
    numero: 'L531-1',
    titre: "Prestation d'accueil du jeune enfant (PAJE)",
    texte: "Prime naissance 1 019,04€ (7e mois grossesse). Allocation de base 184,62€/mois (enfant < 3 ans). Sous plafond ressources variable selon nb d'enfants et situation familiale.",
    date_debut: '2004-01-01T00:00:00.000Z',
    date_fin: null,
    etat: 'VIGUEUR',
    url_legifrance: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049616574',
    version_num: 1,
    last_synced_at: NOW_ISO,
  },
  {
    cid: 'STATIC_CSS_L861-1',
    code: 'LEGITEXT000006073189',
    code_nom: 'Code de la sécurité sociale',
    numero: 'L861-1',
    titre: 'Complémentaire santé solidaire (ex CMU-C)',
    texte: "Couverture maladie universelle complémentaire. Gratuite sous ~900€/mois (personne seule). Participation 1€/mois entre 900€ et ~1 300€.",
    date_debut: '2019-11-01T00:00:00.000Z',
    date_fin: null,
    etat: 'VIGUEUR',
    url_legifrance: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037050611',
    version_num: 1,
    last_synced_at: NOW_ISO,
  },
  {
    cid: 'STATIC_CHEQUE_L124-1',
    code: 'LEGITEXT000023983208', // Code de l'énergie
    code_nom: "Code de l'énergie",
    numero: 'L124-1',
    titre: 'Chèque énergie',
    texte: "Entre 48€ et 277€/an selon revenus (RFR < 10 800€/UC en 2026). Attribution automatique DGFiP, aucune démarche requise.",
    date_debut: '2018-01-01T00:00:00.000Z',
    date_fin: null,
    etat: 'VIGUEUR',
    url_legifrance: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037549711',
    version_num: 1,
    last_synced_at: NOW_ISO,
  },
  {
    cid: 'STATIC_MDPH_L146-3',
    code: 'LEGITEXT000006074069',
    code_nom: "Code de l'action sociale et des familles",
    numero: 'L146-3',
    titre: 'Maison départementale des personnes handicapées (MDPH)',
    texte: "Compétente RQTH, AAH, PCH, AEEH, Carte mobilité inclusion. Dépôt dossier en ligne via monparcourshandicap.gouv.fr.",
    date_debut: '2006-01-01T00:00:00.000Z',
    date_fin: null,
    etat: 'VIGUEUR',
    url_legifrance: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043892020',
    version_num: 1,
    last_synced_at: NOW_ISO,
  },
  {
    cid: 'STATIC_CEP_L6111-6',
    code: 'LEGITEXT000006072050',
    code_nom: 'Code du travail',
    numero: 'L6111-6',
    titre: 'Conseil en évolution professionnelle (CEP)',
    texte: "Accompagnement gratuit par un conseiller en évolution professionnelle pour tout actif. Via Mon Compte Formation (moncompteformation.gouv.fr).",
    date_debut: '2019-01-01T00:00:00.000Z',
    date_fin: null,
    etat: 'VIGUEUR',
    url_legifrance: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037385632',
    version_num: 1,
    last_synced_at: NOW_ISO,
  },
]

/** Recherche naïve par mots-clés dans le fallback static. */
export function searchStatic(query: string, topK = 5): LegifranceArticle[] {
  const tokens = query
    .toLowerCase()
    .split(/[\s,.'—–-]+/)
    .filter((t) => t.length >= 3)

  const scored = LAW_CONTEXT_STATIC.map((article) => {
    const haystack = (article.numero + ' ' + article.titre + ' ' + article.texte).toLowerCase()
    const score = tokens.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0)
    return { article, score }
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return scored.map((r) => r.article)
}
