# VIDA — Progress log

## 2026-04-11 — P1 COMPLET → LIVE

**Deploy**: https://vida.purama.dev — HTTP 200 — dpl_FnbBARJoZ5516sNqMxmPrV25AFpF
**Commit**: `5950894 P1: VIDA foundation — auth, schema, pricing, onboarding, stripe`

### Approche
Cloné le template akasha-ai (LEARNING 2026-04-06 MOKSHA : template accélère 10×). Rebrand systématique (sed macOS BSD sans `\b`) puis réécriture des fichiers qui référençaient AKASHA-specific (PlanTier automate/create/build/complete, XP_TITLES, Achievement, Commission, display_name, is_read, accent_color, daily_questions, level, xp).

### Fichiers touchés / créés
- `src/lib/constants.ts` — rewritten (VIDA plans, VIDA_LEVELS 7 niveaux, ONBOARDING_QUESTIONS 3×6, IMPACT_CONVERSIONS, WEEKLY_RITUALS 6 thèmes)
- `src/types/index.ts` — rewritten (Profile, Mission, ImpactEvent, LifeThread, Subscription, Referral, Contest, CommunityPost, WeeklyRitual, Notification, Product, Order, Conversation, Message, Withdrawal, FaqArticle, …)
- `src/app/layout.tsx` — Syne font, VIDA metadata, green toaster
- `src/app/globals.css` — Emerald theme complet (#10B981 + #84cc16 sage + aurora green, breathe animation, vida-pulse-dot, impact-counter, vida-chip, vida-nature-bg)
- `src/app/pricing/page.tsx` — rewritten (Découverte free + Premium, month/year toggle, 14j essai, asso 10%)
- `src/app/onboarding/page.tsx` — rewritten (3 swipe questions : objective/interest/rhythm, progress bar, plan généré localement, +1 graine plantée)
- `src/app/api/stripe/checkout/route.ts` — rewritten (period param, 14j trial, subscription_data)
- `src/app/api/stripe/webhook/route.ts` — rewritten (trialing/active/canceled, pool distribution 10% reward + 10% asso)
- `src/app/api/chat/route.ts` — rewritten (VIDA system prompt, daily_ai_messages quota, conversations/messages new schema)
- `src/lib/claude.ts` — rewritten (Plan = free|premium, VIDA system prompt chaleureux, lazy init, askClaudeJSON)
- `src/lib/stripe.ts` — lazy init getStripe()
- `src/lib/stripe-prices.ts` — 1 abo depuis env vars
- `src/components/ui/Button.tsx` — + fullWidth prop
- `schema.sql` — 1014 lignes : 45 tables + RLS + trigger handle_new_user + 15 missions seed + 5 products + 15 FAQ
- `.env.local` — VIDA URL + Stripe price IDs + webhook secret

### Fichiers / dossiers supprimés (AKASHA-specific)
- `src/app/(dashboard)/dashboard/{agents,analytics,api,automation,collab,studio,tools,xp,marketplace,admin,chat,achievements,invoices}`
- `src/app/api/{agents,generate,v1,admin,quota}`
- `src/lib/{preset-agents,tools-catalog}.ts`
- `src/app/(dashboard)/dashboard/chat` (page AKASHA multi-model, sera rebuild en VIDA chat)

### Infrastructure
- Schema vida_sante : `docker exec supabase-db psql` (pooler refuse)
- `vida_sante` ajouté à `PGRST_DB_SCHEMAS` + `docker compose up -d --force-recreate rest`
- Stripe product `prod_UJS84CrpuVWoKm` + prix month (990¢) + year (7990¢) + webhook
- Vercel project puramapro-oss-projects/vida lié
- 38 env vars pushées production
- Domain vida.purama.dev attaché

### Ce qui fonctionne MAINTENANT
- https://vida.purama.dev HTTP 200
- Auth email+OAuth (via auth.purama.dev wildcard déjà configuré VPS)
- Signup → création profil via trigger `handle_new_user` (référral_code `VIDA<6hex>`)
- /pricing → Stripe Checkout → trial 14j → webhook → subscription_status='trialing'
- /onboarding (3 swipes) → 1ère entrée life_thread "Début du chemin" +100 XP
- 48 routes buildées
- lib/claude.ts avec VIDA system prompt vivant chaleureux
- pool_balances seed (reward, asso, partner)
- 15 missions actives dans DB
- 5 produits boutique dans DB
- 15 articles FAQ dans DB

### Ce qui reste à faire (voir task_plan.md)
P2 à P8 — landing VIDA manifeste, dashboard vivant, Fil de Vie, carte mondiale, missions UI, rituels, communauté, boutique, dons, admin, i18n, mobile Expo, Apple Watch + Wear OS.

### Limitations / notes pour la session suivante
1. **GitHub repo pas créé** : le PAT `puramapro-oss` est fine-grained et refuse `POST /orgs/.../repos` avec "Not Found" et `POST /user/repos` avec "Resource not accessible". À faire manuellement ou avec un nouveau PAT (classic). Deploy Vercel marche malgré tout (direct push).
2. **Dashboard (/dashboard/page.tsx) inchangé** depuis le template AKASHA — affiche "daily_questions" etc. qui ne correspond plus à VIDA. Fonctionne mais à rebuild en P2.
3. **Landing (/page.tsx) inchangée** — AKASHA-style (47+ outils IA). À remplacer par la cinématique VIDA en P2.
4. Sidebar/BottomTab items reflètent encore structure AKASHA (agents, studio). Nav fonctionne mais labels à corriger.
5. Pages `/dashboard/{classement,concours,daily-gift,guide,influenceur,notifications,partage,profile,referral,settings,tirage,wallet}` : héritées, build OK, UX à adapter au ton VIDA en P3.
6. `tests/*.spec.ts` existent mais ciblent l'ancien baseURL — à adapter en P6.

### Prochaine session (P2)
1. Lire `~/purama/vida/task_plan.md` + `progress.md` + `~/purama/ERRORS.md` + `~/purama/PATTERNS.md`
2. `cd ~/purama/vida && npx tsc --noEmit && npm run build` → vérifier compile
3. Commencer P2 : rebuild `/app/page.tsx` (landing VIDA manifeste) + `/dashboard/page.tsx` (dashboard vivant) + nouvelles routes univers/carte/missions/rituels
4. Ne JAMAIS recoder ce qui marche. Ne JAMAIS casser l'existant.
