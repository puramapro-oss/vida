-- 005_cross_promos.sql — V7 cross-promotion tracking
-- Tracks user clicks from other Purama apps (via /go/[source]) and conversions (coupon WELCOME50 applied).

SET search_path TO vida_sante, public;

CREATE TABLE IF NOT EXISTS vida_sante.cross_promos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_app text NOT NULL,
  target_app text NOT NULL DEFAULT 'vida',
  user_id uuid REFERENCES vida_sante.profiles(id) ON DELETE SET NULL,
  session_id text,
  coupon_used text,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  converted boolean NOT NULL DEFAULT false,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cross_promos_user ON vida_sante.cross_promos(user_id);
CREATE INDEX IF NOT EXISTS idx_cross_promos_source ON vida_sante.cross_promos(source_app);
CREATE INDEX IF NOT EXISTS idx_cross_promos_session ON vida_sante.cross_promos(session_id);
CREATE INDEX IF NOT EXISTS idx_cross_promos_converted ON vida_sante.cross_promos(converted) WHERE converted = true;

ALTER TABLE vida_sante.cross_promos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cross_promos_own" ON vida_sante.cross_promos;
CREATE POLICY "cross_promos_own" ON vida_sante.cross_promos
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cross_promos_service_all" ON vida_sante.cross_promos;
CREATE POLICY "cross_promos_service_all" ON vida_sante.cross_promos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON vida_sante.cross_promos TO authenticated;
GRANT ALL ON vida_sante.cross_promos TO service_role;

-- Ambassadeur applications (postuler)
CREATE TABLE IF NOT EXISTS vida_sante.ambassador_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES vida_sante.profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  social_links text,
  motivation text NOT NULL,
  audience_size integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','approved','rejected')),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ambassador_applications_user ON vida_sante.ambassador_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_applications_status ON vida_sante.ambassador_applications(status);

ALTER TABLE vida_sante.ambassador_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ambassador_apps_own" ON vida_sante.ambassador_applications;
CREATE POLICY "ambassador_apps_own" ON vida_sante.ambassador_applications
  FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "ambassador_apps_insert" ON vida_sante.ambassador_applications;
CREATE POLICY "ambassador_apps_insert" ON vida_sante.ambassador_applications
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "ambassador_apps_service_all" ON vida_sante.ambassador_applications;
CREATE POLICY "ambassador_apps_service_all" ON vida_sante.ambassador_applications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT ON vida_sante.ambassador_applications TO anon, authenticated;
GRANT ALL ON vida_sante.ambassador_applications TO service_role;

COMMENT ON TABLE vida_sante.cross_promos IS 'V7 cross-promotion click+conversion tracking (/go/[source]?coupon=WELCOME50)';
COMMENT ON TABLE vida_sante.ambassador_applications IS 'V7 Ambassadeur programme — formulaire postuler';
