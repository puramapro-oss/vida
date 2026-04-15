/**
 * PURAMA Phase management (V6 §19).
 * Phase 1 = points wallet only (current).
 * Phase 2 = Treezor card + IBAN + euros (after partnership signed).
 * Only PURAMA_PHASE env var switches behavior — no redeployment of other flags needed.
 */

export type PuramaPhase = 1 | 2;
export type WalletMode = "points" | "euros";

export function getPhase(): PuramaPhase {
  const raw = process.env.NEXT_PUBLIC_PURAMA_PHASE ?? process.env.PURAMA_PHASE ?? "1";
  return raw === "2" ? 2 : 1;
}

export function getWalletMode(): WalletMode {
  const raw = process.env.NEXT_PUBLIC_WALLET_MODE ?? process.env.WALLET_MODE ?? "points";
  return raw === "euros" ? "euros" : "points";
}

export function isCardAvailable(): boolean {
  return (process.env.NEXT_PUBLIC_CARD_AVAILABLE ?? process.env.CARD_AVAILABLE) === "true";
}

export function isIbanAvailable(): boolean {
  return process.env.IBAN_AVAILABLE === "true";
}

export function isWithdrawalAvailable(): boolean {
  return process.env.WITHDRAWAL_AVAILABLE === "true";
}

export function isPrimeCardActive(): boolean {
  return process.env.PRIME_CARD_ACTIVE === "true";
}

export function isTreezorActive(): boolean {
  return process.env.TREEZOR_ACTIVE === "true";
}

export function isBinanceActive(): boolean {
  return process.env.BINANCE_ACTIVE === "true";
}

export function isTradeRepublicActive(): boolean {
  return process.env.TRADE_REPUBLIC_ACTIVE === "true";
}

/** Prime schedule : phase1 = 3 paliers (J1 25€, J30 25€, J60 50€). phase2 = 100€ J1. */
export function getPrimeMode(): "phase1" | "phase2" {
  return process.env.PRIME_MODE === "phase2" ? "phase2" : "phase1";
}

export const PRIME_TRANCHES = {
  phase1: [
    { day: 0, amount: 25 },
    { day: 30, amount: 25 },
    { day: 60, amount: 50 },
  ],
  phase2: [{ day: 0, amount: 100 }],
} as const;

/** Retrait bloqué 30j après souscription (V6 §10 règles techniques prime). */
export function canWithdraw(subscriptionStartedAt: Date | string | null): boolean {
  if (!subscriptionStartedAt) return false;
  if (!isWithdrawalAvailable()) return false;
  const start = new Date(subscriptionStartedAt);
  const unlockAt = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  return new Date() >= unlockAt;
}

/** Points → € conversion (1pt = 0.01€). */
export const POINTS_PER_EURO = 100;
export const EUROS_PER_POINT = 0.01;

export function pointsToEuros(points: number): number {
  return Math.round(points * EUROS_PER_POINT * 100) / 100;
}

export function eurosToPoints(euros: number): number {
  return Math.round(euros * POINTS_PER_EURO);
}
