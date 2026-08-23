import {
  Leaf, Users, Heart, Home, Briefcase, Baby,
  Accessibility, GraduationCap, UserCheck, MapPin, Sparkles,
} from 'lucide-react'

export type SituationTag =
  | 'etudiant' | 'demandeur_emploi' | 'salarie' | 'independant' | 'retraite'
  | 'parent' | 'famille_monoparentale' | 'handicape' | 'senior' | 'jeune'
  | 'locataire' | 'proprietaire' | 'zfrr'

export interface Aide {
  id: string
  slug: string
  nom: string
  type_aide: string
  organisme: string
  profil_eligible: SituationTag[]
  montant_max: number
  periodicite: 'mensuelle' | 'annuelle' | 'ponctuelle'
  url_officielle: string
  description: string
  cumulable: boolean
  // Optional OpenFisca-enriched fields
  montant_affiche?: number
  montant_simule?: number | null
  source_montant?: 'openfisca' | 'estimatif'
  openfisca_variable?: string | null
  legifrance_refs?: string[]
  simulation_possible?: boolean
}

export const SITUATIONS: { tag: SituationTag; label: string; icon: typeof Users; hint: string }[] = [
  { tag: 'demandeur_emploi', label: 'Demandeur d\'emploi', icon: Briefcase, hint: 'Inscrit Pôle Emploi / fin de contrat' },
  { tag: 'salarie', label: 'Salarié', icon: UserCheck, hint: 'CDI, CDD, intérim' },
  { tag: 'independant', label: 'Indépendant', icon: Briefcase, hint: 'Micro-entrepreneur, freelance, TNS' },
  { tag: 'etudiant', label: 'Étudiant', icon: GraduationCap, hint: 'Bac+1 et plus' },
  { tag: 'jeune', label: 'Jeune (16-29 ans)', icon: Sparkles, hint: 'Peu importe le statut' },
  { tag: 'retraite', label: 'Retraité', icon: Heart, hint: 'Régime général / privé / public' },
  { tag: 'senior', label: 'Senior (60+)', icon: Heart, hint: 'Perte d\'autonomie ou préparation' },
  { tag: 'parent', label: 'Parent', icon: Baby, hint: '1 enfant ou plus à charge' },
  { tag: 'famille_monoparentale', label: 'Parent isolé', icon: Baby, hint: 'Sans conjoint·e' },
  { tag: 'handicape', label: 'Handicap', icon: Accessibility, hint: 'Taux ≥50% (RQTH, MDPH)' },
  { tag: 'locataire', label: 'Locataire', icon: Home, hint: 'Privé, social, résidence' },
  { tag: 'proprietaire', label: 'Propriétaire', icon: Home, hint: 'Résidence principale' },
  { tag: 'zfrr', label: 'Zone Ruralité (ZFRR)', icon: MapPin, hint: 'Commune en Zone France Ruralité Revitalisation' },
]

export const REGIONS: { value: string; label: string }[] = [
  { value: '',                       label: 'Non précisée' },
  { value: 'ile-de-france',          label: 'Île-de-France' },
  { value: 'auvergne-rhone-alpes',   label: 'Auvergne-Rhône-Alpes' },
  { value: 'nouvelle-aquitaine',     label: 'Nouvelle-Aquitaine' },
  { value: 'occitanie',              label: 'Occitanie' },
  { value: 'hauts-de-france',        label: 'Hauts-de-France' },
  { value: 'grand-est',              label: 'Grand Est' },
  { value: 'provence-alpes-cote-d-azur', label: 'PACA' },
  { value: 'pays-de-la-loire',       label: 'Pays de la Loire' },
  { value: 'bretagne',               label: 'Bretagne' },
  { value: 'normandie',              label: 'Normandie' },
  { value: 'bourgogne-franche-comte', label: 'Bourgogne-Franche-Comté' },
  { value: 'centre-val-de-loire',    label: 'Centre-Val de Loire' },
  { value: 'corse',                  label: 'Corse' },
  { value: 'outre-mer',              label: 'Outre-mer' },
]

export const TYPE_COLORS: Record<string, string> = {
  revenu: 'from-emerald-500/20 to-emerald-400/5',
  logement: 'from-sky-500/20 to-sky-400/5',
  sante: 'from-rose-500/20 to-rose-400/5',
  handicap: 'from-violet-500/20 to-violet-400/5',
  famille: 'from-amber-500/20 to-amber-400/5',
  jeune: 'from-pink-500/20 to-pink-400/5',
  emploi: 'from-indigo-500/20 to-indigo-400/5',
  energie: 'from-lime-500/20 to-lime-400/5',
  senior: 'from-teal-500/20 to-teal-400/5',
  fiscal: 'from-yellow-500/20 to-yellow-400/5',
  transport: 'from-orange-500/20 to-orange-400/5',
}

export function formatMontant(a: Aide): string {
  const montant = a.montant_affiche ?? a.montant_max
  if (montant === 0) return 'Avantage en nature'
  const suf = a.periodicite === 'mensuelle' ? '/an (en cumulé)' : a.periodicite === 'annuelle' ? '/an' : 'en une fois'
  const prefix = a.source_montant === 'openfisca' ? '' : 'jusqu\'à '
  return `${prefix}${montant.toLocaleString('fr-FR')}€ ${suf}`
}

export function legifranceSearchUrl(ref: string): string {
  return `https://www.legifrance.gouv.fr/search/code?query=${encodeURIComponent(ref)}`
}
