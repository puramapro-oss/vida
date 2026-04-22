-- 010_aide_simulations.sql — Traçabilité des simulations /financer et /api/aides/search
-- Permet : stats admin (conversion, apps populaires), ré-affichage dernière simulation
-- par user, détection fraude (100 simulations/h = bot).

SET search_path TO vida_sante, public;

CREATE TABLE IF NOT EXISTS vida_sante.aide_simulations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL si visiteur anonyme
  profil_hash    TEXT        NOT NULL,
  situation      TEXT[]      NOT NULL,
  age            INT,
  revenus_mensuels INT,
  enfants        INT,
  loyer_mensuel  INT,
  region         TEXT,
  aides_count    INT         NOT NULL DEFAULT 0,
  cumul_estime   INT         NOT NULL DEFAULT 0,
  simulation_ok  BOOLEAN     NOT NULL DEFAULT FALSE,
  cache_hit      BOOLEAN     NOT NULL DEFAULT FALSE,
  source         TEXT        NOT NULL CHECK (source IN ('openfisca', 'static')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aide_simulations_user     ON vida_sante.aide_simulations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aide_simulations_created  ON vida_sante.aide_simulations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aide_simulations_source   ON vida_sante.aide_simulations (source);

COMMENT ON TABLE  vida_sante.aide_simulations IS 'Traçabilité des simulations d''aides (/financer + /api/aides/search).';
COMMENT ON COLUMN vida_sante.aide_simulations.source IS 'openfisca = via /api/aides/search, static = via /api/financer/match';
COMMENT ON COLUMN vida_sante.aide_simulations.profil_hash IS 'SHA-256 du profil normalisé (même logique que openfisca_cache).';
COMMENT ON COLUMN vida_sante.aide_simulations.cache_hit IS 'Vrai si la simulation OpenFisca a été servie depuis openfisca_cache.';

-- RLS : user voit les siennes, super_admin voit tout, anonymous 0.
ALTER TABLE vida_sante.aide_simulations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aide_simulations_owner_select ON vida_sante.aide_simulations;
CREATE POLICY aide_simulations_owner_select
  ON vida_sante.aide_simulations
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role écrit tout (via createServiceClient depuis l'API)
GRANT SELECT, INSERT ON vida_sante.aide_simulations TO service_role;

-- Purge automatique >6 mois (RGPD minimisation)
CREATE OR REPLACE FUNCTION vida_sante.purge_aide_simulations()
RETURNS INT LANGUAGE SQL AS $$
  WITH deleted AS (
    DELETE FROM vida_sante.aide_simulations
    WHERE created_at < now() - interval '6 months'
    RETURNING 1
  )
  SELECT COUNT(*)::INT FROM deleted;
$$;

GRANT EXECUTE ON FUNCTION vida_sante.purge_aide_simulations() TO service_role;
