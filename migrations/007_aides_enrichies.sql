-- 007_aides_enrichies.sql — Enrichissement table aides : variables OpenFisca + refs légales

SET search_path TO vida_sante, public;

ALTER TABLE vida_sante.aides
  ADD COLUMN IF NOT EXISTS openfisca_variable TEXT,
  ADD COLUMN IF NOT EXISTS legifrance_refs    TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS simulation_possible BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN vida_sante.aides.openfisca_variable IS 'Nom de la variable OpenFisca pour simulation de montant réel.';
COMMENT ON COLUMN vida_sante.aides.legifrance_refs    IS 'Articles de loi ou décrets de référence.';
COMMENT ON COLUMN vida_sante.aides.simulation_possible IS 'Vrai si le montant peut être calculé via OpenFisca.';

-- Mapping OpenFisca + refs légales pour les aides principales
UPDATE vida_sante.aides SET
  openfisca_variable   = 'rsa',
  simulation_possible  = TRUE,
  legifrance_refs      = ARRAY[
    'Art. L262-1 Code de l''action sociale et des familles',
    'Décret n°2009-404 du 15 avril 2009'
  ]
WHERE slug = 'rsa';

UPDATE vida_sante.aides SET
  openfisca_variable   = 'aide_logement',
  simulation_possible  = TRUE,
  legifrance_refs      = ARRAY[
    'Art. L821-1 Code de la construction et de l''habitation',
    'Art. R823-1 et suivants CCH'
  ]
WHERE slug = 'apl';

UPDATE vida_sante.aides SET
  openfisca_variable   = 'als',
  simulation_possible  = TRUE,
  legifrance_refs      = ARRAY[
    'Art. L831-1 Code de la construction et de l''habitation',
    'Art. L542-1 Code de la sécurité sociale'
  ]
WHERE slug = 'als';

UPDATE vida_sante.aides SET
  openfisca_variable   = 'prime_activite',
  simulation_possible  = TRUE,
  legifrance_refs      = ARRAY[
    'Art. L842-1 Code de la sécurité sociale',
    'Décret n°2015-1709 du 21 décembre 2015'
  ]
WHERE slug = 'prime-activite';

UPDATE vida_sante.aides SET
  openfisca_variable   = 'aah',
  simulation_possible  = TRUE,
  legifrance_refs      = ARRAY[
    'Art. L821-1 Code de la sécurité sociale',
    'Décret n°2005-725 du 29 juin 2005'
  ]
WHERE slug = 'aah';

UPDATE vida_sante.aides SET
  openfisca_variable   = 'cheque_energie',
  simulation_possible  = TRUE,
  legifrance_refs      = ARRAY[
    'Art. L124-1 Code de l''énergie',
    'Décret n°2016-555 du 6 mai 2016'
  ]
WHERE slug IN ('cheque-energie', 'cheque_energie', 'cheque-énergie');

UPDATE vida_sante.aides SET
  legifrance_refs = ARRAY[
    'Art. L5421-1 Code du travail',
    'Art. L5422-1 Code du travail',
    'Règlement général annexé à la convention Unédic du 26 novembre 2019'
  ]
WHERE slug = 'are';

UPDATE vida_sante.aides SET
  legifrance_refs = ARRAY[
    'Art. L5423-1 Code du travail',
    'Décret n°2011-1992 du 27 décembre 2011'
  ]
WHERE slug = 'ass';

UPDATE vida_sante.aides SET
  legifrance_refs = ARRAY[
    'Art. L245-1 Code de l''action sociale et des familles',
    'Décret n°2005-1591 du 19 décembre 2005'
  ]
WHERE slug = 'pch';

UPDATE vida_sante.aides SET
  legifrance_refs = ARRAY[
    'Art. L531-1 Code de la sécurité sociale (PAJE)',
    'Décret n°2004-373 du 29 avril 2004'
  ]
WHERE slug IN ('paje-prime', 'paje-base');

-- Index pour la nouvelle colonne
CREATE INDEX IF NOT EXISTS idx_aides_simulation ON vida_sante.aides(simulation_possible) WHERE active;
