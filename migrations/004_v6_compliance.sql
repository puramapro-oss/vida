-- VIDA V6 Compliance migration
-- Adds: subscription_started_at flag, retractions, fiscal_notifications, annual_summaries,
-- engagement_modes, ambassador_tiers, card_waitlist, referrals multi-level, V6 prime tranches.

SET search_path TO vida_sante, public;

-- 1. subscription_started_at flag (V6 §10, retrait bloqué 30j)
ALTER TABLE vida_sante.subscriptions
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;

UPDATE vida_sante.subscriptions
  SET subscription_started_at = COALESCE(trial_started_at, current_period_start, created_at)
  WHERE subscription_started_at IS NULL;

-- 2. Retractions (V6 §11)
CREATE TABLE IF NOT EXISTS vida_sante.retractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES vida_sante.subscriptions(id) ON DELETE CASCADE,
  app_id TEXT DEFAULT 'vida',
  requested_at TIMESTAMPTZ DEFAULT now(),
  amount_refunded_cents INTEGER DEFAULT 0,
  prime_deducted_cents INTEGER DEFAULT 0,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  reason TEXT,
  metadata JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_retractions_user ON vida_sante.retractions(user_id);
ALTER TABLE vida_sante.retractions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS retractions_own ON vida_sante.retractions;
CREATE POLICY retractions_own ON vida_sante.retractions FOR SELECT USING (user_id = auth.uid());

-- 3. Fiscal notifications (V6 §17)
CREATE TABLE IF NOT EXISTS vida_sante.fiscal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  palier INTEGER NOT NULL CHECK (palier IN (1500, 2500, 3000, 0)),
  sent_at TIMESTAMPTZ DEFAULT now(),
  email_sent BOOLEAN DEFAULT false,
  push_sent BOOLEAN DEFAULT false,
  acknowledged BOOLEAN DEFAULT false,
  UNIQUE(user_id, palier)
);
CREATE INDEX IF NOT EXISTS idx_fiscal_notif_user ON vida_sante.fiscal_notifications(user_id);
ALTER TABLE vida_sante.fiscal_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiscal_notif_own ON vida_sante.fiscal_notifications;
CREATE POLICY fiscal_notif_own ON vida_sante.fiscal_notifications FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS fiscal_notif_update_own ON vida_sante.fiscal_notifications;
CREATE POLICY fiscal_notif_update_own ON vida_sante.fiscal_notifications FOR UPDATE USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS vida_sante.annual_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_primes_cents INTEGER DEFAULT 0,
  total_parrainage_cents INTEGER DEFAULT 0,
  total_nature_cents INTEGER DEFAULT 0,
  total_marketplace_cents INTEGER DEFAULT 0,
  total_missions_cents INTEGER DEFAULT 0,
  total_annuel_cents INTEGER DEFAULT 0,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, year)
);
CREATE INDEX IF NOT EXISTS idx_annual_user_year ON vida_sante.annual_summaries(user_id, year);
ALTER TABLE vida_sante.annual_summaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS annual_own ON vida_sante.annual_summaries;
CREATE POLICY annual_own ON vida_sante.annual_summaries FOR SELECT USING (user_id = auth.uid());

-- 4. Engagement modes (V6 §10)
CREATE TABLE IF NOT EXISTS vida_sante.engagement_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  app_id TEXT DEFAULT 'vida',
  mode TEXT NOT NULL CHECK (mode IN ('standard', 'power12', 'titan24', 'eternal36')),
  multiplicateur NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  prime_cents INTEGER DEFAULT 0,
  debut TIMESTAMPTZ DEFAULT now(),
  fin TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  UNIQUE(user_id, app_id, debut)
);
CREATE INDEX IF NOT EXISTS idx_engagement_user ON vida_sante.engagement_modes(user_id);
ALTER TABLE vida_sante.engagement_modes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS engagement_own ON vida_sante.engagement_modes;
CREATE POLICY engagement_own ON vida_sante.engagement_modes FOR SELECT USING (user_id = auth.uid());

-- 5. Ambassador tiers (V6 §10)
CREATE TABLE IF NOT EXISTS vida_sante.ambassador_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  tier_name TEXT NOT NULL CHECK (tier_name IN ('bronze', 'argent', 'or', 'platine', 'diamant', 'legende', 'titan', 'dieu', 'eternel')),
  filleuls_required INTEGER NOT NULL,
  prime_cents INTEGER NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT now(),
  prime_paid BOOLEAN DEFAULT false,
  prime_paid_at TIMESTAMPTZ,
  UNIQUE(user_id, tier_name)
);
CREATE INDEX IF NOT EXISTS idx_ambassador_user ON vida_sante.ambassador_tiers(user_id);
ALTER TABLE vida_sante.ambassador_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ambassador_own ON vida_sante.ambassador_tiers;
CREATE POLICY ambassador_own ON vida_sante.ambassador_tiers FOR SELECT USING (user_id = auth.uid());

-- 6. Card waitlist (Phase 1 CardTeaser)
CREATE TABLE IF NOT EXISTS vida_sante.card_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  app_id TEXT DEFAULT 'vida',
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, app_id)
);
CREATE INDEX IF NOT EXISTS idx_card_waitlist_user ON vida_sante.card_waitlist(user_id);
ALTER TABLE vida_sante.card_waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS card_waitlist_own ON vida_sante.card_waitlist;
CREATE POLICY card_waitlist_own ON vida_sante.card_waitlist FOR ALL USING (user_id = auth.uid());

-- 7. Referrals 3-level extension (V6 §10 parrainage V4)
ALTER TABLE vida_sante.referrals
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 CHECK (level IN (1, 2, 3)),
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(4,3) DEFAULT 0.50,
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS thirty_day_verified_at TIMESTAMPTZ;

-- 8. Prime tranches V6 (J+0, M+1, M+2)
CREATE TABLE IF NOT EXISTS vida_sante.prime_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES vida_sante.subscriptions(id) ON DELETE CASCADE,
  tranche INTEGER NOT NULL CHECK (tranche IN (1, 2, 3)),
  amount_cents INTEGER NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  clawed_back BOOLEAN DEFAULT false,
  UNIQUE(user_id, subscription_id, tranche)
);
CREATE INDEX IF NOT EXISTS idx_prime_payouts_user ON vida_sante.prime_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_prime_payouts_scheduled ON vida_sante.prime_payouts(scheduled_for) WHERE paid = false;
ALTER TABLE vida_sante.prime_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS prime_payouts_own ON vida_sante.prime_payouts;
CREATE POLICY prime_payouts_own ON vida_sante.prime_payouts FOR SELECT USING (user_id = auth.uid());

-- 9. GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON vida_sante.retractions,
  vida_sante.fiscal_notifications, vida_sante.annual_summaries,
  vida_sante.engagement_modes, vida_sante.ambassador_tiers,
  vida_sante.card_waitlist, vida_sante.prime_payouts TO authenticated, service_role;
GRANT SELECT, INSERT ON vida_sante.retractions, vida_sante.card_waitlist TO anon;
