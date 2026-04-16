---
description: Deploy VIDA en prod avec QA+Security auto
---

1. Invoque `qa-agent` → attends VERDICT `DEPLOY OK`
2. Invoque `security-agent` → attends VERDICT `PROD OK`
3. `npm run build` → 0 erreur
4. `vercel --prod --token $VERCEL_TOKEN --scope puramapro-oss --yes`
5. Teste URL prod : `curl -I https://vida.purama.dev` → 200
6. Rapport : URL live + deployment ID + status

Si QA OU Security BLOQUÉ → STOP, NE deploy PAS. Affiche les bloquants.
