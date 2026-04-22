# P8 — VIDA Watch (watchOS + Wear OS)

> Source de vérité pour l'intégration watchOS Apple Watch + Wear OS. Le code vit
> dans `~/purama/vida-mobile/` dans les dossiers `watch-ios/` et `watch-android/`.
> Ce document suit l'avancement et consolide la checklist post-SASU pour le
> submit stores.

## 1. État actuel

| Feature | Scope | Statut |
|---|---|---|
| F1 | Scaffold watch-ios (XcodeGen) + watch-android (Gradle) + docs | ✅ |
| F2 | watchOS : HealthKit + SupabaseClient + StreakStore / IntentionStore | ⏳ |
| F3 | watchOS : 6 écrans SwiftUI (Dashboard / Streak / Intention / Breath / Gratitude / Ritual Timer) | ⏳ |
| F4 | watchOS : Complications WidgetKit (4 familles) | ⏳ |
| F5 | watchOS : WatchConnectivity bridge (watch ↔ phone) | ⏳ |
| F6 | Wear OS : Health Connect + 6 écrans Compose | ⏳ |
| F7 | Wear OS : Tiles + Complications + Wearable DataClient | ⏳ |
| F8 | CI GitHub Actions + docs finales + post-SASU checklist | ⏳ |

## 2. Architecture

```
┌─────────────────┐        WatchConnectivity (iOS)        ┌─────────────────┐
│  VIDA iPhone    │ ◄────────────────────────────────────►│  VIDA           │
│  (Expo RN)      │          Wearable DataClient (Android)│  Apple Watch    │
│                 │ ◄────────────────────────────────────►│  / Wear OS      │
│  Supabase token │                                        │                 │
│  (SecureStore)  │                                        │  Local cache    │
└──────┬──────────┘                                        │  (UserDefaults  │
       │                                                   │   /DataStore)   │
       ▼                                                   └────────┬────────┘
┌─────────────────┐                                                 │
│  Supabase       │ ◄───────────────────────────────────────────────┘
│  (auth.purama)  │  Direct HTTPS fallback si paired phone offline
└─────────────────┘
```

**Principe** : le téléphone reste la source de vérité pour la session Supabase.
La montre lit/écrit via le pont WatchConnectivity (iOS) ou Wearable DataClient
(Android). En dernier recours (standalone LTE watch sans phone à portée),
la montre peut atteindre Supabase directement avec son token cached.

## 3. Identifiants et capabilities

| Élément | Valeur |
|---|---|
| Bundle ID iPhone | `dev.purama.vida` |
| Bundle ID watchOS app | `dev.purama.vida.watchapp` |
| Bundle ID watchOS complication | `dev.purama.vida.watchapp.complications` |
| App Group (iOS ↔ watchOS) | `group.dev.purama.vida` |
| Application ID Android phone | `dev.purama.vida` |
| Application ID Wear OS | `dev.purama.vida` (même, via DataClient pairing) |
| minSdk Wear OS | 30 (Wear OS 3+) |
| targetSdk Wear OS | 34 |
| watchOS deployment target | 10.0 |

Capabilities watchOS requises (post-SASU) :
- HealthKit
- App Groups (pour partager le token Supabase avec l'iPhone)
- Push Notifications (APNs pour rappels ritual / breath)
- WatchConnectivity (implicite)

Permissions Wear OS requises :
- `android.permission.health.READ_STEPS`
- `android.permission.health.READ_HEART_RATE`
- `android.permission.health.READ_SLEEP`
- `android.permission.health.READ_EXERCISE`
- `android.permission.health.READ_MINDFULNESS`
- `android.permission.health.READ_ACTIVE_CALORIES_BURNED`
- `android.permission.BODY_SENSORS`
- `android.permission.ACTIVITY_RECOGNITION`
- `android.permission.VIBRATE`
- `android.permission.WAKE_LOCK`
- `android.permission.INTERNET`

## 4. Layout disque

```
~/purama/vida-mobile/
├── watch-ios/                      # watchOS (XcodeGen-driven)
│   ├── project.yml                 # Source de vérité — xcodegen generate
│   ├── VIDAWatch.xcodeproj/        # Généré, non versionné idéalement
│   ├── VIDAWatch/
│   │   ├── Sources/                # Swift code
│   │   │   ├── VIDAWatchApp.swift
│   │   │   ├── Core/               # HealthKit / Supabase / stores (F2)
│   │   │   └── Views/              # SwiftUI screens (F3)
│   │   ├── Resources/
│   │   │   ├── Info.plist          # Généré par xcodegen
│   │   │   ├── VIDAWatch.entitlements
│   │   │   └── Assets.xcassets/
│   │   └── Tests/                  # XCTest
│   └── VIDAWatchComplication/      # WidgetKit complications (F4)
│       ├── VIDAComplicationBundle.swift
│       └── Info.plist
├── watch-android/                  # Wear OS (Gradle module)
│   ├── settings.gradle.kts
│   ├── build.gradle.kts
│   ├── gradle.properties
│   ├── gradlew + gradle/wrapper/   # Gradle 8.10 wrapper
│   └── wear/
│       ├── build.gradle.kts
│       ├── src/main/
│       │   ├── AndroidManifest.xml
│       │   ├── java/dev/purama/vida/wear/   # Kotlin code
│       │   └── res/                         # resources, themes
│       └── src/test/java/                   # JUnit tests
└── (app, lib, etc — code RN/Expo)
```

## 5. watchOS (watch-ios/)

À compléter en F2-F5.

## 6. Wear OS (watch-android/)

À compléter en F6-F7.

## 7. Partage du token Supabase

(Cross-platform, implémenté en F2 côté iOS et F6 côté Android.)

**iOS ↔ watchOS** : l'app RN iOS écrit le token Supabase dans
`UserDefaults(suiteName: "group.dev.purama.vida")` via un Expo native module.
L'app watchOS lit le même suite et tombe en fallback sur rien si la capability
App Group n'est pas active (dev sans signing).

**Android ↔ Wear OS** : Wearable `DataClient` sync une entrée
`/auth/token` protégée. Fallback local via `EncryptedSharedPreferences` watch-side.

## 8. Développement local

```bash
# watchOS (nécessite Xcode full — pas CLT)
cd ~/purama/vida-mobile/watch-ios
xcodegen generate
open VIDAWatch.xcodeproj
# ou CLI :
xcodebuild -scheme VIDAWatch \
  -destination 'platform=watchOS Simulator,name=Apple Watch Series 10 (46mm),OS=latest' \
  -configuration Debug build

# Wear OS (nécessite Android SDK + ANDROID_HOME)
cd ~/purama/vida-mobile/watch-android
./gradlew :wear:tasks                  # lister tâches
./gradlew :wear:assembleDebug          # build APK debug
./gradlew :wear:testDebugUnitTest      # JUnit tests
```

Pré-requis machine locale :
- Xcode 15+ pour watchOS (≠ Command Line Tools)
- JDK 17 + Android SDK 34 + cmdline-tools pour Wear OS
- `brew install xcodegen gradle`

## 9. CI GitHub Actions

(Implémenté en F8 — `.github/workflows/watch-build.yml` sur repo vida.)

Matrix :
- `watchos-build` sur macos-14 : xcodegen + xcodebuild Debug simulateur, 3
  tailles (41mm / 45mm / 49mm Ultra)
- `wear-build` sur ubuntu-latest : `./gradlew :wear:assembleDebug
  :wear:testDebugUnitTest`

Pas de signing, pas de submit. `eas submit` reste bloqué sur SASU.

## 10. Post-SASU submit checklist

Une fois la SASU PURAMA immatriculée et l'Apple Developer Program souscrit
(99€/an), exécuter cette checklist dans l'ordre :

### Apple / watchOS

- [ ] Enrollment Apple Developer Program via SASU (99€/an)
- [ ] Récupérer `APPLE_TEAM_ID` (10 caractères, visible developer.apple.com/account)
- [ ] `eas secret:create --name APPLE_TEAM_ID --value $APPLE_TEAM_ID`
- [ ] Remplacer `DEVELOPMENT_TEAM: "000000000A"` dans
      `watch-ios/project.yml` par le vrai Team ID
- [ ] Créer les App IDs sur developer.apple.com :
      - `dev.purama.vida` (iPhone) — enable HealthKit + App Groups + Push
      - `dev.purama.vida.watchapp` (Watch) — enable HealthKit + App Groups
      - `dev.purama.vida.watchapp.complications` (ext)
- [ ] Créer l'App Group `group.dev.purama.vida` et l'attacher aux 3 App IDs
- [ ] Régénérer `watch-ios/VIDAWatch.xcodeproj` via `xcodegen generate`
- [ ] Merger le target watchOS dans le workspace iOS principal via Xcode :
      File → Add Files to "VIDA" → sélectionner `watch-ios/VIDAWatch.xcodeproj`
      (ou déclarer en sub-project dans le Podfile RN)
- [ ] Ajouter `WKCompanionAppBundleIdentifier: dev.purama.vida` dans l'Info.plist
      watch — déjà présent, vérifier après regen
- [ ] Vérifier les usage descriptions HealthKit dans le Info.plist iPhone
- [ ] `eas build --platform ios --profile production` → TestFlight
- [ ] Soumettre pour review App Store : joindre compte démo avec
      `matiss.frasne@gmail.com` et capabilities Health démontrées

### Google / Wear OS

- [ ] Créer Google Play Console entreprise (25 $ one-shot) via SASU
- [ ] Générer service account `vida-play@...iam.gserviceaccount.com` avec rôle
      "Service Account User" + "Release Manager"
- [ ] Télécharger la clé JSON → `eas secret:create --name
      GOOGLE_SERVICE_ACCOUNT_KEY_PATH --type file --value
      ~/Downloads/vida-play.json`
- [ ] Dans `android/settings.gradle.kts` (post-prebuild) ajouter :
      `include(":wear")` + `project(":wear").projectDir =
      file("../../watch-android/wear")`
- [ ] Configurer la signing `release` dans `watch-android/wear/build.gradle.kts`
      avec les keystores générés par Play App Signing (upload key + app signing key)
- [ ] Remplir le formulaire **Health Connect Declaration Form** sur Google Play
      Console : vidéo démo (30s) + justification écrite de chaque permission
      santé demandée. Délai review : 2-6 semaines.
- [ ] `./gradlew :wear:bundleRelease` → AAB
- [ ] Upload internal track → test → production track

### Vérifications finales

- [ ] Store listings watchOS : screenshots 41mm + 45mm + 49mm (Ultra) dans
      App Store Connect
- [ ] Store listings Wear OS : screenshots round + square dans Play Console
- [ ] Vérifier la compatibilité `minSdk 30` — Wear OS 3 couvre Samsung Galaxy
      Watch 4+, Pixel Watch, TicWatch Pro 3 Ultra, Fossil Gen 6 et plus récents
- [ ] Vérifier taille bundle < 50 MB (watchOS) et < 100 MB (Wear OS)
- [ ] Smoke test sur device physique : pairing, sync bidirectionnelle,
      complications qui se rafraîchissent, tiles qui s'affichent, breath /
      gratitude / ritual timer haptics OK

## 11. Risques et gotchas connus

- **App Groups sans signing réel** : `UserDefaults(suiteName:)` fallback
  silencieusement vers `UserDefaults.standard` si le group n'est pas activé.
  En dev local, la montre ne verra pas le token iPhone — c'est attendu,
  ça s'active au premier signing Apple Developer Program.
- **Complication refresh budget** : Apple impose un budget quotidien de
  refreshes pour les complications. Prévoir un `TimelineReloadPolicy.after`
  avec un intervalle ≥ 30min pour ne pas vider le budget en une journée.
- **Health Connect review Google** : aucune app ne peut publier en production
  sans approbation écrite du formulaire. Préparer la vidéo et le texte à
  l'avance, ça sauve 2-3 semaines.
- **Wear OS standalone LTE** : si la montre est 4G (Apple Watch LTE, Pixel
  Watch LTE, Samsung Galaxy Watch LTE), elle peut fonctionner sans phone.
  Le code doit gérer ce cas via un fallback Supabase direct.
- **Apple Watch Series 3 et Ultra 1ère gen** : watchOS 10 ne tourne pas sur
  Series 3. Ne pas cibler < watchOS 10.0 vu la part de marché résiduelle et la
  dette de maintenance.
- **Prebuild conflict** : si `expo prebuild` est relancé sur vida-mobile,
  l'ios/ et android/ sont régénérés. Les dossiers `watch-ios/` et
  `watch-android/` vivent côté à côté et ne sont pas touchés par prebuild.
  Post-SASU, le wiring dans le projet principal se fait via Xcode GUI
  (subproject reference) et `settings.gradle.kts` include — pas via prebuild.

## 12. Références

- watchOS : https://developer.apple.com/documentation/watchos-apps
- HealthKit on watchOS : https://developer.apple.com/documentation/healthkit
- WatchConnectivity : https://developer.apple.com/documentation/watchconnectivity
- WidgetKit (complications) : https://developer.apple.com/documentation/widgetkit/
- XcodeGen : https://github.com/yonaskolb/XcodeGen
- Wear Compose : https://developer.android.com/jetpack/androidx/releases/wear-compose
- Health Services API : https://developer.android.com/health-and-fitness/guides/health-services
- Health Connect : https://developer.android.com/health-and-fitness/guides/health-connect
- Wearable DataClient : https://developer.android.com/training/wearables/data/data-layer
