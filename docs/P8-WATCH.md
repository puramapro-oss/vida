# P8 — VIDA Watch (watchOS + Wear OS)

> Source de vérité pour l'intégration watchOS Apple Watch + Wear OS. Le code vit
> dans `~/purama/vida-mobile/` (repo `puramapro-oss/vida-mobile`) dans les
> dossiers `watch-ios/` et `watch-android/`. Ce document consolide
> l'implémentation, la CI et la checklist post-SASU pour le submit stores.

## 1. État actuel — P8 100% codé

| Feature | Scope | Statut |
|---|---|---|
| F1 | Scaffold watch-ios (XcodeGen) + watch-android (Gradle) + docs | ✅ |
| F2 | watchOS : HealthKit + SupabaseClient + StreakStore / IntentionStore + 12 XCTest | ✅ |
| F3 | watchOS : 6 écrans SwiftUI (Dashboard/Streak/Intention/Breath/Gratitude/Ritual) + instantiation tests | ✅ |
| F4 | watchOS : 2 widgets WidgetKit (Streak × 4 familles + Steps × 3) + bridge App Group | ✅ |
| F5 | watchOS : WatchConnectivity bridge + phone-bridge/PhoneSessionManager + 11 XCTest codec | ✅ |
| F6 | Wear OS : Health Connect + SupabaseClient + 6 écrans Compose + 11 JUnit | ✅ |
| F7 | Wear OS : Tile ProtoLayout + 2 Complications + DataClient + 10 JUnit | ✅ |
| F8 | CI GitHub Actions (watchOS matrix 3 tailles + Wear OS) + docs finales | ✅ |

**Total** : ~50 fichiers produits, ~55 tests unitaires, 2 CI jobs.
Ce qui reste = strictement post-SASU (signing, submit). Voir section 10.

## 2. Architecture

```
┌─────────────────┐        WatchConnectivity (iOS)        ┌─────────────────┐
│  VIDA iPhone    │ ◄────────────────────────────────────►│  VIDA           │
│  (Expo RN)      │          Wearable DataClient (Android)│  Apple Watch    │
│                 │ ◄────────────────────────────────────►│  / Wear OS      │
│  Supabase token │                                        │                 │
│  (SecureStore)  │                                        │  Local cache    │
└──────┬──────────┘                                        │  (UserDefaults  │
       │                                                   │   /SharedPrefs) │
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

### Protocole de messages

Le même contrat JSON est parlé par les deux plateformes — les 8 cas
`WatchMessage.swift` et `WearMessage.kt` se correspondent 1-à-1 via le tag
`"type"` :

| Direction | Message | Payload |
|---|---|---|
| Phone → Watch | `authTokenUpdate` | `token: String` |
| Phone → Watch | `streakUpdate` | `streak: Int, gratitudeStreak: Int` |
| Phone → Watch | `intentionUpdate` | `text: String` |
| Phone → Watch | `ritualStarted` / `ritualCompleted` | `durationSeconds: Int` |
| Watch → Phone | `gratitudeCapture` | `text: String, capturedAt: Date` |
| Watch → Phone | `healthSnapshotPush` | `snapshot: HealthSnapshot` |
| Watch → Phone | `syncRequest` | — |

Path Wearable (Android) : `/vida/message`. iOS : key `"payload"` dans le
dict `sendMessage` / `transferUserInfo`.

## 3. Identifiants et capabilities

| Élément | Valeur |
|---|---|
| Bundle ID iPhone | `dev.purama.vida` |
| Bundle ID watchOS app | `dev.purama.vida.watchapp` |
| Bundle ID watchOS complication | `dev.purama.vida.watchapp.complications` |
| Bundle ID watchOS tests | `dev.purama.vida.watchapp.tests` |
| App Group (iOS ↔ watchOS) | `group.dev.purama.vida` |
| Application ID Android phone | `dev.purama.vida` |
| Application ID Wear OS | `dev.purama.vida` (même, via DataClient pairing) |
| minSdk Wear OS | 30 (Wear OS 3+) |
| compileSdk / targetSdk Wear OS | 36 |
| watchOS deployment target | 10.0 |
| Xcode / AGP versions | Xcode 15.4+ / AGP 8.10.1 / Kotlin 2.0.20 / Compose BOM 2024.08 |

Capabilities watchOS requises (post-SASU) :
- HealthKit (déjà déclaré dans `VIDAWatch.entitlements`)
- App Groups (pour partager le token Supabase avec l'iPhone)
- Push Notifications (APNs pour rappels ritual / breath)
- WatchConnectivity (implicite, pas d'entitlement séparé)

Permissions Wear OS requises (déjà dans `AndroidManifest.xml`) :
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
├── watch-ios/                              # watchOS (XcodeGen-driven)
│   ├── project.yml                         # Source de vérité
│   ├── VIDAWatch.xcodeproj/                # Généré, pas versionné
│   ├── VIDAWatch/
│   │   ├── Sources/
│   │   │   ├── VIDAWatchApp.swift          # @main composition root
│   │   │   ├── Core/
│   │   │   │   ├── HealthMetrics.swift
│   │   │   │   ├── HealthDataSource.swift  # protocol
│   │   │   │   ├── HealthKitManager.swift
│   │   │   │   ├── SupabaseClient.swift    # actor REST minimal
│   │   │   │   ├── ComplicationDataBridge.swift  # shared 2 targets
│   │   │   │   ├── HealthComplicationSync.swift
│   │   │   │   ├── WatchMessages.swift     # Codable enum
│   │   │   │   └── WatchSessionManager.swift
│   │   │   ├── Stores/
│   │   │   │   ├── StreakStore.swift       # @MainActor @Observable
│   │   │   │   └── IntentionStore.swift    # + fallback déterministe/jour
│   │   │   ├── Theme/VIDATheme.swift       # emerald/gold/violet palette
│   │   │   └── Views/
│   │   │       ├── ContentView.swift       # TabView .page root
│   │   │       ├── ProgressRing.swift
│   │   │       ├── DashboardView.swift
│   │   │       ├── StreakView.swift
│   │   │       ├── IntentionView.swift
│   │   │       ├── BreathView.swift
│   │   │       ├── GratitudeView.swift
│   │   │       └── RitualTimerView.swift
│   │   ├── Resources/                      # Info.plist + entitlements + Assets
│   │   └── Tests/                          # XCTest — 8 suites, ~55 tests
│   ├── VIDAWatchComplication/              # WidgetKit (4 familles Streak + 3 Steps)
│   │   ├── VIDAComplicationBundle.swift
│   │   ├── StreakComplication.swift
│   │   ├── StepsComplication.swift
│   │   └── Info.plist
│   └── phone-bridge/                       # Hors target watchOS
│       └── PhoneSessionManager.swift       # pour wrap en Expo Module post-SASU
├── watch-android/                          # Wear OS (Gradle module)
│   ├── settings.gradle.kts                 # include(":wear")
│   ├── build.gradle.kts                    # AGP 8.10.1 + Kotlin 2.0.20
│   ├── gradle.properties
│   ├── local.properties                    # sdk.dir — .gitignore'd
│   ├── gradlew + gradle/wrapper/           # Gradle 8.11.1
│   └── wear/
│       ├── build.gradle.kts                # compileSdk 36, minSdk 30
│       ├── proguard-rules.pro
│       └── src/
│           ├── main/
│           │   ├── AndroidManifest.xml     # + <service> Tile + Complications
│           │   ├── java/dev/purama/vida/wear/
│           │   │   ├── MainActivity.kt
│           │   │   ├── core/               # HealthSnapshot, HealthConnectManager, SupabaseClient
│           │   │   ├── stores/             # StreakStore, IntentionStore (StateFlow)
│           │   │   ├── ui/
│           │   │   │   ├── VidaWearApp.kt  # HorizontalPager 6 pages
│           │   │   │   ├── theme/VidaColors.kt
│           │   │   │   └── screens/        # 6 écrans Compose
│           │   │   ├── tiles/VidaTileService.kt
│           │   │   ├── complications/      # StreakComplicationService, StepsComplicationService
│           │   │   ├── data/               # WearMessage + PhoneDataClient
│           │   │   └── util/Haptics.kt
│           │   └── res/                    # colors, strings, mipmap adaptive icon
│           └── test/java/dev/purama/vida/wear/
│               └── ...                     # JUnit — 22 tests
└── .github/workflows/watch-build.yml       # CI F8
```

## 5. watchOS (watch-ios/)

**Composition root** : `VIDAWatchApp.swift` instancie `SupabaseClient`,
`StreakStore`, `IntentionStore`, `HealthKitManager` et les injecte en
`@Environment`. `.task` active la `WatchSessionManager.shared` et déclenche
un premier refresh.

**Écrans** (6, navigables via `TabView(.page)` et la Digital Crown) :
- `DashboardView` — 3 anneaux concentriques steps/mindful/calories + HR inline + streak
- `StreakView` — 🔥 animé spring + haptic success + badge gratitude
- `IntentionView` — scroll + fallback déterministe/jour
- `BreathView` — cercle pulse 4-4-6 + haptics aux transitions + cycles counter
- `GratitudeView` — 3 prompts tap + dictation button → F5 push vers phone
- `RitualTimerView` — 1/3/5 min + CircularProgress + haptic tick par minute + success final

**Complications** : 2 widgets WidgetKit, 7 surfaces au total (4 familles Streak
+ 3 familles Steps). `ComplicationDataBridge` écrit dans
`UserDefaults(suiteName: "group.dev.purama.vida")` key `"vida.complication.snapshot"`.
Timeline reload 30 min. `StreakStore.applyRemoteUpdate` et
`HealthComplicationSync.sync` appellent `WidgetCenter.shared.reloadAllTimelines()`.

**WatchConnectivity** : `WatchSessionManager.shared.activate(...)` relie les
messages entrants aux stores. Outbox persistée dans UserDefaults si le phone
est hors portée, drainée automatiquement au retour de connectivité.

## 6. Wear OS (watch-android/)

**Composition root** : `MainActivity.kt` instancie `SupabaseClient`,
`HealthConnectManager`, `StreakStore`, `IntentionStore` et appelle
`VidaWearApp(...)`.

**Écrans** (6, navigables via `HorizontalPager`, équivalent strict du
TabView iOS) : Dashboard / Streak / Intention / Breath / Gratitude /
RitualTimer — même logique UX que le watchOS.

**Tile** : `VidaTileService` ProtoLayout avec freshness 15 min. Partage ses
données via `SharedPreferences("vida.wear.tiles")` — même snapshot utilisé
par les 2 complications.

**Complications** : `StreakComplicationService` + `StepsComplicationService`
déclarés en `<service>` avec `UPDATE_PERIOD_SECONDS=900`. Types supportés :
`SHORT_TEXT` et `RANGED_VALUE`.

**DataClient** : `PhoneDataClient` wrap `MessageClient` + `NodeClient`.
Path `/vida/message`. Broadcast à tous les nodes connectés, fallback log sur
erreur (fire-and-forget).

## 7. Partage du token Supabase

**iOS ↔ watchOS** : l'app RN iOS écrit le token Supabase dans
`UserDefaults(suiteName: "group.dev.purama.vida")` via un Expo native module
(à wrapper en F5+ post-SASU). La clé est
`"supabase.access_token"`. L'app watchOS lit la même suite dans
`SupabaseClient.currentAccessToken()` et tombe en fallback silencieux sur
`UserDefaults.standard` si la capability App Group n'est pas active (dev
sans signing).

**Android ↔ Wear OS** : `PhoneDataClient` reçoit `WearMessage.AuthTokenUpdate`
depuis l'app phone et persiste dans
`SharedPreferences("vida.wear.auth")` → clé `"supabase.access_token"`.
`SupabaseClient(context)` lit la même SharedPreferences.

Fallback en dernier recours : les deux plateformes peuvent appeler Supabase
directement si la montre a une connexion LTE, tant qu'elles ont un token
valide en cache.

## 8. Développement local

```bash
# watchOS (nécessite Xcode full — pas CLT)
cd ~/purama/vida-mobile/watch-ios
brew install xcodegen            # une seule fois
xcodegen generate
open VIDAWatch.xcodeproj
# ou CLI :
xcodebuild -scheme VIDAWatch \
  -destination 'platform=watchOS Simulator,name=Apple Watch Series 10 (46mm),OS=latest' \
  -configuration Debug \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_ALLOWED=NO \
  build test

# Wear OS (nécessite Android SDK + ANDROID_HOME)
cd ~/purama/vida-mobile/watch-android
export ANDROID_HOME=~/Library/Android/sdk
./gradlew :wear:tasks                  # lister tâches
./gradlew :wear:testDebugUnitTest      # JUnit unit tests (22 tests)
./gradlew :wear:assembleDebug          # build APK debug
```

Pré-requis machine locale :
- Xcode 15.4+ pour watchOS (≠ Command Line Tools)
- JDK 17 + Android SDK 36 + cmdline-tools pour Wear OS
- `brew install xcodegen gradle`

## 9. CI GitHub Actions

**Fichier** : `vida-mobile/.github/workflows/watch-build.yml`

**Déclencheurs** : push/PR touchant `watch-ios/**`, `watch-android/**`, ou le
workflow lui-même. + `workflow_dispatch` pour exécution manuelle.

**Jobs** :

### `watchos-build` (macos-14, matrix 3 tailles)
- Xcode 15.4 via `xcode-select`
- `brew install xcodegen` + `xcodegen generate`
- `xcodebuild build` et `xcodebuild test` sur 3 destinations :
  - Apple Watch Series 10 42mm
  - Apple Watch Series 10 46mm
  - Apple Watch Ultra 2 49mm
- Signing désactivé (`CODE_SIGNING_ALLOWED=NO`) — simulator-only
- Upload artefact `.app` pour la variante 46mm (14 jours rétention)

### `wear-build` (ubuntu-latest)
- JDK 17 Temurin
- `android-actions/setup-android@v3` → `platforms;android-36` + `build-tools;36.0.0`
- Cache Gradle (deps + wrapper)
- `./gradlew :wear:testDebugUnitTest` puis `:wear:assembleDebug`
- Upload test report (HTML) + APK debug (14 jours)

### `summary`
- Dépend des 2 jobs, fail si l'un échoue. Rend la route status CI claire.

**Pas de signing, pas de submit.** `eas submit` reste bloqué sur SASU —
ajouté en post-SASU quand les secrets Apple Team ID + Google Service Account
seront disponibles.

## 10. Post-SASU submit checklist

Une fois la SASU PURAMA immatriculée et l'Apple Developer Program souscrit
(99 €/an), exécuter cette checklist dans l'ordre :

### Apple / watchOS

- [ ] Enrollment Apple Developer Program via SASU (99 €/an)
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
- [ ] Wrapper `phone-bridge/PhoneSessionManager.swift` en Expo Module pour que le
      JS RN puisse appeler `pushAuthToken`, `pushStreak`, `pushIntention` et
      s'abonner à `onGratitudeCapture` / `onHealthSnapshot`
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
- [ ] Remplacer le vector placeholder `ic_launcher_foreground.xml` par l'icône
      VIDA produite via Pollinations+sharp (cf CLAUDE.md MOBILE icônes) —
      adaptive 1024×1024 pad 100px fond `#0A0A0F` + feuille émeraude `#10B981`
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
- [ ] Intégrer pointfreeco/swift-snapshot-testing (SPM) pour vrais snapshot
      tests d'image UI (test target watch-ios, référence PNG committée)

## 11. Risques et gotchas connus

- **App Groups sans signing réel** : `UserDefaults(suiteName:)` fallback
  silencieusement vers `UserDefaults.standard` si le group n'est pas activé.
  En dev local, la montre ne verra pas le token iPhone — c'est attendu,
  ça s'active au premier signing Apple Developer Program.
- **Complication refresh budget** : Apple impose un budget quotidien de
  refreshes pour les complications. On utilise `.after(now + 30 min)` pour
  ne pas vider le budget en une journée.
- **Health Connect review Google** : aucune app ne peut publier en production
  sans approbation écrite du formulaire. Préparer la vidéo et le texte à
  l'avance, ça sauve 2-3 semaines.
- **Wear OS standalone LTE** : si la montre est 4G (Apple Watch LTE, Pixel
  Watch LTE, Samsung Galaxy Watch LTE), elle peut fonctionner sans phone.
  Le code doit gérer ce cas via un fallback Supabase direct — déjà prévu
  dans `SupabaseClient`.
- **Apple Watch Series 3 et Ultra 1ère gen** : watchOS 10 ne tourne pas sur
  Series 3. Ne pas cibler < watchOS 10.0 vu la part de marché résiduelle et la
  dette de maintenance.
- **Prebuild conflict** : si `expo prebuild` est relancé sur vida-mobile,
  l'`ios/` et `android/` sont régénérés. Les dossiers `watch-ios/` et
  `watch-android/` vivent côté à côté et ne sont pas touchés par prebuild.
  Post-SASU, le wiring dans le projet principal se fait via Xcode GUI
  (subproject reference) et `settings.gradle.kts` include — pas via prebuild.
- **JSONObject en JVM unit tests** : Android fournit `org.json.JSONObject`
  en runtime framework seulement. Les tests unit Wear OS incluent
  `testImplementation("org.json:json:20240303")` pour disposer de la
  même API en JVM pur. Sans ça, `WearMessageTest` crashe avec
  `java.lang.RuntimeException` au décodage.
- **AGP + Gradle + compileSdk alignment** : AGP 8.10 exige Gradle 8.11+.
  Kotlin 2.0.20 + Compose plugin 2.0.20 requis pour AGP 8.10 et compileSdk 36.
  Si tu bumps l'un, vérifie la table de compat Android Studio avant.

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
- Wear Tiles ProtoLayout : https://developer.android.com/training/wearables/tiles
