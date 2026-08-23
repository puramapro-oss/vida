# CONFORMITÉ NIYAMA — VIDA (`vida_sante`)
> Audit exécuté le 2026-08-23 sur `/Users/matissdornier/purama/vida` UNIQUEMENT (pas les autres apps VIDA-* du repo). Référence : `NIYAMA-BRIEF.md` §7. Chaque point = preuve fichier:ligne, jamais une déclaration.

## Résumé exécutif

**VERDICT : ROUGE — 10 gaps.**

Le socle légal (`src/lib/legal/`) a bien été généré et contient les bons composants (pages CGU/CGV/mentions/confidentialité versionnées, `LegalReacceptanceGate`, `CookieConsentBanner`, `MaMemoirePage`, `AccountDeletionButton`, route `/api/legal/accept` correctement écrite côté serveur). **Le problème n'est quasiment jamais l'absence de code légal — c'est que ce code existe mais n'est branché nulle part.** L'app utilise à la place d'anciens composants ad-hoc (`components/shared/CookieBanner.tsx`, section "Données" de `settings/page.tsx`) qui simulent la conformité sans l'appliquer réellement : bandeau cookies binaire non synchronisé en base, bouton "Exporter mes données" qui ne fait qu'un `toast.success()`, bouton "Supprimer mon compte" qui ouvre un `mailto:` vers l'email personnel du développeur.

---

## 1. Pages légales

**VERT.** Les 5 pages existent et sont pilotées par le socle `src/lib/legal/content/*.ts` (pas de placeholder) :
- `src/app/mentions-legales/page.tsx` → `buildMentionsLegales()`
- `src/app/cgu/page.tsx` → `buildCGU(VIDA_LEGAL_CONFIG)`, version affichée `CURRENT_LEGAL_VERSIONS.cgu`
- `src/app/cgv/page.tsx` → `buildCGV()`
- `src/app/politique-confidentialite/page.tsx` → `buildPolitiqueConfidentialite()`
- `src/app/cookies/page.tsx` (145 lignes, contenu réel — décrit PostHog "sans cookies, mode anonymisé, hébergé en Europe")

Clause médiateur de la consommation présente et honnête sur son statut réel :
`src/lib/legal/content/mentions-legales.ts:11-12` — *"Coordonnées du médiateur : en cours de désignation — à ce jour aucun médiateur de la consommation agréé n'est souscrit pour l'écosystème PURAMA."* (cohérent avec NIYAMA §6 point 4 "avocat une fois", pas improvisé).

Liens vérifiés présents dans `src/app/(auth)/signup/page.tsx` (vers `/cgu` et `/politique-confidentialite`) et `src/app/page.tsx`.

## 2. Bandeau consentement cookies — PAS réellement fonctionnel

**ROUGE — Gap #1.** Deux implémentations coexistent, et c'est la mauvaise qui est montée :

- `src/app/layout.tsx:7,90` monte `CookieBanner` importé de `@/components/shared/CookieBanner.tsx` — bandeau binaire (Accepter/Refuser), écrit uniquement dans `localStorage['vida_cookie_consent']` (`CookieBanner.tsx:13,21,26`), **n'appelle jamais** `/api/legal/cookie-consent`, aucun `onConsent` branché, pas de granularité mesure/marketing malgré `cookies/page.tsx:103` qui mentionne PostHog.
- Le socle correct existe et n'est mounté nulle part : `src/lib/legal/components/CookieConsentBanner.tsx` (3 actions Tout accepter/Tout refuser/Personnaliser, catégories `mesure`/`marketing` distinctes, appelle `useCookieConsent(onConsent)` qui écrit dans `localStorage['purama_cookie_consent_v1']` ET synchronise en base via `onConsent` → `/api/legal/cookie-consent` une fois authentifié). `grep -rn "CookieConsentBanner"` : 0 usage hors sa propre définition et l'export dans `src/lib/legal/index.ts:12`.

Résultat mesurable : `POST /api/legal/cookie-consent` (`src/app/api/legal/cookie-consent/route.ts`) — endpoint correctement écrit (upsert `cookie_consents`, Zod) — **n'est jamais appelé par aucun composant réellement monté**. Piège identique à celui documenté sur vida-grow-origine/raksha.

## 3. Preuve d'acceptation CGU horodatée — codée mais jamais appelée

**ROUGE — Gap #2.** `POST /api/legal/accept` (`src/app/api/legal/accept/route.ts`) est bien écrit (upsert `legal_acceptances`, version calculée serveur `CURRENT_LEGAL_VERSIONS[docType]` jamais envoyée par le client, IP + user-agent capturés, rate-limit 30/min).

Mais aucun appel réel :
- `grep -rn "legal/accept"` sur tout `src/` → 0 résultat en dehors de la route elle-même et d'un commentaire dans `LegalReacceptanceGate.tsx:23` qui la mentionne comme *devant* être branchée.
- `src/app/(auth)/signup/page.tsx:32,182-200` : checkbox CGU (`cguAccepted`) bloque bien le submit (`canSubmit` l.40-45), mais `handleSubmit` (l.56-68) appelle uniquement `signUp(email, password, name)` puis redirige — **aucun `fetch('/api/legal/accept')`**.
- `src/hooks/useAuth.ts:63` (`signUp`) — aucune trace de `legal` dans tout le fichier.
- `src/app/auth/callback/route.ts` (flux Google OAuth) — échange le code de session et redirige, **aucun appel `/api/legal/accept`** non plus (donc les comptes créés via Google n'ont même pas de checkbox CGU, contrairement au formulaire email).
- `src/app/onboarding/page.tsx` — 0 occurrence de `legal/accept`.

Conséquence : la case cochée à l'inscription est de la mise en scène. Aucune ligne n'est jamais écrite dans `legal_acceptances`, donc en cas de litige il n'existe **aucune preuve d'acceptation horodatée** — exactement le piège gravé (vida-grow-origine).

## 4. "Ma mémoire" (export RGPD) + suppression de compte réelle

**ROUGE — Gaps #3, #4, #5, #6 (le point le plus grave de l'audit).**

Le socle prévoit tout : `src/lib/legal/components/MaMemoirePage.tsx` (export JSON + liste des acceptations + `AccountDeletionButton`) et `src/lib/legal/components/AccountDeletionButton.tsx` (confirmation par saisie de `DELETE_MY_ACCOUNT`, période de grâce 30j, appelle `POST /api/account/delete` puis annulation via `DELETE`). Ces deux fichiers sont **complets et bien écrits mais orphelins** :
- `grep -rn "MaMemoirePage\|AccountDeletionButton"` dans `src/app/` → 0 usage. Pas de route `(dashboard)/ma-memoire` (liste des 23 sous-dossiers de `dashboard/` : boutique, breathe, carte, chat, classement, communaute, concours, daily-gift, dons, gratitude, guide, influenceur, missions, notifications, partage, profile, referral, rituels, **settings**, tirage, univers, wallet — **pas de `ma-memoire`**).

Les endpoints qu'ils ciblent n'existent pas côté serveur :
- **Gap #3** : `src/app/api/legal/my-data/` est un dossier **vide** (`ls -la` : seulement `.`/`..`, aucun `route.ts`) → `GET /api/legal/my-data` répond 404 en prod.
- **Gap #4** : `src/app/api/account/delete/` est un dossier **vide** → `POST /api/account/delete` répond 404 en prod.
- **Gap #5** : `src/app/api/cron/account-deletion/` est également **vide** — même si l'API existait, aucun cron ne traiterait la suppression différée à J+30.

Ce qui est réellement affiché en prod, c'est l'onglet "Données" ad-hoc de `src/app/(dashboard)/dashboard/settings/page.tsx` :
- **Gap #6** : Export RGPD factice — `settings/page.tsx:585-591` : le bouton "Exporter mes données" ne fait **aucun appel réseau**, juste `onClick={() => toast.success('Export en cours — tu recevras un email sous 24h')}`. Aucun email n'est jamais envoyé (pas de job, pas de trace dans `src/lib/resend.ts` ni les crons), c'est une fausse promesse d'action — viole aussi l'interdiction CLAUDE.md §3 "jamais de faux contenu".
- Suppression de compte non self-service : `settings/page.tsx:610-621` puis modale `settings/page.tsx:656-682` — le texte dit explicitement *"Pour supprimer ton compte, contacte matiss.frasne@gmail.com"*, et le bouton de confirmation ouvre `mailto:matiss.frasne@gmail.com?subject=Suppression compte VIDA` (l.677). Ce n'est pas une suppression "DANS l'app" (exigence Apple explicite dans NIYAMA-BRIEF §1) et ça expose l'email personnel du développeur dans le produit en prod.

Seule fonctionnalité réelle du bloc "Données" : la suppression d'historique de conversation (`handleDeleteHistory`), qui elle appelle un vrai endpoint — mais ce n'est ni l'export RGPD ni la suppression de compte.

## 5. Déclaration IA sur chaque UI de chat IA

**ROUGE — Gaps #7, #8.** Deux surfaces de chat IA dans l'app, aucune ne porte de mention "vous parlez à une IA" (obligation IA Act citée en NIYAMA §1) :
- `src/app/(dashboard)/dashboard/chat/page.tsx` (chat principal "VIDA", branché sur `streamClaude` via `src/app/api/chat/route.ts:4,92`) — 190 lignes lues intégralement, 0 mention "IA", "intelligence artificielle" ou équivalent visible pour l'utilisateur. Le nom "VIDA" (l.111) se présente comme *"Expert en droits sociaux"* sans jamais préciser qu'il s'agit d'une IA.
- `src/app/aide/page.tsx:184,217,235` — le chatbot SAV ("Assistant VIDA" / bouton "Assistant IA") a bien le mot "IA" dans un libellé de bouton (l.184 "Assistant IA"), mais aucune phrase de transparence type "réponses générées par IA, peuvent contenir des erreurs" dans la fenêtre de chat elle-même (l.230-273, aucune telle mention).

`grep -rniE` sur tout `src/` pour les formulations usuelles de disclosure IA ("assistant IA", "réponses de l'IA", "contenu généré par", "IA peut se tromper", "vérifier les informations importantes") → 0 résultat en dehors du libellé bouton "Assistant IA" cité ci-dessus.

## 6. Lexique interdit / avis rémunérés / promesses non tenables

**VERT — 0 occurrence.**
- `grep -rniE "guérit|guérir|soigne un|traite (le|la|les)|remède|diagnostic médical|garanti(e)? à 100|résultats garantis|argent garanti"` sur `src/` → 0 résultat.
- `grep -rniE "avis (contre|rémunéré|payant)|note contre|étoiles contre|reward.*review|review.*reward|témoignage.*récompense|récompense.*avis|payer pour.*avis|avis vérifié.*point"` sur `src/` → 0 résultat. Pas de mécanique d'avis/notes rémunérés dans `missions/`, `boutique/`, `dons/`.
- Aucune promesse de date de conversion cash ni de valeur garantie trouvée dans les composants wallet.

## 7. Chiffres cohérents avec FACTS.md

**VERT.**
- `WALLET_MIN` : `src/lib/constants.ts:46` → `WALLET_MIN_WITHDRAWAL = 5` — conforme à FACTS.md (`WALLET_MIN = 5€`).
- Split KARMA : `src/lib/constants.ts:48-51` → commentaire explicite *"KARMA split 50/10/40 (CLAUDE.md §9.1)"*, `ASSO_PERCENTAGE = 10`, `REWARD_POOL_PERCENTAGE = 50` (bug historique `10` au lieu de `50` déjà corrigé et tracé dans `ERRORS.md:6`, daté 2026-08-15). Conforme.

## 8. Migration SQL — tables `legal_acceptances` / `cookie_consents`

**ROUGE — Gap #9.** Les routes `/api/legal/accept` et `/api/legal/cookie-consent` écrivent respectivement dans `legal_acceptances` et `cookie_consents`, mais **aucune migration du dossier `migrations/` ne crée ces tables** :
- Fichiers présents : `002_financer.sql`, `003_spiritual.sql`, `004_v6_compliance.sql`, `005_cross_promos.sql`, `006_siret_cache.sql`, `007_aides_enrichies.sql`, `008_openfisca_cache.sql`, `009_aides_legifrance_complete.sql`, `010_aide_simulations.sql`, `011_grant_service_role_profiles_faq.sql`, `012_legifrance_dynamic.sql`, `013_reconciliation.sql`.
- `grep -rl "legal_acceptances\|cookie_consents\|deletion_scheduled_for" migrations/*.sql` → 0 fichier. `004_v6_compliance.sql` (lu intégralement, 153 lignes) crée `retractions`, `fiscal_notifications`, `annual_summaries`, `engagement_modes`, `ambassador_tiers`, `card_waitlist`, `prime_payouts` — rien sur le légal.
- `ERRORS.md` (4 lignes de bugs documentés, dernière datée 2026-08-15) ne mentionne **aucun blocage** sur `legal_acceptances`/`cookie_consents`/suppression de compte — ce gap n'a jamais été tracé.
- Vérification en base tentée : `sshpass ssh root@72.62.191.111` → `Connection refused` (VPS inaccessible depuis cet environnement d'audit). **Statut réel en base non confirmable ici** — à vérifier manuellement (`psql -h 72.62.191.111 -U postgres -c "\dt vida_sante.*"`). Vu qu'aucune migration trackée ne crée ces tables et qu'aucun appel n'atteint ces routes en pratique (points 2 et 3 ci-dessus), le risque immédiat est faible, mais le jour où quelqu'un branche le socle (correction des gaps #1/#2), les deux `INSERT`/`upsert` échoueront si les tables n'existent pas réellement.

## 9. `LegalReacceptanceGate` monté ?

**ROUGE — Gap #10. Non monté — confirmé, gap quasi-universel présent ici aussi.**
- `src/lib/legal/components/LegalReacceptanceGate.tsx` existe (composant complet : props `appName`, `docsEnAttente`, `onAccept` → doit déclencher `POST /api/legal/accept`).
- `grep -rn "LegalReacceptanceGate"` sur tout `src/` → seulement sa propre définition (`LegalReacceptanceGate.tsx:13,27`), l'export (`src/lib/legal/index.ts:15`), et des mentions en commentaire dans `versions.ts:27` et `api/legal/accept/route.ts:4`. **Aucun import dans `src/app/layout.tsx` ni `src/app/(dashboard)/layout.tsx`** (les deux fichiers ont été lus intégralement — le premier monte `CookieBanner`+`ErrorBoundary`, le second monte `Sidebar`/`Topbar`/`BottomTabBar`/`SpiritualLayer`, ni l'un ni l'autre ne référence le gate légal).
- Conséquence directe : même si une re-signature de CGU était un jour nécessaire (bump de `CURRENT_LEGAL_VERSIONS`), aucun mécanisme dans l'app ne la déclencherait auprès des utilisateurs existants.

---

## Point annexe — famille NIYAMA non déclarée

Non demandé explicitement dans les 9 points mais requis par NIYAMA-BRIEF §0.2 : `grep -rn "niyama_family"` sur tout le repo `vida/` (code + `package.json`) → 0 résultat. Aucun frontmatter/config ne déclare la famille. Au vu du contenu réel (wallet, primes, parrainage, missions payées, bien-être/aides sociales), l'app relève de la **Famille 1 (apps qui paient les utilisateurs / KARMA-wellness)** — cohérent avec le code — mais ce n'est écrit nulle part formellement, donc l'inspecteur juridique automatisé ne peut pas le vérifier mécaniquement. Compte non tenu dans le total de 10 gaps ci-dessus (point informatif, pas dans la checklist des 9).

---

## Tableau récapitulatif

| # | Point | Verdict | Gaps |
|---|---|---|---|
| 1 | Pages légales | VERT | 0 |
| 2 | Bandeau cookies fonctionnel | ROUGE | 1 |
| 3 | Preuve acceptation CGU (accept appelé) | ROUGE | 1 |
| 4 | Ma mémoire / export RGPD / suppression compte | ROUGE | 4 |
| 5 | Déclaration IA sur chat | ROUGE | 2 |
| 6 | Lexique interdit / avis rémunérés / promesses | VERT | 0 |
| 7 | Chiffres cohérents FACTS.md | VERT | 0 |
| 8 | Migration SQL legal tables | ROUGE | 1 |
| 9 | LegalReacceptanceGate monté | ROUGE | 1 |
| **Total** | | **ROUGE** | **10** |

## Priorité de correction recommandée (non demandé mais utile)
1. Brancher `AccountDeletionButton`/`MaMemoirePage` sur une vraie route `(dashboard)/ma-memoire`, écrire `POST /api/account/delete` + `GET /api/legal/my-data` + cron `account-deletion` (le plus grave : promesse d'action fausse + suppression non self-service = rejet Apple garanti).
2. Remplacer `components/shared/CookieBanner.tsx` par `CookieConsentBanner` du socle dans `layout.tsx`, avec `onConsent` branché sur `/api/legal/cookie-consent`.
3. Appeler `POST /api/legal/accept` dans `useAuth.signUp` (et dans `auth/callback/route.ts` pour Google) juste après création de compte.
4. Monter `LegalReacceptanceGate` dans `(dashboard)/layout.tsx`.
5. Créer la migration SQL `legal_acceptances` + `cookie_consents` (schéma `vida_sante`), documenter dans `ERRORS.md`.
6. Ajouter une ligne de disclosure IA visible dans `dashboard/chat/page.tsx` et le panneau chatbot de `aide/page.tsx`.

VERDICT:vida:ROUGE:10
