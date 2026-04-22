/**
 * VIDA — Abstraction Santé Native (CLAUDE.md §36.3)
 *
 * iOS   → Apple HealthKit (react-native-health)
 * Android → Google Health Connect (react-native-health-connect)
 * Web   → stub (renvoie 0s)
 *
 * Agrège auto : Whoop, Oura, Garmin, Fitbit, Polar, Withings, Eight Sleep,
 * Strava, Samsung Health, Apple Watch. 0€, 0 latence, RGPD parfait.
 *
 * ⚠️ Terra API obsolète 2026 ($399/mois) → native uniquement.
 */
import { Platform } from 'react-native'

export interface HealthMetrics {
  date: string // YYYY-MM-DD
  steps: number
  distanceMeters: number
  caloriesBurned: number
  heartRateAvg: number | null
  sleepMinutes: number
  mindfulnessMinutes: number
  source: 'healthkit' | 'health-connect' | 'web-stub' | 'unavailable'
}

export interface HealthPermissions {
  granted: boolean
  missing: string[]
}

export async function requestHealthPermissions(): Promise<HealthPermissions> {
  if (Platform.OS === 'ios') {
    return requestIOS()
  }
  if (Platform.OS === 'android') {
    return requestAndroid()
  }
  return { granted: false, missing: ['platform unsupported (web stub)'] }
}

export async function getDailyHealthMetrics(date?: Date): Promise<HealthMetrics> {
  const day = date ?? new Date()
  const iso = day.toISOString().slice(0, 10)

  if (Platform.OS === 'ios') {
    return readIOS(day, iso)
  }
  if (Platform.OS === 'android') {
    return readAndroid(day, iso)
  }
  return stubMetrics(iso)
}

// ─── iOS — HealthKit ──────────────────────────────────────────────────

async function requestIOS(): Promise<HealthPermissions> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AppleHealthKit = require('react-native-health').default
    const permissions = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.StepCount,
          AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          AppleHealthKit.Constants.Permissions.HeartRate,
          AppleHealthKit.Constants.Permissions.SleepAnalysis,
          AppleHealthKit.Constants.Permissions.MindfulSession,
        ],
        write: [AppleHealthKit.Constants.Permissions.MindfulSession],
      },
    }
    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (err: string | null) => {
        if (err) {
          resolve({ granted: false, missing: [err] })
          return
        }
        resolve({ granted: true, missing: [] })
      })
    })
  } catch (e: unknown) {
    return { granted: false, missing: [(e as Error).message ?? 'healthkit init failed'] }
  }
}

async function readIOS(day: Date, iso: string): Promise<HealthMetrics> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AppleHealthKit = require('react-native-health').default
    const startOfDay = new Date(day)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(day)
    endOfDay.setHours(23, 59, 59, 999)
    const range = { startDate: startOfDay.toISOString(), endDate: endOfDay.toISOString() }

    const [steps, distance, calories] = await Promise.all([
      getSample(AppleHealthKit, 'getStepCount', range),
      getSample(AppleHealthKit, 'getDistanceWalkingRunning', range),
      getSample(AppleHealthKit, 'getActiveEnergyBurned', range),
    ])
    return {
      date: iso,
      steps: Math.round((steps?.value as number) ?? 0),
      distanceMeters: Math.round((distance?.value as number) ?? 0),
      caloriesBurned: Math.round((calories?.value as number) ?? 0),
      heartRateAvg: null, // computed separately — not critical for MVP
      sleepMinutes: 0, // requires getSleepSamples aggregation — extended in later phase
      mindfulnessMinutes: 0,
      source: 'healthkit',
    }
  } catch {
    return { ...stubMetrics(iso), source: 'unavailable' }
  }
}

function getSample(
  hk: unknown,
  method: string,
  range: { startDate: string; endDate: string }
): Promise<{ value?: number }> {
  return new Promise((resolve) => {
    const kit = hk as Record<string, (r: unknown, cb: (e: string, d: unknown) => void) => void>
    kit[method]?.(range, (err, data) => {
      if (err || !data) resolve({})
      else resolve(data as { value?: number })
    })
  })
}

// ─── Android — Health Connect ─────────────────────────────────────────

async function requestAndroid(): Promise<HealthPermissions> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const hc = require('react-native-health-connect')
    const available = await hc.getSdkStatus()
    if (available !== 3 /* SDK_AVAILABLE */) {
      return { granted: false, missing: ['health-connect sdk not available'] }
    }
    const granted = await hc.requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'Distance' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'SleepSession' },
      { accessType: 'read', recordType: 'MindfulnessSession' },
    ])
    return {
      granted: granted.length > 0,
      missing: granted.length === 0 ? ['user declined'] : [],
    }
  } catch (e: unknown) {
    return { granted: false, missing: [(e as Error).message ?? 'health-connect init failed'] }
  }
}

async function readAndroid(day: Date, iso: string): Promise<HealthMetrics> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const hc = require('react-native-health-connect')
    const start = new Date(day)
    start.setHours(0, 0, 0, 0)
    const end = new Date(day)
    end.setHours(23, 59, 59, 999)
    const timeRangeFilter = {
      operator: 'between' as const,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    }

    const [steps, distance, calories] = await Promise.all([
      hc
        .readRecords('Steps', { timeRangeFilter })
        .then((r: { records: { count: number }[] }) =>
          r.records.reduce((s, rec) => s + (rec.count ?? 0), 0)
        )
        .catch(() => 0),
      hc
        .readRecords('Distance', { timeRangeFilter })
        .then((r: { records: { distance?: { inMeters: number } }[] }) =>
          r.records.reduce((s, rec) => s + (rec.distance?.inMeters ?? 0), 0)
        )
        .catch(() => 0),
      hc
        .readRecords('ActiveCaloriesBurned', { timeRangeFilter })
        .then((r: { records: { energy?: { inCalories: number } }[] }) =>
          r.records.reduce((s, rec) => s + (rec.energy?.inCalories ?? 0), 0)
        )
        .catch(() => 0),
    ])

    return {
      date: iso,
      steps: Math.round(steps),
      distanceMeters: Math.round(distance),
      caloriesBurned: Math.round(calories),
      heartRateAvg: null,
      sleepMinutes: 0,
      mindfulnessMinutes: 0,
      source: 'health-connect',
    }
  } catch {
    return { ...stubMetrics(iso), source: 'unavailable' }
  }
}

// ─── Web stub ─────────────────────────────────────────────────────────

function stubMetrics(iso: string): HealthMetrics {
  return {
    date: iso,
    steps: 0,
    distanceMeters: 0,
    caloriesBurned: 0,
    heartRateAvg: null,
    sleepMinutes: 0,
    mindfulnessMinutes: 0,
    source: 'web-stub',
  }
}
