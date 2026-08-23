import type { Metadata } from 'next'
import { buildMentionsLegales } from '@/lib/legal/content/mentions-legales'
import { CURRENT_LEGAL_VERSIONS } from '@/lib/legal/versions'
import { VIDA_LEGAL_CONFIG } from '@/lib/legal/vida-config'
import LegalPage from '@/lib/legal/components/LegalPage'

export const metadata: Metadata = {
  title: 'Mentions Légales — VIDA',
  description: 'Mentions légales de VIDA par SASU PURAMA.',
}

export default function MentionsLegales() {
  return (
    <LegalPage
      titre="Mentions Légales"
      sections={buildMentionsLegales(VIDA_LEGAL_CONFIG)}
      derniereMiseAJour={`Version ${CURRENT_LEGAL_VERSIONS.mentions} — 23 août 2026`}
    />
  )
}
