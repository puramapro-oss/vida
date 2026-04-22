-- 008_openfisca_cache.sql — Cache des simulations OpenFisca (TTL 6h)
-- Évite de re-solliciter api.openfisca.fr pour le même profil utilisateur.

SET search_path TO vida_sante, public;

CREATE TABLE IF NOT EXISTS vida_sante.openfisca_cache (
  profil_hash   TEXT        PRIMARY KEY,        -- SHA-256 normalized profil
  result        JSONB       NOT NULL,           -- { montants, simule, aides_enrichies }
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_openfisca_cache_created
  ON vida_sante.openfisca_cache (created_at DESC);

COMMENT ON TABLE  vida_sante.openfisca_cache IS 'Cache des simulations OpenFisca, TTL applicatif 6h.';
COMMENT ON COLUMN vida_sante.openfisca_cache.profil_hash IS 'SHA-256 hex du profil normalisé (situation triée + age + revenus + enfants + loyer + region).';
COMMENT ON COLUMN vida_sante.openfisca_cache.result IS 'Résultat complet de /api/aides/search : montants OpenFisca + aides enrichies.';

-- RLS — lecture/écriture uniquement service_role (pas exposé aux clients).
ALTER TABLE vida_sante.openfisca_cache ENABLE ROW LEVEL SECURITY;

-- Purge job helper (à appeler par CRON ou à la main)
CREATE OR REPLACE FUNCTION vida_sante.purge_openfisca_cache()
RETURNS INT LANGUAGE SQL AS $$
  WITH deleted AS (
    DELETE FROM vida_sante.openfisca_cache
    WHERE created_at < now() - interval '24 hours'
    RETURNING 1
  )
  SELECT COUNT(*)::INT FROM deleted;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON vida_sante.openfisca_cache TO service_role;
GRANT EXECUTE ON FUNCTION vida_sante.purge_openfisca_cache() TO service_role;
