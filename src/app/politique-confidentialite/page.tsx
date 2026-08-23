import type { Metadata } from 'next'
import { buildPolitiqueConfidentialite } from '@/lib/legal/content/politique-confidentialite'
import { CURRENT_LEGAL_VERSIONS } from '@/lib/legal/versions'
import { VIDA_LEGAL_CONFIG } from '@/lib/legal/vida-config'
import LegalPage from '@/lib/legal/components/LegalPage'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — VIDA',
  description: 'Politique de confidentialité et protection des données personnelles de VIDA.',
}

export default function PolitiqueConfidentialite() {
  return (
    <LegalPage
      titre="Politique de Confidentialité"
      sections={buildPolitiqueConfidentialite(VIDA_LEGAL_CONFIG, process.env)}
      derniereMiseAJour={`Version ${CURRENT_LEGAL_VERSIONS.confidentialite} — 23 août 2026`}
    />
  )
}
