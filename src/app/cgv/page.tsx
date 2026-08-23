import type { Metadata } from 'next'
import { buildCGV } from '@/lib/legal/content/cgv'
import { CURRENT_LEGAL_VERSIONS } from '@/lib/legal/versions'
import { VIDA_LEGAL_CONFIG } from '@/lib/legal/vida-config'
import LegalPage from '@/lib/legal/components/LegalPage'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — VIDA',
  description: 'CGV de VIDA par SASU PURAMA.',
}

export default function CGV() {
  return (
    <LegalPage
      titre="Conditions Générales de Vente"
      sections={buildCGV(VIDA_LEGAL_CONFIG)}
      derniereMiseAJour={`Version ${CURRENT_LEGAL_VERSIONS.cgv} — 23 août 2026`}
    />
  )
}
