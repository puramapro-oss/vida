# VIDA — Maestro E2E Flows

10 flows couvrant les parcours critiques iOS + Android.

## Installation Maestro (1×)

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
# OU via Homebrew :
brew install mobile-dev-inc/tap/maestro
```

## Usage local (nécessite EAS dev-client build)

```bash
# Build dev-client iOS simulator (EAS — post-APPLE_TEAM_ID)
eas build --profile development --platform ios --local

# Installer le build sur simulator
# Puis lancer un flow
maestro test .maestro/auth.yaml
maestro test .maestro/                # tous les flows séquentiellement
```

## Usage Maestro Cloud (CI/CD)

```bash
# Après eas build --profile preview --platform all (APK + IPA)
maestro cloud --apiKey $MAESTRO_API_KEY \
  build.apk build.ipa \
  .maestro/
```

## Flows disponibles

| # | Flow | Couverture |
|---|---|---|
| 01 | `auth.yaml` | Login + signup navigation + submit (16 steps) |
| 02 | `dashboard.yaml` | Greeting + 4 impact stats + 4 quick actions (16 steps) |
| 03 | `chat.yaml` | Chat IA VIDA : input + send + réponse (13 steps) |
| 04 | `wallet.yaml` | Balance € + Purama Points + tier badge (12 steps) |
| 05 | `referral.yaml` | Profil → Parrainage → Linking openURL (8 steps) |
| 06 | `onboarding.yaml` | clearState + signup flow complet (15 steps) |
| 07 | `pricing.yaml` | Profil → Facturation (iOS-safe neutral wording) (8 steps) |
| 08 | `responsive.yaml` | 4 tabs navigation + scroll (23 steps) |
| 09 | `error.yaml` | Mauvais mdp → message FR explicite + retry (19 steps) |
| 10 | `health.yaml` | Profil → Santé & HealthKit → Alert (9 steps) |

Total : **10 flows, 139 steps, 11 YAML docs**.

## TestIDs utilisés

Définis dans le code source mobile/ :

```
login-title, login-email, login-password, login-submit
signup-title, signup-name, signup-email, signup-password, signup-submit
greeting, action-breath, action-steps, action-gratitude, action-intention
chat-input, chat-send
wallet-balance, wallet-points
profile-name, profile-settings, profile-health, profile-referral,
profile-billing, profile-help, profile-privacy, profile-logout
```

## Compte de test

Un compte seeded doit exister pour les flows auth-required :
- **Email** : `matiss.frasne@gmail.com`
- **Password** : `TestVidaMaestro2026!`

Créer via le Supabase VPS ou via signup réel une 1× fois avant le premier run.

## Validation YAML (sans emulator)

```bash
cd mobile
node -e "
const yaml = require('js-yaml');
const fs = require('fs');
for (const f of fs.readdirSync('.maestro').filter(x => x.endsWith('.yaml'))) {
  yaml.loadAll(fs.readFileSync(\`.maestro/\${f}\`, 'utf8'));
  console.log('✓', f);
}
"
```
