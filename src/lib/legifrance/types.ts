/**
 * Types partagés pour l'intégration Legifrance dynamique.
 *
 * Référence API PISTE : https://api.piste.gouv.fr/dila/legifrance/lf-engine-app/
 * Référence OpenData DILA : https://echanges.dila.gouv.fr/OPENDATA/LEGI/
 */

/** Codes ciblés par VIDA (3 codes sociaux principaux). */
export const TARGETED_CODES = {
  TRAVAIL: {
    id: 'LEGITEXT000006072050',
    nom: 'Code du travail',
    abrev: 'C. trav.',
  },
  SECURITE_SOCIALE: {
    id: 'LEGITEXT000006073189',
    nom: 'Code de la sécurité sociale',
    abrev: 'CSS',
  },
  ACTION_SOCIALE: {
    id: 'LEGITEXT000006074069',
    nom: "Code de l'action sociale et des familles",
    abrev: 'CASF',
  },
} as const

export type CodeKey = keyof typeof TARGETED_CODES
export type CodeId = (typeof TARGETED_CODES)[CodeKey]['id']

/** État de vigueur d'un article (normalisé). */
export type ArticleEtat = 'VIGUEUR' | 'ABROGE' | 'MODIFIE' | 'PERIME'

/** Article Legifrance tel qu'on le stocke en DB et qu'on l'expose au RAG. */
export interface LegifranceArticle {
  cid: string                      // "LEGIARTI000006742692"
  code: string                     // "LEGITEXT000006072050"
  code_nom: string                 // "Code du travail"
  numero: string                   // "L1234-5"
  titre: string                    // Libellé court
  texte: string                    // Contenu complet
  date_debut: string | null        // ISO 8601
  date_fin: string | null          // ISO 8601, null si en vigueur
  etat: ArticleEtat
  url_legifrance: string
  version_num: number
  last_synced_at: string           // ISO 8601
}

/** Résultat de recherche avec score de pertinence. */
export interface LegifranceSearchResult {
  article: LegifranceArticle
  score: number                    // 0..1, plus haut = plus pertinent
  source: 'pinecone' | 'postgres' | 'piste' | 'opendata' | 'static'
  highlight?: string               // Extrait avec mots-clés encadrés
}

/** Paramètres de recherche. */
export interface SearchParams {
  query: string
  codes?: CodeId[]                 // Filtrer sur codes précis (défaut : tous)
  topK?: number                    // Nombre d'articles retournés (défaut 5)
  minScore?: number                // Score min pour inclure (défaut 0.1)
}

/** Réponse OAuth PISTE. */
export interface PisteTokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number               // Secondes
  scope: string
}

/** Job de sync (mirror DB). */
export interface SyncJob {
  id: string
  codes: string[]
  status: 'pending' | 'running' | 'completed' | 'failed'
  source: 'piste' | 'opendata' | 'manual'
  triggered_by: string
  articles_synced: number
  articles_failed: number
  started_at: string | null
  ended_at: string | null
  duration_s: number | null
  created_at: string
}

/** Erreur structurée pour traçabilité. */
export class LegifranceError extends Error {
  constructor(
    message: string,
    public readonly source: 'piste' | 'opendata' | 'cache' | 'postgres' | 'pinecone',
    public readonly retriable: boolean = false,
    public readonly statusCode?: number,
  ) {
    super(message)
    this.name = 'LegifranceError'
  }
}
