import { buildCompanyInfo, buildMediateurInfo, type LegalAppConfig } from './index'

/**
 * Config NIYAMA de VIDA. `famille: 'karma_wellness'` (VIDA redistribue une part de ses
 * revenus aux utilisateurs via le wallet KARMA, cf constants.ts REWARD_POOL_PERCENTAGE).
 * `aPaiement`/`aChatIA` déterminés par lecture du code réel (checkout Stripe réel dans
 * api/stripe/checkout, chat IA réel dans api/chat + dashboard/chat) — pas supposés.
 */
export const VIDA_LEGAL_CONFIG: LegalAppConfig = {
  slug: 'vida',
  nom: 'VIDA',
  domaine: 'vida.purama.dev',
  famille: 'karma_wellness',
  company: buildCompanyInfo(),
  mediateur: buildMediateurInfo(),
  descriptionActivite:
    "VIDA est une plateforme de bien-être holistique qui combine un assistant IA, des missions à impact réel et une redistribution d'une partie de ses revenus à ses utilisateurs via un portefeuille numérique (wallet).",
  aPaiement: true,
  aChatIA: true,
}
