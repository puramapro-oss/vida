-- ─────────────────────────────────────────────────────
-- SOCLE LÉGAL NIYAMA — legal_acceptances / cookie_consents / account_deletion_requests
-- ─────────────────────────────────────────────────────
-- Copié depuis packages/legal/sql/001_legal_core.sql (__SCHEMA__ → vida_sante).
-- Corrige CONFORMITE.md Gap #9 : ces 3 tables n'existaient dans AUCUNE migration
-- trackée alors que `src/app/api/legal/accept/route.ts`,
-- `src/app/api/legal/cookie-consent/route.ts`, `src/app/api/account/delete/route.ts`
-- et `src/app/api/cron/account-deletion/route.ts` écrivent/lisent dedans.
--
-- Idempotent : CREATE TABLE IF NOT EXISTS + CREATE POLICY enveloppée dans
-- DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL; END $$ — rejouable sans erreur.

SET search_path TO vida_sante, public;

-- 1. Preuve d'acceptation CGU/CGV/mentions/politique de confidentialité,
--    versionnée et horodatée. UNIQUE (user_id, doc_type) permet l'upsert
--    idempotent utilisé par api/legal/accept/route.ts (onConflict 'user_id,doc_type').
CREATE TABLE IF NOT EXISTS vida_sante.legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('mentions', 'cgu', 'cgv', 'confidentialite')),
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip INET,
  user_agent TEXT,
  UNIQUE (user_id, doc_type)
);

CREATE INDEX IF NOT EXISTS legal_acceptances_user_id_idx ON vida_sante.legal_acceptances (user_id);

ALTER TABLE vida_sante.legal_acceptances ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY legal_acceptances_select_own ON vida_sante.legal_acceptances
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY legal_acceptances_insert_own ON vida_sante.legal_acceptances
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- UPDATE requise pour la branche UPDATE de l'upsert (onConflict 'user_id,doc_type').
DO $$ BEGIN
  CREATE POLICY legal_acceptances_update_own ON vida_sante.legal_acceptances
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Consentement cookies — 1 ligne par utilisateur authentifié (visiteur anonyme
--    reste en localStorage côté client, cf src/lib/legal/hooks/useCookieConsent.ts).
CREATE TABLE IF NOT EXISTS vida_sante.cookie_consents (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  necessaire BOOLEAN NOT NULL DEFAULT true,
  mesure BOOLEAN NOT NULL DEFAULT false,
  marketing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE vida_sante.cookie_consents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY cookie_consents_select_own ON vida_sante.cookie_consents
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY cookie_consents_insert_own ON vida_sante.cookie_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY cookie_consents_update_own ON vida_sante.cookie_consents
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Demandes de suppression de compte avec période de grâce 30j (RGPD art. 17).
--    Colonnes figées : api/account/delete/route.ts et api/cron/account-deletion/route.ts
--    en dépendent telles quelles.
CREATE TABLE IF NOT EXISTS vida_sante.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMPTZ NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'executing', 'completed', 'cancelled')),
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS account_deletion_requests_due_idx
  ON vida_sante.account_deletion_requests (status, scheduled_for);

ALTER TABLE vida_sante.account_deletion_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY account_deletion_requests_select_own ON vida_sante.account_deletion_requests
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY account_deletion_requests_insert_own ON vida_sante.account_deletion_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY account_deletion_requests_update_own ON vida_sante.account_deletion_requests
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- service_role (utilisé par api/cron/account-deletion/route.ts) contourne RLS nativement,
-- aucune policy supplémentaire n'est nécessaire pour le sweep quotidien.

-- 4. GRANTs — sans ceux-ci PostgREST refuse toute requête sur ces tables même avec RLS
--    correcte (RLS filtre les LIGNES, GRANT autorise la TABLE) : constaté sur `profiles`/
--    `faq_articles` (migrations/011_grant_service_role_profiles_faq.sql), même piège ici.
GRANT SELECT, INSERT, UPDATE ON vida_sante.legal_acceptances TO authenticated;
GRANT SELECT, INSERT, UPDATE ON vida_sante.cookie_consents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON vida_sante.account_deletion_requests TO authenticated;

-- service_role : le cron quotidien (api/cron/account-deletion/route.ts) lit/actualise
-- les demandes dues via un client service_role, en dehors de toute session utilisateur.
GRANT SELECT, UPDATE ON vida_sante.account_deletion_requests TO service_role;

-- Reload PostgREST schema cache pour prise en compte immédiate (cf migration 011).
NOTIFY pgrst, 'reload schema';
