import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

// CSP scoping réel : seul domaine externe appelé côté navigateur = auth.purama.dev (Supabase).
// Le checkout Stripe est une redirection top-level via window.location.href (hors connect-src).
// 'unsafe-eval' seulement en dev (Fast Refresh React) — jamais en prod.
const scriptSrc = process.env.NODE_ENV === 'production' ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
const CSP = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://auth.purama.dev",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "Content-Security-Policy", value: CSP },
]

const nextConfig: NextConfig = {
  // Package workspace `@purama/smarana` livré en source TS (pas de build step, cf packages/ui) —
  // Next.js n'applique SWC qu'aux packages listés ici, sinon node_modules est ignoré par défaut.
  transpilePackages: ['@purama/smarana'],
  // `@purama/smarana` vit hors de `vida/` (lié par symlink npm `file:../packages/smarana`) —
  // sans ce flag, Next refuse de bundler un module resolu en dehors du dossier racine du projet.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
