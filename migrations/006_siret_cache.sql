-- 006_siret_cache.sql — Cache INSEE Sirene V3.11 (TTL 30 jours)
-- Évite les appels répétés à l'API INSEE pour le même SIRET.

SET search_path TO vida_sante, public;

CREATE TABLE IF NOT EXISTS vida_sante.siret_cache (
  siret          text        PRIMARY KEY,
  data           jsonb       NOT NULL,
  fetched_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE vida_sante.siret_cache IS 'Cache INSEE Sirene V3.11 — TTL 30 jours géré applicativement.';
COMMENT ON COLUMN vida_sante.siret_cache.siret IS 'SIRET 14 chiffres (clé primaire).';
COMMENT ON COLUMN vida_sante.siret_cache.data IS 'Réponse normalisée INSEE (denomination, activite, adresse, statut).';
COMMENT ON COLUMN vida_sante.siret_cache.fetched_at IS 'Date du dernier appel INSEE pour ce SIRET.';

CREATE INDEX IF NOT EXISTS idx_siret_cache_fetched ON vida_sante.siret_cache(fetched_at);

ALTER TABLE vida_sante.siret_cache ENABLE ROW LEVEL SECURITY;

-- Lecture : tout user authentifié (le cache est public côté lecture)
CREATE POLICY "siret_cache_read" ON vida_sante.siret_cache
  FOR SELECT USING (auth.role() = 'authenticated');

-- Écriture : service_role uniquement (l'API route utilise le service client)
CREATE POLICY "siret_cache_write_service" ON vida_sante.siret_cache
  FOR ALL USING (auth.role() = 'service_role');
