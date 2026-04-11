export const SUPER_ADMIN_EMAIL = 'matiss.frasne@gmail.com'

export const APP_NAME = 'VIDA'
export const APP_SLUG = 'vida'
export const APP_DOMAIN = 'vida.purama.dev'
export const APP_COLOR = '#10B981'
export const APP_COLOR_DEEP = '#047857'
export const APP_COLOR_GLOW = 'rgba(16,185,129,0.35)'
export const APP_SCHEMA = 'vida_sante'
export const APP_TAGLINE = "L'écosystème vivant qui transforme chaque action en impact réel sur le monde."

export const COMPANY_INFO = {
  name: 'SASU PURAMA',
  address: '8 Rue de la Chapelle, 25560 Frasne',
  country: 'France',
  siret: '', // ZFRR exoneration
  taxNote: 'TVA non applicable, art. 293 B du CGI',
  dpo: 'matiss.frasne@gmail.com',
  asso: 'Association PURAMA (Présidente : Solenne DORNIER)',
}

// VIDA — 1 abonnement (Free exploration + Premium)
// Prix en centimes. 14j essai. -33% annuel.
export const PLAN_LIMITS = {
  free: {
    label: 'Découverte',
    price_month: 0,
    price_year: 0,
    daily_ai_messages: 5,
    missions_per_day: 1,
    can_withdraw_cash: false,
    description: 'Explore VIDA. Vois tout, prends des micro-actions. Gains en Points VIDA uniquement.',
  },
  premium: {
    label: 'VIDA Premium',
    price_month: 990, // 9.90€
    price_year: 7990, // 79.90€ (-33%)
    daily_ai_messages: -1,
    missions_per_day: -1,
    can_withdraw_cash: true,
    trial_days: 14,
    description: 'Accès complet. Argent réel, missions payées, rituels, communauté, redistribution mensuelle.',
  },
} as const

export const WALLET_MIN_WITHDRAWAL = 5
export const WALLET_MAX_WITHDRAWAL = 1000
export const ASSO_PERCENTAGE = 10
export const REWARD_POOL_PERCENTAGE = 10

export const XP_ACTIONS = {
  daily_login: 10,
  onboarding_complete: 100,
  first_action: 50,
  mission_completed: 50,
  ritual_participation: 30,
  streak_day: 10,
  streak_7: 50,
  streak_30: 200,
  streak_90: 500,
  streak_365: 2000,
  referral_signup: 200,
  referral_paid: 300,
  first_review: 20,
  store_review: 500,
  feedback_sent: 200,
  share_first_day: 100,
  share_via_conversion: 500,
  challenge_completed: 500,
  donation_made: 100,
  buddy_checkin: 10,
  love_letter_sent: 500,
  community_post: 20,
} as const

export const VIDA_LEVELS = [
  { min: 0, max: 100, title: 'Graine 🌱', description: "Tu viens de planter une graine. Tout commence." },
  { min: 101, max: 500, title: 'Pousse 🌿', description: 'Tu pousses doucement. Le rythme trouve sa place.' },
  { min: 501, max: 1500, title: 'Arbre 🌳', description: 'Tu es enraciné. Ton impact est visible.' },
  { min: 1501, max: 5000, title: 'Forêt 🌲', description: 'Tu inspires ton cercle. Un écosystème grandit.' },
  { min: 5001, max: 15000, title: 'Rivière 🌊', description: 'Tu coules librement. La vie suit ton chemin.' },
  { min: 15001, max: 50000, title: 'Océan 🌍', description: 'Tu portes un monde. Ton impact traverse les frontières.' },
  { min: 50001, max: Number.MAX_SAFE_INTEGER, title: 'Gardien de la Terre ✨', description: 'Tu es devenu gardien. Tu protèges ce qui vit.' },
] as const

export const PUBLIC_ROUTES = [
  '/', '/pricing', '/how-it-works', '/ecosystem', '/status', '/changelog',
  '/privacy', '/terms', '/legal', '/offline', '/login', '/signup', '/register',
  '/onboarding', '/mentions-legales', '/politique-confidentialite', '/cgv', '/cgu',
  '/cookies', '/contact', '/aide', '/manifeste',
]

// IA interne — jamais dit Claude, jamais dit IA
export const AI_MODELS = [
  { id: 'vida-sage', name: 'VIDA', provider: 'vida', badge: 'LIVE', color: '#10B981', description: 'Ta compagne vivante' },
] as const

// Impact engine — conversion action → impact réel
export const IMPACT_CONVERSIONS = {
  subscription_activated: { trees_funded: 1, waste_removed_g: 750, co2_saved_kg: 2 },
  mission_ecology: { waste_removed_g: 500, co2_saved_kg: 1 },
  mission_tree: { trees_funded: 1 },
  mission_water: { water_protected_l: 10 },
  mission_human: { people_helped: 1 },
  streak_30: { water_protected_l: 15, co2_saved_kg: 5 },
  purchase_product: { trees_funded: 0.5, co2_saved_kg: 1 },
  donation_eur: { multiplier_trees: 0.1, multiplier_waste_g: 100 },
} as const

// Rituels hebdomadaires rotatifs
export const WEEKLY_RITUALS = [
  { theme: 'depollution', title: 'Dépollution collective', emoji: '🌊', description: 'Nous agissons ensemble pour retirer les déchets.' },
  { theme: 'peace', title: 'Paix mondiale', emoji: '🕊️', description: 'Nous envoyons de la paix là où elle manque.' },
  { theme: 'love', title: 'Amour universel', emoji: '💛', description: "Nous tissons un fil d'amour entre les humains." },
  { theme: 'forgiveness', title: 'Pardon', emoji: '🙏', description: 'Nous relâchons ce qui pèse. Nous libérons.' },
  { theme: 'gratitude', title: 'Gratitude', emoji: '✨', description: 'Nous remercions pour ce qui est déjà là.' },
  { theme: 'abundance', title: 'Abondance', emoji: '🌟', description: "Nous accueillons ce qui nous est destiné." },
] as const

export const ONBOARDING_QUESTIONS = [
  {
    id: 'objective',
    question: 'Qu\'est-ce qui est vivant en toi en ce moment ?',
    options: [
      { id: 'calm', label: 'Je veux retrouver du calme', emoji: '🧘' },
      { id: 'energy', label: "Je veux plus d'énergie", emoji: '⚡' },
      { id: 'sleep', label: 'Je veux mieux dormir', emoji: '🌙' },
      { id: 'impact', label: 'Je veux contribuer au monde', emoji: '🌍' },
      { id: 'focus', label: 'Je veux me concentrer', emoji: '🎯' },
      { id: 'heal', label: 'Je veux me soigner naturellement', emoji: '🌿' },
    ],
  },
  {
    id: 'interest',
    question: 'Ce qui te parle le plus aujourd\'hui ?',
    options: [
      { id: 'health', label: 'Santé holistique', emoji: '💚' },
      { id: 'ecology', label: 'Écologie & planète', emoji: '🌱' },
      { id: 'community', label: 'Communauté & entraide', emoji: '🤝' },
      { id: 'mind', label: 'Esprit & conscience', emoji: '🧠' },
      { id: 'body', label: 'Corps & mouvement', emoji: '🏃' },
      { id: 'nature', label: 'Nature & ancrage', emoji: '🌳' },
    ],
  },
  {
    id: 'rhythm',
    question: 'Le rythme que tu veux offrir à ton corps ?',
    options: [
      { id: 'slow', label: 'Doux et lent', emoji: '🌿' },
      { id: 'balanced', label: 'Équilibré', emoji: '⚖️' },
      { id: 'dynamic', label: 'Dynamique', emoji: '🔥' },
      { id: 'intuitive', label: 'Intuitif — sans pression', emoji: '🌊' },
    ],
  },
] as const

export const SIXTEEN_LOCALES = [
  'fr', 'en', 'es', 'de', 'it', 'pt', 'ar', 'zh',
  'ja', 'ko', 'hi', 'ru', 'tr', 'nl', 'pl', 'sv',
] as const

export const isSuperAdmin = (email: string | null | undefined): boolean =>
  email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
