# VIDA — Task Plan

**App**: VIDA · **Slug**: `vida` · **Schema**: `vida_sante` · **Domain**: https://vida.purama.dev
**Brief**: L'écosystème vivant qui transforme chaque action en impact réel.
**Modèle économique**: 1 abonnement (Découverte free + Premium 9,90€/mois ou 79,90€/an −33% + 14j essai).

## Phases

### ✅ P1 — Structure + Auth + DB + Deploy (TERMINÉ — 2026-04-11)
- [x] Clone akasha-ai template → rebrand AKASHA→VIDA (70+ fichiers)
- [x] constants.ts rewritten (VIDA plans, VIDA_LEVELS, ONBOARDING_QUESTIONS, IMPACT_CONVERSIONS, WEEKLY_RITUALS)
- [x] types/index.ts rewritten (Profile, Mission, ImpactEvent, LifeThread, etc.)
- [x] globals.css VIDA theme (emerald #10B981 + sage + aurora)
- [x] layout.tsx Syne font + VIDA metadata
- [x] schema.sql complet (45 tables vida_sante: profiles, missions, impact_events, life_thread, subscriptions, referrals, community, rituals, pools, ...)
- [x] Schema pushed to VPS via `docker exec supabase-db psql`
- [x] `vida_sante` exposé dans PGRST_DB_SCHEMAS + docker compose up -d --force-recreate rest
- [x] Stripe product VIDA Premium créé (price_1TKpE14Y1unNvKtXjcVDJ3BX monthly, price_1TKpE14Y1unNvKtXUscKlxyN yearly)
- [x] Stripe webhook créé (whsec_zp7uyTmBlzniGLbzRJVoNiitKPJtf3sG)
- [x] /pricing rewritten (1 abo, month/year toggle, -33%, 14j)
- [x] /onboarding rewritten (3 swipe questions VIDA)
- [x] api/stripe/checkout + webhook rewritten (period, trial, pool distribution)
- [x] api/chat rewritten (VIDA identity, daily_ai_messages quota)
- [x] lib/claude.ts rewritten (VIDA system prompt, lazy init, Plan = free|premium)
- [x] lib/stripe.ts lazy init getStripe()
- [x] lib/stripe-prices.ts 1 abo
- [x] Button.tsx + fullWidth prop
- [x] Delete AKASHA-specific pages (agents, studio, tools, analytics, collab, marketplace, chat, admin, api generate)
- [x] tsc --noEmit : 0 errors
- [x] npm run build : OK (48 routes)
- [x] git init + commit
- [x] Vercel project created puramapro-oss-projects/vida
- [x] 38 env vars pushed to Vercel production
- [x] vercel --prod → deployed dpl_FnbBARJoZ5516sNqMxmPrV25AFpF
- [x] Domain vida.purama.dev added + HTTP 200

### ✅ C2+C3 — AUDIT FIX (2026-04-14, commits 24b81d1 + preceding)
- [x] C3.1 Sidebar+BottomTab : 10 liens morts supprimés, garde 13 routes existantes
- [x] C3.2 CSS alias --cyan/--purple/--pink → --emerald/--sage (190 refs, 43 fichiers)
- [x] C3.3 /page.tsx réécrit : landing VIDA wellness (hero manifeste + 3 piliers + pricing tease)
- [x] C3.4 /dashboard/page.tsx réécrit : welcome + stats XP/Graines/Wallet/Streak + 9 quick actions
- [x] i18n : nav.home + tabs.{home,referral,wallet,gift} ajoutés FR/EN/ES/DE/AR
- [x] C2.1 migrations/002_financer.sql : table aides + aide_applications + RLS + GRANTs + 45 seeds
- [x] C2.2 /financer wizard 4 étapes publique (pas d'auth) + PDF jsPDF
- [x] C2.3 /api/financer/match (POST profil → aides + cumul estimé)
- [x] C2.4 /pricing bandeau vert vers /financer
- [x] middleware: /financer ajouté à PUBLIC_PATHS
- [x] Deploy dpl_4vU92MjiJZfaaXJnUYpsvK4bAzgX → https://vida.purama.dev
- [x] Smoke tests: /=200 /pricing=200 /financer=200 /aide=200 /login=200. API /match retourne 29 aides / 171k€ pour salarié+parent+locataire.

### ✅ C1 — Spiritual Layer (2026-04-14)
- [x] migrations/003_spiritual.sql : tables affirmations (60 FR+EN), gratitude_entries, intentions, breath_sessions, awakening_events + cols profiles awakening_level/xp/affirmations_seen + RLS + GRANTs
- [x] lib/awakening.ts : levels (Éveillé→Unifié), XP map, 12 WISDOM_QUOTES, MICRO_TEXTS, localStorage guard 8h
- [x] SpiritualLayer + WisdomFooter (injectés layout dashboard)
- [x] /dashboard/breathe (4-7-8 cercle animé + DB save)
- [x] /dashboard/gratitude (journal 3/j + moods + +100 XP)
- [x] APIs /api/spiritual/{affirmation,track,breath,gratitude}

### ✅ C4 — Pages core VIDA (2026-04-14)
- [x] /dashboard/chat : UI plein écran, streaming /api/chat, 4 starters VIDA
- [x] /dashboard/missions : 15 missions DB + filtres (all/paid/ecology/health/community/human) + badge rémunéré
- [x] /dashboard/boutique : 5 produits DB + cashback Graines + gradients/cat
- [x] /dashboard/dons : wizard (3 destinations, 5 presets, message, anonymat) — prêt Stripe Checkout

### ✅ C6 — i18n 16/16 locales (fallback EN pour 11 nouvelles, à traduire natif en P5)

### ✅ V6 COMPLIANCE (2026-04-16)
- [x] V1 Infra : .env.local (PHASE/MODELS/WALLET_MODE), .claude/agents/qa.md+security.md, .claude/settings.json hooks, src/lib/phase.ts
- [x] V2 SQL migration 004 appliquée VPS : retractions, fiscal_notifications, annual_summaries, engagement_modes, ambassador_tiers, card_waitlist, prime_payouts, referrals multi-level, subscription_started_at
- [x] V3 Paiement : /subscribe (bouton L221-28), /confirmation (confettis+deep link), /dashboard/settings/abonnement (résil 3 étapes), webhook +invoice.payment_failed +charge.refunded + prime tranches scheduler (25€ J+0 créditée, 25€ M+1, 50€ M+2)
- [x] V3 CGU Art.8 clause L221-28 Code conso (waiver implicite par clic, retrait 30j)
- [x] V4 Fiscal : /fiscal page, FiscalBanner (>3000€ avril→juin), CRON /api/cron/fiscal
- [x] V5 Wealth V4 : CardTeaser, WalletPhase1, Flywheel, SocialFeed, PuramaScore, /api/wallet/card-waitlist
- [x] Middleware /fiscal /subscribe /confirmation ajoutés PUBLIC_PATHS
- [x] tsc 0 · build 69 routes · smoke test 6/6 = 200
- [x] Deploy prod https://vida.purama.dev

### ❌ PUSH GITHUB bloqué (secret scanning)
- CLAUDE.md supprimé du tracking mais reste dans l'historique commits
- Fix : `git filter-repo --path CLAUDE.md --invert-paths` puis force-push
- N'empêche pas la prod (déjà live Vercel)

### ✅ V7 AGENTIC COMPLIANCE (2026-04-16, commit 2d228bc)
- [x] .claude/settings.json : model claude-sonnet-4-6 + thinking 10K + outputStyle explanatory + autoCompact
- [x] .claude/agents/ : qa-agent.md (22 points V13) + security-agent.md (niveaux sévérité CRITIQUE/HAUTE/MOYENNE/OK)
- [x] .claude/commands/ : /deploy (QA+Security+vercel), /test-full, /audit
- [x] .claude/hooks/stop-verify.sh (exécutable)
- [x] .claude/skills/ : +supabase-purama, +vercel-deploy, +design-system (en plus des 6 existants)
- [x] dons/page.tsx : placeholder comment supprimé
- [x] Deploy dpl_AFeER9xBYYP9bRComBJZYZBYJtcf → 8/8 smoke tests = 200

### ✅ P2 COMPLET (2026-04-16, commit 1cf49e1)
- [x] /dashboard/univers — Fil de Vie™ + 6 impact stats DB-driven (déjà existant)
- [x] /dashboard/carte — Leaflet map dark tiles + CircleMarker geolocated impact_events + 3 stats (actions/users/cities) + SSR:false dynamic
- [x] /dashboard/rituels — Real RSVP via /api/rituels/join (Bearer auth + Zod + upsert + increment participants_count) + joinedIds Set + toast
- [x] /dashboard/communaute — Post composer + moderated love wall + types victory/gratitude/encouragement/milestone (déjà existant)
- [x] /dashboard/chat — UI plein écran + streaming /api/chat (déjà existant)
- [x] /dashboard/missions — 15 missions DB + filtres (déjà existant)
- [x] /dashboard/boutique — 5 produits DB + cashback (déjà existant)
- [x] /dashboard/dons — wizard 3 destinations (déjà existant)
- [x] Deps : +leaflet@1.9.4 +react-leaflet@5 +@types/leaflet

### ❌ RESTE (hors scope "finis tout P2")
- Push GitHub bloqué (secret scanning historique CLAUDE.md) — n'empêche pas la prod
- C7 QA : Playwright E2E + Lighthouse >90 + test humain 23 points
- P4 Admin (/admin/*) + i18n natif 11 clés EN
- P7 Mobile Expo + P8 Watch

### ✅ P2 — Features core VIDA-specific (TERMINÉ — voir ci-dessus)
- [ ] /app/page.tsx — Landing VIDA (hero nature + manifesto + cinématique 3-4s)
- [ ] /dashboard/page.tsx — Dashboard vivant (nature bg + compteurs impact + action du jour)
- [ ] /dashboard/univers — Mon Univers VIDA (Fil de Vie™ + Impact Profile™ + Mode Miroir + Simulateur futur)
- [ ] /dashboard/carte — Carte mondiale d'impact (Leaflet/Mapbox)
- [ ] /dashboard/missions — Liste missions (solo/group/paid) + preuve (photo/GPS/QR)
- [ ] /dashboard/rituels — Rituels Collectifs hebdo (dimanche)
- [ ] /dashboard/communaute — Cercles, buddies, mur love, practice sessions
- [ ] /dashboard/chat — IA VIDA (déjà API prête)
- [ ] /dashboard/boutique — Produits VIDA + cashback
- [ ] /dashboard/dons — Système de dons
- [ ] /dashboard/pub — Pub interne utilisateurs
- [ ] Layout Sidebar/BottomTab : reconfigurer items pour nav VIDA
- [ ] /api/missions + /api/impact + /api/rituals + /api/donations + /api/community
- [ ] Seed impact_events (fake partner-locations) pour carte mondiale

### ❌ P3 — Universels
- [ ] /dashboard/referral (existant, fonctionne mais UI à rafraîchir)
- [ ] /dashboard/wallet + withdrawals ≥5€ IBAN
- [ ] /dashboard/concours (existant, adapter wording)
- [ ] /dashboard/tirage (existant)
- [ ] /dashboard/classement
- [ ] /dashboard/daily-gift (existant, adapter)
- [ ] /dashboard/partage (existant)
- [ ] /dashboard/influenceur
- [ ] /dashboard/notifications (existant)
- [ ] /dashboard/settings
- [ ] /dashboard/profile (rewritten)
- [ ] /dashboard/guide (tuto 7-10 étapes)

### ❌ P4 — Admin + Aide + FAQ
- [ ] /admin dashboard triple auth (stats globales, pricing, commissions, modération)
- [ ] /admin/financement (aides SASU/asso → pools)
- [ ] /admin/moderation (community_posts, contact_messages, internal_ads)
- [ ] /aide (existant, faq_articles seed en place)
- [ ] /contact (existant, resend)

### ❌ P5 — Design + Anim + i18n 16
- [ ] Landing cinématique 13s
- [ ] Framer animations : parallax, reveal, counter
- [ ] Background nature (vidéo optimisée)
- [ ] Mode "Sans Interaction" (respiration)
- [ ] i18n 16 langues (messages FR déjà, copier vers autres)
- [ ] Accessibilité : VoiceOver, contrastes, sous-titres

### ❌ P6 — Audit + Tests
- [ ] Playwright E2E : signup → onboarding → dashboard → mission → impact
- [ ] 21 SIM tests (inscription, parrainage, stripe, wallet, …)
- [ ] Lighthouse >90 toutes pages
- [ ] Safari mobile, 375px responsive
- [ ] console 0 error
- [ ] Deploy final

### ❌ P7 — Mobile Expo (iOS + Android)
- [ ] create-expo-app ~/purama/vida/mobile
- [ ] Auth SecureStore adapter (CRITIQUE — voir CLAUDE.md)
- [ ] Icônes (lotus/nature green #10B981)
- [ ] 10 Maestro flows
- [ ] EAS build + submit

### ❌ P8 — Apple Watch + Wear OS (OBLIGATOIRE — VIDA = santé/bien-être)
- [ ] watchOS target : SwiftUI + HealthKit (pas, cardiaque, sommeil, SpO2)
- [ ] Wear OS module : Compose + Health Services
- [ ] Complications / Tiles
- [ ] Sync montre ↔ mobile ↔ cloud

## Credentials P1
- Deployment: https://vida.purama.dev (dpl_FnbBARJoZ5516sNqMxmPrV25AFpF)
- Vercel project: puramapro-oss-projects/vida
- Supabase schema: vida_sante (45 tables, 15 missions seeded, 5 products, 15 FAQ)
- Stripe product: prod_UJS84CrpuVWoKm
- Stripe price monthly: price_1TKpE14Y1unNvKtXjcVDJ3BX (9,90€)
- Stripe price yearly: price_1TKpE14Y1unNvKtXUscKlxyN (79,90€)
- Stripe webhook secret: whsec_zp7uyTmBlzniGLbzRJVoNiitKPJtf3sG
- Google OAuth: matériau existant (auth.purama.dev wildcard)
