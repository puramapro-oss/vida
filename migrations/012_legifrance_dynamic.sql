-- 012 — C7 F1 : Schema Postgres pour RAG Legifrance dynamique
-- Cache warm des articles pour les 3 codes ciblés :
--   - LEGITEXT000006072050 Code du travail
--   - LEGITEXT000006073189 Code de la sécurité sociale
--   - LEGITEXT000006074069 Code de l'action sociale et des familles (CASF)
--
-- Note : schéma vida_sante owner = supabase_admin (pas postgres),
-- donc cette migration s'applique via `docker exec -i supabase-db psql -U supabase_admin`.

SET search_path TO vida_sante, public;

-- ══════════════════════════════════════════════════════════════════
-- Table principale : articles Legifrance en cache
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS vida_sante.legifrance_articles (
  cid              VARCHAR(64)  PRIMARY KEY,           -- ID Legifrance stable (ex "LEGIARTI000006742692")
  code             VARCHAR(32)  NOT NULL,              -- LEGITEXT000006072050 etc.
  code_nom         VARCHAR(128) NOT NULL,              -- "Code du travail"
  numero           VARCHAR(32)  NOT NULL,              -- "L1234-5", "R131-1", etc.
  titre            TEXT         NOT NULL DEFAULT '',   -- Libellé court de l'article
  texte            TEXT         NOT NULL,              -- Contenu complet de l'article
  date_debut       TIMESTAMPTZ,                        -- Date d'entrée en vigueur
  date_fin         TIMESTAMPTZ,                        -- NULL si article actuellement en vigueur
  etat             VARCHAR(16)  NOT NULL DEFAULT 'VIGUEUR', -- VIGUEUR | ABROGE | MODIFIE | PERIME
  url_legifrance   TEXT         NOT NULL,              -- URL canonique legifrance.gouv.fr
  version_num      INT          NOT NULL DEFAULT 1,    -- Incrément à chaque update
  last_synced_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  -- FTS tsvector français généré automatiquement (pas STORED car PG 11+ : GENERATED ALWAYS)
  fts_fr           TSVECTOR     GENERATED ALWAYS AS (
                     to_tsvector('french', coalesce(titre, '') || ' ' || coalesce(texte, ''))
                   ) STORED
);

-- Index pour recherche full-text rapide (GIN sur tsvector)
CREATE INDEX IF NOT EXISTS idx_legifrance_fts
  ON vida_sante.legifrance_articles USING GIN (fts_fr);

-- Index pour filtrer par code + numéro (lookup direct)
CREATE UNIQUE INDEX IF NOT EXISTS idx_legifrance_code_numero
  ON vida_sante.legifrance_articles (code, numero);

-- Index pour filtrer par état (n'afficher que les articles VIGUEUR par défaut)
CREATE INDEX IF NOT EXISTS idx_legifrance_etat
  ON vida_sante.legifrance_articles (etat) WHERE etat = 'VIGUEUR';

-- Index temporel pour sync incrémental
CREATE INDEX IF NOT EXISTS idx_legifrance_last_synced
  ON vida_sante.legifrance_articles (last_synced_at DESC);

-- ══════════════════════════════════════════════════════════════════
-- Table : jobs de sync (tracking long-running)
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS vida_sante.sync_legifrance_jobs (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  codes            VARCHAR(32)[] NOT NULL,             -- Liste des LEGITEXT à synchroniser
  status           VARCHAR(16)  NOT NULL DEFAULT 'pending', -- pending | running | completed | failed
  source           VARCHAR(16)  NOT NULL DEFAULT 'piste',   -- piste | opendata | manual
  triggered_by     VARCHAR(32)  NOT NULL DEFAULT 'cron',    -- cron | admin:<email> | manual
  articles_synced  INT          NOT NULL DEFAULT 0,
  articles_failed  INT          NOT NULL DEFAULT 0,
  errors_json      JSONB        DEFAULT '[]'::jsonb,   -- Top 10 erreurs détaillées
  started_at       TIMESTAMPTZ,
  ended_at         TIMESTAMPTZ,
  duration_s       INT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_status
  ON vida_sante.sync_legifrance_jobs (status, created_at DESC);

-- ══════════════════════════════════════════════════════════════════
-- Table : logs détaillés par article (troubleshooting)
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS vida_sante.sync_legifrance_logs (
  id           BIGSERIAL    PRIMARY KEY,
  job_id       UUID         REFERENCES vida_sante.sync_legifrance_jobs(id) ON DELETE CASCADE,
  cid          VARCHAR(64),
  level        VARCHAR(8)   NOT NULL DEFAULT 'info',   -- info | warn | error
  message      TEXT         NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_job
  ON vida_sante.sync_legifrance_logs (job_id, created_at DESC);

-- ══════════════════════════════════════════════════════════════════
-- RLS : lecture publique (anon) des articles VIGUEUR
--       Écriture service_role uniquement (ingestion + CRON)
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE vida_sante.legifrance_articles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.sync_legifrance_jobs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.sync_legifrance_logs      ENABLE ROW LEVEL SECURITY;

-- Articles VIGUEUR lisibles par tous
DROP POLICY IF EXISTS legifrance_articles_read_vigueur ON vida_sante.legifrance_articles;
CREATE POLICY legifrance_articles_read_vigueur
  ON vida_sante.legifrance_articles
  FOR SELECT
  USING (etat = 'VIGUEUR');

-- Jobs et logs : super_admin uniquement (lecture côté app via service_role ensuite)
DROP POLICY IF EXISTS sync_jobs_read_admin ON vida_sante.sync_legifrance_jobs;
CREATE POLICY sync_jobs_read_admin
  ON vida_sante.sync_legifrance_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vida_sante.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS sync_logs_read_admin ON vida_sante.sync_legifrance_logs;
CREATE POLICY sync_logs_read_admin
  ON vida_sante.sync_legifrance_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vida_sante.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'super_admin'
    )
  );

-- ══════════════════════════════════════════════════════════════════
-- GRANTs : service_role peut tout faire, anon/authenticated peut lire
-- ══════════════════════════════════════════════════════════════════
GRANT SELECT ON vida_sante.legifrance_articles       TO anon, authenticated;
GRANT ALL    ON vida_sante.legifrance_articles       TO service_role;
GRANT ALL    ON vida_sante.sync_legifrance_jobs      TO service_role;
GRANT ALL    ON vida_sante.sync_legifrance_logs      TO service_role;
GRANT SELECT ON vida_sante.sync_legifrance_jobs      TO authenticated; -- super_admin filtré par RLS
GRANT SELECT ON vida_sante.sync_legifrance_logs      TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE vida_sante.sync_legifrance_logs_id_seq TO service_role;

-- ══════════════════════════════════════════════════════════════════
-- Reload PostgREST schema cache
-- ══════════════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';
