-- ─────────────────────────────────────────────────────
-- RECONCILIATION WALLET ↔ STRIPE
-- ─────────────────────────────────────────────────────
-- Historise chaque exécution du cron /api/cron/reconcile.
-- Alerte-only : aucune correction automatique, toute anomalie
-- nécessite une revue humaine (cf task_plan.md P3).
--
-- vida_sante n'a NI table `payments` NI `wallet_transactions` : le
-- revenu passe par `transactions`, le split par `pool_balances`/
-- `pool_transactions` (reward 50%/asso 10%, sasu non poolé), les
-- primes par `prime_payouts`, le parrainage par `referral_earnings`.
-- `profiles.wallet_balance`/`pending_earnings` sont du CODE MORT
-- (jamais écrits nulle part, seulement lus côté dashboard — trouvé en
-- construisant cette réconciliation, documenté ERRORS.md, PAS corrigé
-- ici, hors périmètre de cette migration). La table `wallets` (utilisée
-- par le webhook pour créditer la tranche 1 de prime) N'EXISTE PAS EN
-- LIVE non plus — même famille de gap que satya (cf task_plan.md).

SET search_path TO vida_sante, public;

CREATE TABLE IF NOT EXISTS vida_sante.reconciliation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  invoices_without_transaction INTEGER NOT NULL DEFAULT 0,
  pool_split_mismatches INTEGER NOT NULL DEFAULT 0,
  referral_earning_mismatches INTEGER NOT NULL DEFAULT 0,
  overdue_unpaid_tranches INTEGER NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '[]'::jsonb,
  alert_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE vida_sante.reconciliation_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role reconciliation_reports" ON vida_sante.reconciliation_reports FOR ALL TO service_role USING (TRUE);
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_run_at ON vida_sante.reconciliation_reports(run_at DESC);
