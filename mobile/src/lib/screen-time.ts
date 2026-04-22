/**
 * VIDA — Abstraction Screen Time Native (CLAUDE.md §36.4)
 *
 * iOS   → FamilyControls + DeviceActivity (entitlement Apple gratuit mais nécessite
 *         approbation review pour usage consumer non-parental-controls)
 * Android → UsageStatsManager (permission PACKAGE_USAGE_STATS, déclarée dans app.json)
 *
 * Usage VIDA : missions "moins de 2h d'écran aujourd'hui = récompense".
 *
 * ⚠️ Libraries npm dispos (`react-native-screen-time-api`, `react-native-usage-stats-manager`)
 * ont des peer-deps très stales (react-native@^0.41) — bridging natif custom nécessaire.
 * Pour le MVP, stub retourne 0 min. Remplacer par Expo Module custom ou fork maintenu
 * lors du EAS dev-client build.
 *
 * TODO(post-MVP) : bridging natif via Expo Modules API.
 */
import { Platform } from 'react-native'

export interface ScreenTimeData {
  totalMinutes: number
  topApps: { appName: string; minutes: number }[]
  date: string
  source: 'ios-family-controls' | 'android-usage-stats' | 'web-stub' | 'unavailable'
  permissionGranted: boolean
}

export interface ScreenTimePermission {
  granted: boolean
  canRequest: boolean
  reason?: string
}

/**
 * Demande la permission d'accès au temps d'écran.
 * iOS : ouvre Family Controls (si entitlement).
 * Android : ouvre Settings → Usage Access.
 */
export async function requestScreenTimePermission(): Promise<ScreenTimePermission> {
  if (Platform.OS === 'ios') {
    return {
      granted: false,
      canRequest: false,
      reason:
        "iOS FamilyControls entitlement nécessite bridging Expo Module natif (à implémenter post-MVP)",
    }
  }
  if (Platform.OS === 'android') {
    return {
      granted: false,
      canRequest: true,
      reason:
        'Android UsageStatsManager nécessite bridging natif via Expo Module ou patch-package (à implémenter post-MVP)',
    }
  }
  return { granted: false, canRequest: false, reason: 'Unsupported platform (web stub)' }
}

/**
 * Retourne le temps d'écran cumulé aujourd'hui + top apps.
 * Stub MVP : renvoie 0 min jusqu'à implémentation native.
 */
export async function getTodayScreenTime(): Promise<ScreenTimeData> {
  const iso = new Date().toISOString().slice(0, 10)

  if (Platform.OS === 'ios') {
    return {
      totalMinutes: 0,
      topApps: [],
      date: iso,
      source: 'unavailable',
      permissionGranted: false,
    }
  }
  if (Platform.OS === 'android') {
    return {
      totalMinutes: 0,
      topApps: [],
      date: iso,
      source: 'unavailable',
      permissionGranted: false,
    }
  }
  return {
    totalMinutes: 0,
    topApps: [],
    date: iso,
    source: 'web-stub',
    permissionGranted: false,
  }
}

/**
 * Challenge "moins de X min d'écran aujourd'hui" — evaluation côté serveur idéalement,
 * mais peut être lue localement pour feedback UI immédiat.
 */
export async function isUnderScreenTimeLimit(limitMinutes: number): Promise<{
  underLimit: boolean
  currentMinutes: number
  remainingMinutes: number
}> {
  const data = await getTodayScreenTime()
  const remaining = Math.max(0, limitMinutes - data.totalMinutes)
  return {
    underLimit: data.totalMinutes <= limitMinutes,
    currentMinutes: data.totalMinutes,
    remainingMinutes: remaining,
  }
}
