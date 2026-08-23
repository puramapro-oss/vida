import type { Metadata } from 'next'
import { buildCGU } from '@/lib/legal/content/cgu'
import { CURRENT_LEGAL_VERSIONS } from '@/lib/legal/versions'
import { VIDA_LEGAL_CONFIG } from '@/lib/legal/vida-config'
import LegalPage from '@/lib/legal/components/LegalPage'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — VIDA",
  description: 'CGU de VIDA par SASU PURAMA.',
}

export default function CGU() {
  return (
    <LegalPage
      titre="Conditions Générales d'Utilisation"
      sections={buildCGU(VIDA_LEGAL_CONFIG)}
      derniereMiseAJour={`Version ${CURRENT_LEGAL_VERSIONS.cgu} — 23 août 2026`}
    />
  )
}
