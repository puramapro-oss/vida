'use client'

import { CookieConsentBanner, type CookieConsent } from '@/lib/legal'
import { APP_NAME } from '@/lib/constants'

/**
 * Monte le socle légal `CookieConsentBanner` (remplace `components/shared/CookieBanner.tsx`,
 * un bandeau binaire localStorage-only qui ne synchronisait jamais en base — corrige
 * CONFORMITE.md Gap #1). `onConsent` synchronise le choix en base via
 * `POST /api/legal/cookie-consent` une fois l'utilisateur authentifié (best-effort côté
 * visiteur anonyme : l'endpoint répond `{ok:true, synced:false}` sans écrire).
 */
export default function CookieConsentMount() {
  function onConsent(consent: CookieConsent) {
    fetch('/api/legal/cookie-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mesure: consent.mesure, marketing: consent.marketing }),
    }).catch(() => {
      // Best-effort : le choix reste appliqué en localStorage même si la synchro échoue.
    })
  }

  return <CookieConsentBanner appName={APP_NAME} politiqueHref="/politique-confidentialite" onConsent={onConsent} />
}
