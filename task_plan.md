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

### ❌ P2 — Features core VIDA-specific (À FAIRE)
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
