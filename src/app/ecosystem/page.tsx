import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ecosysteme Purama — VIDA',
  description: 'Decouvre toutes les apps de l ecosysteme Purama',
}

const APPS = [
  { name: 'MIDAS', slug: 'midas', color: '#F59E0B', description: 'Trading & Finance IA', icon: '📈' },
  { name: 'SUTRA', slug: 'sutra', color: '#8B5CF6', description: 'Creation Video IA', icon: '🎬' },
  { name: 'KAÏA', slug: 'kaia', color: '#06B6D4', description: 'Meditation & Bien-etre', icon: '🧘' },
  { name: 'VIDA', slug: 'vida_sante', color: '#10B981', description: 'Sante & Nutrition', icon: '💚' },
  { name: 'Lingora', slug: 'lingora', color: '#3B82F6', description: 'Apprentissage Langues', icon: '🌍' },
  { name: 'KASH', slug: 'kash', color: '#F59E0B', description: 'Finances Personnelles', icon: '💰' },
  { name: 'PRANA', slug: 'prana', color: '#F472B6', description: 'Fitness & Sport', icon: '🏋️' },
  { name: 'AETHER', slug: 'aether', color: '#E879F9', description: 'Art & Creativite IA', icon: '🎨' },
  { name: 'EXODUS', slug: 'exodus', color: '#22C55E', description: 'Developpement Personnel', icon: '🌱' },
  { name: 'LUMIOS', slug: 'lumios', color: '#14B8A6', description: 'Conseil Business', icon: '💡' },
  { name: 'JurisPurama', slug: 'jurispurama', color: '#6D28D9', description: 'IA Juridique', icon: '⚖️' },
  { name: 'Origin', slug: 'purama_origin', color: '#D946EF', description: 'Genealogie IA', icon: '🌳' },
  { name: 'MANA', slug: 'mana', color: '#A855F7', description: 'Gestion Budget', icon: '🪙' },
  { name: 'Compta', slug: 'purama_compta', color: '#0EA5E9', description: 'Comptabilite IA', icon: '📊' },
  { name: 'EntreprisePilot', slug: 'entreprise_pilot', color: '#6366F1', description: 'Pilotage Entreprise', icon: '🚀' },
]

export default function EcosystemPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--cyan)]">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Ecosysteme Purama</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Un compte unique, des dizaines d&apos;apps IA specialisees. Utilise VIDA pour tout, ou explore chaque domaine en profondeur.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {APPS.map(app => (
            <div
              key={app.slug}
              className="glass rounded-2xl p-5 transition-all hover:border-[var(--border-glow)] hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{app.icon}</span>
                <div>
                  <h3 className="font-bold" style={{ color: app.color }}>{app.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{app.description}</p>
                </div>
              </div>
              <div className="mt-4">
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-[var(--text-secondary)]">
                  {app.slug}.purama.dev <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Cross-promo CTA */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-[var(--cyan)]/10 to-[var(--purple)]/10 p-8 text-center">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">-50% avec le code CROSS50</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            Utilisateur d&apos;une app Purama ? Profite de -50% sur toutes les autres
          </p>
        </div>
      </div>
    </div>
  )
}
