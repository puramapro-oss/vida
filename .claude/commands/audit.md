---
description: Audit sécurité + perf VIDA
---

1. Invoke `security-agent` (rapport critiques/hautes/moyennes)
2. Lighthouse 3 pages critiques : `/`, `/pricing`, `/dashboard`
   - `npx lhci autorun --collect.url=https://vida.purama.dev --collect.url=https://vida.purama.dev/pricing`
   - Seuils : Performance > 90, Accessibility > 90, SEO > 90
3. `npm audit --production` → 0 critique/haute
4. Bundle size : `npx next-bundle-analyzer` → chaque page < 200 KB gzip
5. Rapport : scores Lighthouse par page + issues sécurité + pages trop lourdes.
