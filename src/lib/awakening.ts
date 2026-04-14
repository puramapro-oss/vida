// VIDA — Awakening layer
// Helpers pour affirmations, niveaux d'éveil, citations, tracking.

export type AwakeningCategory = 'love' | 'power' | 'abundance' | 'health' | 'wisdom' | 'gratitude'
export type AwakeningEventType = 'affirmation' | 'breath' | 'gratitude' | 'intention' | 'meditation' | 'ritual'

export interface Affirmation {
  id: string
  category: AwakeningCategory
  text_fr: string
  text_en: string | null
}

// Niveaux d'éveil (XP → level)
export const AWAKENING_LEVELS = [
  { level: 1,   title: 'Éveillé',       min_xp: 0 },
  { level: 5,   title: 'Conscient',     min_xp: 500 },
  { level: 10,  title: 'Aligné',        min_xp: 2000 },
  { level: 20,  title: 'Illuminé',      min_xp: 6000 },
  { level: 50,  title: 'Transcendant',  min_xp: 20000 },
  { level: 100, title: 'Unifié',        min_xp: 100000 },
] as const

export function levelFromXp(xp: number): { level: number; title: string } {
  let level = AWAKENING_LEVELS[0].level as number
  let title = AWAKENING_LEVELS[0].title as string
  for (const l of AWAKENING_LEVELS) {
    if (xp >= l.min_xp) { level = l.level; title = l.title }
  }
  return { level, title }
}

// XP gagné par type d'événement
export const AWAKENING_XP: Record<AwakeningEventType, number> = {
  affirmation: 10,
  breath: 50,
  gratitude: 100,
  intention: 25,
  meditation: 150,
  ritual: 300,
}

// Citations footer (rotation 30min)
export const WISDOM_QUOTES: { author: string; text: string }[] = [
  { author: 'Rumi',             text: 'Ce que tu cherches te cherche aussi.' },
  { author: 'Lao Tseu',         text: 'Le voyage de mille lieues commence par un pas.' },
  { author: 'Marc Aurèle',      text: 'La meilleure vengeance est de ne pas ressembler à celui qui t\'a blessé.' },
  { author: 'Bouddha',          text: 'Tout ce que nous sommes est le résultat de nos pensées.' },
  { author: 'Osho',             text: 'Vous n\'êtes pas une goutte dans l\'océan. Vous êtes l\'océan dans une goutte.' },
  { author: 'Alan Watts',       text: 'Tu es l\'univers qui se vit lui-même.' },
  { author: 'Eckhart Tolle',    text: 'La vie te donne toujours l\'expérience la plus utile à l\'évolution de ta conscience.' },
  { author: 'Thich Nhat Hanh',  text: 'Grâce à mon sourire, je sais que je suis vivant.' },
  { author: 'Sadhguru',         text: 'Ce n\'est que lorsque tu ne veux rien que tu peux tout voir.' },
  { author: 'Anaïs Nin',        text: 'Le jour viendra où le risque de rester dans un bourgeon sera plus douloureux que celui d\'éclore.' },
  { author: 'Carl Jung',        text: 'Je ne suis pas ce qui m\'est arrivé. Je suis ce que je choisis de devenir.' },
  { author: 'Marcus Aurelius',  text: 'Ton âme prend la couleur de tes pensées.' },
]

export function getQuoteForSlot(slotMinutes = 30): { author: string; text: string } {
  const slot = Math.floor(Date.now() / (slotMinutes * 60 * 1000))
  return WISDOM_QUOTES[slot % WISDOM_QUOTES.length]
}

// Micro-textes empowering
export const MICRO_TEXTS = {
  loading: 'Ton espace se prépare…',
  error: 'Petit détour, on revient plus fort.',
  empty: 'L\'espace de toutes les possibilités.',
  welcome: 'Bienvenue chez toi.',
  logout: 'À très vite, belle âme.',
  success: 'Tu vois ? Tu es capable de tout.',
  pause: 'Respire.',
} as const

// Pour login modal — une fois par jour max
const LS_KEY = 'vida:affirmation_shown_at'

export function shouldShowAffirmationModal(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const last = window.localStorage.getItem(LS_KEY)
    if (!last) return true
    const ts = parseInt(last, 10)
    const eightHours = 8 * 60 * 60 * 1000
    return Date.now() - ts > eightHours
  } catch {
    return false
  }
}

export function markAffirmationShown(): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(LS_KEY, String(Date.now())) } catch { /* noop */ }
}
