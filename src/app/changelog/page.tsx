import Link from 'next/link'
import { ArrowLeft, Sparkles, Bug, Zap } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Changelog — VIDA',
  description: 'Historique des mises a jour VIDA',
}

const ENTRIES = [
  {
    date: '9 avril 2026',
    version: 'v2.0',
    changes: [
      { type: 'feature', text: 'Systeme de parrainage complet (Bronze a Legende)' },
      { type: 'feature', text: 'Wallet avec retrait IBAN des 5 EUR' },
      { type: 'feature', text: 'Succes et achievements (15 succes)' },
      { type: 'feature', text: 'Page profil avec statistiques' },
      { type: 'feature', text: 'Centre de notifications' },
      { type: 'feature', text: 'Classement XP global' },
      { type: 'feature', text: 'Centre d aide avec FAQ' },
      { type: 'feature', text: 'Ecosysteme Purama (cross-promo)' },
      { type: 'feature', text: 'Page contact' },
      { type: 'feature', text: 'Page statut des services' },
      { type: 'improvement', text: 'Sidebar enrichie avec plus de navigation' },
      { type: 'improvement', text: 'Schema DB V3 complet' },
    ],
  },
  {
    date: '1 avril 2026',
    version: 'v1.0',
    changes: [
      { type: 'feature', text: 'Chat IA multi-modeles (Sonnet, Opus, Haiku)' },
      { type: 'feature', text: 'Studio Creatif (images, videos, audio, code)' },
      { type: 'feature', text: 'Agents IA personnalises + Marketplace' },
      { type: 'feature', text: 'Automatisation de workflows' },
      { type: 'feature', text: 'Espaces de collaboration' },
      { type: 'feature', text: 'Systeme XP & Badges' },
      { type: 'feature', text: 'API Console' },
      { type: 'feature', text: 'Stripe: 4 plans x 3 tiers' },
      { type: 'feature', text: 'Auth email + Google OAuth' },
      { type: 'feature', text: 'Landing page 13 sections' },
    ],
  },
]

const TYPE_ICONS = {
  feature: Sparkles,
  bugfix: Bug,
  improvement: Zap,
}
const TYPE_COLORS = {
  feature: '#10B981',
  bugfix: '#ef4444',
  improvement: '#f59e0b',
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--cyan)]">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Changelog</h1>
        <p className="mt-2 text-[var(--text-secondary)]">Historique des mises a jour VIDA</p>

        <div className="mt-8 space-y-10">
          {ENTRIES.map(entry => (
            <div key={entry.version}>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-[var(--cyan)]/10 px-3 py-1 text-sm font-bold text-[var(--cyan)]">{entry.version}</span>
                <span className="text-sm text-[var(--text-secondary)]">{entry.date}</span>
              </div>
              <ul className="mt-4 space-y-2">
                {entry.changes.map((change, i) => {
                  const Icon = TYPE_ICONS[change.type as keyof typeof TYPE_ICONS] ?? Sparkles
                  const color = TYPE_COLORS[change.type as keyof typeof TYPE_COLORS] ?? '#888'
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} />
                      <span className="text-sm text-[var(--text-primary)]">{change.text}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
