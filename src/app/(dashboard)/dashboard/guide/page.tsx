'use client'

import { useState } from 'react'
import { Footprints, HandHeart, Wind, Heart, Share2, Trophy, Users, Calendar, ChevronRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import { cn } from '@/lib/utils'

type Guide = {
  id: string
  icon: typeof Footprints
  title: string
  color: string
  intro: string
  steps: string[]
}

// V7 — VIDA (wellness/impact). Guide = 8 gestes clés. 5-7 steps chacun.
const GUIDES: Guide[] = [
  {
    id: 'marcher',
    icon: Footprints,
    title: 'Marcher',
    color: '#10B981',
    intro: 'Chaque pas devient une graine plantée.',
    steps: [
      'Ouvre VIDA, autorise HealthKit (iOS) ou Health Connect (Android)',
      'Tes pas se synchronisent toutes les heures en arrière-plan',
      'À 5 000 pas, reçois 0,25 € Nature Reward (crédité wallet)',
      'À 10 000 pas, reçois 0,75 € et une animation de célébration',
      'Combine 5+ catégories dans la journée pour activer le multiplicateur ×1,5',
      'Retrouve tes graines sur la carte mondiale — elles apparaissent en temps réel',
    ],
  },
  {
    id: 'donner',
    icon: HandHeart,
    title: 'Donner',
    color: '#34d399',
    intro: 'Don de sang, bénévolat, ou geste écologique — chaque acte compte.',
    steps: [
      'Va dans Missions → filtre "Paid" ou "Écologie"',
      'Choisis une mission qui résonne avec toi',
      'Photo GPS ou QR code selon la preuve demandée',
      'L\'IA Guardian valide ta preuve en moins de 24h',
      'Récompense créditée wallet automatiquement (3 € à 10 €)',
      'Ton geste apparaît sur la carte — d\'autres peuvent te rejoindre',
    ],
  },
  {
    id: 'respirer',
    icon: Wind,
    title: 'Respirer',
    color: '#14b8a6',
    intro: 'Cycle 4-7-8 guidé. 3 minutes par jour suffisent.',
    steps: [
      'Ouvre Respirer depuis la sidebar ou les tabs mobiles',
      'Inspire 4 secondes, retiens 7, expire 8 — le cercle t\'accompagne',
      'Fais 3 cycles par session. Le son et la vibration guident',
      '+0,30 € Nature Reward par session complétée',
      'Débloque un streak après 7 jours consécutifs (×2 récompenses)',
      'Sans interaction : la session continue seule si tu fermes les yeux',
    ],
  },
  {
    id: 'remercier',
    icon: Heart,
    title: 'Remercier',
    color: '#f472b6',
    intro: 'Journal de gratitude. 3 lignes par soir — la courbe monte.',
    steps: [
      'Ouvre Gratitude chaque soir (notification douce 21h)',
      'Écris 3 phrases : une chose belle, une personne, un apprentissage',
      '+100 XP par entrée — ton niveau d\'éveil progresse',
      'Relis tes anciennes entrées — tu verras un chemin apparaître',
      'Après 30 jours, VIDA te propose un résumé personnel',
      'Option : partager une gratitude sur le mur d\'amour (anonyme ou signée)',
    ],
  },
  {
    id: 'rituels',
    icon: Calendar,
    title: 'Rituels du dimanche',
    color: '#a855f7',
    intro: 'Chaque dimanche soir, un rituel collectif mondial.',
    steps: [
      'Dimanche 20h (heure locale) : notification "Rituel ce soir"',
      'Rejoins en 1 tap — tu vois le nombre de participants en temps réel',
      'Respire, remercie, pose une intention — ensemble, au même instant',
      'Participation = +500 XP + 1 ticket jeu-concours',
      'Visible sur la carte : des graines collectives fleurissent partout',
      '30 minutes — puis retour à ta soirée, porté par le groupe',
    ],
  },
  {
    id: 'communaute',
    icon: Users,
    title: 'Cercles & Buddies',
    color: '#f59e0b',
    intro: 'Pas seul·e. Jamais.',
    steps: [
      'Rejoins un Cercle selon ton objectif (5-12 personnes max)',
      'L\'IA matche un Buddy avec toi — check-in quotidien, duo ×2 XP',
      'Mur d\'amour : partage tes victoires, encouragements, milestones',
      'Modération IA 24/7 : 0 toxicité, 100% soutien',
      'Cérémonies victoire chaque vendredi — shoutouts mutuels',
      'Si tu craques, tu reçois une lettre de ton Buddy — auto-générée par IA',
    ],
  },
  {
    id: 'parrainage',
    icon: Share2,
    title: 'Partager VIDA',
    color: '#06b6d4',
    intro: 'Tu récoltes ce que tu sèmes. Jusqu\'à 200 000 €.',
    steps: [
      'Dashboard → bloc Parrainage → copie ton lien unique + QR',
      'Partage via WhatsApp, Instagram Story ou de la main à la main',
      'Filleul s\'inscrit → 25 € prime lui sont offerts + tu reçois 50% à vie',
      'Après 30 jours d\'activité réelle, la commission se déclenche (anti-fraude)',
      'Niveau 2 : tes filleuls parrainent → tu touches 15% sur leurs filleuls',
      'Niveau 3 : tu touches 7% sur les filleuls de tes filleuls — à vie',
      'Passe Ambassadeur dès 10 filleuls (Bronze 200 €) → Éternel (200 k€)',
    ],
  },
  {
    id: 'celebrer',
    icon: Trophy,
    title: 'Célébrer',
    color: '#eab308',
    intro: 'Tes victoires sont réelles. Les fêter aussi.',
    steps: [
      'Paliers débloqués = animation plein écran + son cristallin',
      'Cartes partageables générées automatiquement (Instagram, TikTok)',
      'Jeu-concours hebdo : Top 10 performances = prime trimestrielle',
      'Tirage mensuel : 1 ticket gratuit pour chaque palier atteint',
      'Coffre du jour : 1 cadeau quotidien garanti (coupon, points, tickets)',
      'Magic Moment : ton premier retrait = animation perso + badge éternel',
    ],
  },
]

export default function GuidePage() {
  const [activeGuide, setActiveGuide] = useState(GUIDES[0].id)

  const guide = GUIDES.find((g) => g.id === activeGuide) ?? GUIDES[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-light tracking-tight text-[var(--text-primary)]">
          Guide VIDA
        </h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          8 gestes. Une pratique. Un chemin qui se révèle.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="space-y-1">
          {GUIDES.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGuide(g.id)}
              data-testid={`guide-tab-${g.id}`}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
                activeGuide === g.id
                  ? 'bg-white/10 text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/5',
              )}
            >
              <g.icon className="h-5 w-5 shrink-0" style={{ color: g.color }} />
              <span className="truncate">{g.title}</span>
              {activeGuide === g.id && <ChevronRight className="ml-auto h-4 w-4 shrink-0" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <Card className="lg:col-span-3 p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl shrink-0"
              style={{ backgroundColor: `${guide.color}1a` }}
            >
              <guide.icon className="h-7 w-7" style={{ color: guide.color }} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{guide.title}</h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{guide.intro}</p>
            </div>
          </div>
          <ol className="space-y-4">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: `${guide.color}1a`, color: guide.color }}
                >
                  {i + 1}
                </div>
                <p className="pt-1 text-[var(--text-primary)] leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  )
}
