'use client'

import { useRouter } from 'next/navigation'
import { LegalReacceptanceGate, type LegalDocType } from '@/lib/legal'
import { APP_NAME } from '@/lib/constants'

/**
 * Monte le socle légal `LegalReacceptanceGate` dans `(dashboard)/layout.tsx` — corrige
 * CONFORMITE.md Gap #10 (composant complet mais jamais monté). `docsEnAttente` est calculé
 * côté serveur (comparaison `legal_acceptances` vs `CURRENT_LEGAL_VERSIONS`) et passé en
 * prop ; `onAccept` poste l'acceptation puis rafraîchit la page serveur pour recalculer.
 */
export default function LegalGateMount({ docsEnAttente }: { docsEnAttente: LegalDocType[] }) {
  const router = useRouter()

  async function onAccept(docType: LegalDocType) {
    const res = await fetch('/api/legal/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docType }),
    })
    if (!res.ok) throw new Error('accept_failed')
    router.refresh()
  }

  return <LegalReacceptanceGate appName={APP_NAME} docsEnAttente={docsEnAttente} onAccept={onAccept} />
}
