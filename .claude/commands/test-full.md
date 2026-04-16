---
description: Checklist 22 points (build + features + API + auth + responsive)
---

Lance checklist complète VIDA :

1. `npx tsc --noEmit` → 0 erreur
2. `npm run build` → 0 erreur
3. `npm run lint` → 0 erreur
4. Chaque feature BRIEF testée (chat, missions, dons, /financer wizard, /fiscal, /subscribe)
5. `curl -sS -o /dev/null -w "%{http_code}\n" https://vida.purama.dev{/,/pricing,/financer,/fiscal,/subscribe,/aide,/login}` → tous 200
6. Auth flow Supabase : inscription + login + logout + session 30j
7. Responsive 375 px (DevTools) → 0 overflow, bottom tab visible
8. Dark/Light toggle change visuellement
9. Switch langue FR↔EN change tous les textes
10. Rapport ✅/❌ par point + commits à faire si ❌.
