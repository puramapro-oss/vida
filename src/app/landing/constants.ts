import {
  BookHeart,
  Globe,
  Sparkles,
  Footprints,
  HandHeart,
  Wind,
  Heart,
  MapPin,
  Trophy,
} from 'lucide-react'

export const PILIERS = [
  {
    icon: BookHeart,
    title: 'Ton Fil de Vie',
    desc: 'Chaque geste, chaque souffle, chaque don devient une page vivante. Ton histoire s\'écrit — tu la relis quand tu veux.',
  },
  {
    icon: Globe,
    title: 'Carte vivante',
    desc: 'Ta graine rejoint celles des autres sur une carte mondiale. Tu vois, en temps réel, les liens que tu tisses.',
  },
  {
    icon: Sparkles,
    title: 'Rituels collectifs',
    desc: 'Chaque dimanche soir, un rituel mondial. Respirer, remercier, poser une intention — ensemble, au même instant.',
  },
]

export const ACTIONS = [
  { icon: Footprints, title: 'Marcher', desc: '10 000 pas = 1 graine plantée, validée par HealthKit ou Health Connect.' },
  { icon: HandHeart, title: 'Donner', desc: 'Don de sang, bénévolat, mission écologique — preuve en photo GPS.' },
  { icon: Wind, title: 'Respirer', desc: 'Cycle 4-7-8 guidé. 3 minutes par jour, streak quotidien, récompenses.' },
  { icon: Heart, title: 'Remercier', desc: 'Journal de gratitude. 3 lignes par soir — tu verras la courbe monter.' },
  { icon: MapPin, title: 'Partager', desc: 'Ta mission devient visible sur la carte. D\'autres viennent t\'épauler.' },
  { icon: Trophy, title: 'Célébrer', desc: 'Paliers, confettis, cartes partageables. Tes victoires sont réelles.' },
]

export const COMMENT = [
  { num: '01', title: 'Tu t\'inscris', desc: '14 jours offerts. Sans carte. Onboarding 10 secondes, chaleureux, sans jugement.' },
  { num: '02', title: 'Tu vis', desc: 'Tu marches, tu donnes, tu respires. VIDA transforme chaque geste en trace.' },
  { num: '03', title: 'Tu vois', desc: 'Ton Fil de Vie se remplit. La carte s\'éclaire. Le dimanche, le monde respire avec toi.' },
]

export const FAQ = [
  {
    q: 'VIDA, c\'est quoi au juste ?',
    a: 'Une appli qui transforme tes actions réelles — marcher, donner, respirer, planter — en un Fil de Vie visible, partageable, relié à une communauté mondiale qui agit avec toi.',
  },
  {
    q: 'Ça remplace une appli santé ?',
    a: 'Non. VIDA lit tes données HealthKit / Health Connect et leur donne un sens. Tes pas deviennent des graines. Ton sommeil devient une respiration du monde.',
  },
  {
    q: 'Pourquoi payer ?',
    a: 'La version gratuite donne l\'essentiel. Premium débloque missions rémunérées, Fil de Vie illimité, rituels privés, wallet retirable dès 5€. 10% du chiffre va à l\'association.',
  },
  {
    q: 'Mes données sont-elles protégées ?',
    a: 'Oui. Hébergement européen, RLS sur chaque table, zéro revente, export et suppression en un clic. RGPD strict.',
  },
]
