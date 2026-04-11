import Link from 'next/link'
import { ArrowLeft, MessageSquare, Sparkles, Bot, Zap, Users, BarChart3 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Comment ca marche — VIDA',
  description: 'Decouvre comment utiliser VIDA, l agregateur multi-IA',
}

const STEPS = [
  {
    icon: MessageSquare,
    color: '#10B981',
    title: '1. Discute avec l IA',
    description: 'Pose n importe quelle question. VIDA utilise les meilleurs modeles IA pour te donner des reponses precises et detaillees.',
  },
  {
    icon: Sparkles,
    color: '#a855f7',
    title: '2. Cree du contenu',
    description: 'Genere des images, videos, musiques et code. Notre Studio Creatif met la puissance de l IA generative a ta portee.',
  },
  {
    icon: Bot,
    color: '#f59e0b',
    title: '3. Cree tes agents',
    description: 'Personnalise des assistants IA pour tes besoins specifiques. Marketing, developpement, design — ton equipe IA sur mesure.',
  },
  {
    icon: Zap,
    color: '#10b981',
    title: '4. Automatise',
    description: 'Configure des workflows automatises qui tournent en arriere-plan. Gagne des heures chaque semaine.',
  },
  {
    icon: Users,
    color: '#ec4899',
    title: '5. Collabore',
    description: 'Invite ton equipe dans des espaces partages. Travaillez ensemble avec l IA en temps reel.',
  },
  {
    icon: BarChart3,
    color: '#6366f1',
    title: '6. Analyse',
    description: 'Suis ta progression, tes usages et tes performances. Optimise ton utilisation de l IA.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--cyan)]">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Comment ca marche</h1>
        <p className="mt-2 text-lg text-[var(--text-secondary)]">
          VIDA reunit plusieurs IA dans une interface unique. 6 etapes pour tout maitriser.
        </p>

        <div className="mt-12 space-y-8">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-6">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${step.color}15` }}
              >
                <step.icon className="h-7 w-7" style={{ color: step.color }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{step.title}</h2>
                <p className="mt-1 text-[var(--text-secondary)] leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] px-8 py-4 text-lg font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Commencer gratuitement
          </Link>
        </div>
      </div>
    </div>
  )
}
