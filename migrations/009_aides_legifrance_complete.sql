-- 009_aides_legifrance_complete.sql
-- Complète legifrance_refs pour les 34 aides restantes (post 007 qui n'avait couvert
-- que 10 aides socles RSA/APL/ALS/PA/AAH/Chèque énergie/ARE/ASS/PCH/PAJE).
-- OBJECTIF : chaque aide affiche sa base légale officielle dans /financer.

SET search_path TO vida_sante, public;

-- EMPLOI / CRÉATION ENTREPRISE
UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L131-6-4 Code de la sécurité sociale',
  'Décret n°2019-1215 du 20 novembre 2019'
] WHERE slug = 'acre';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L5422-2 Code du travail',
  'Règlement général annexé à la convention Unédic du 26 novembre 2019'
] WHERE slug = 'arce';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L127-1 Code de commerce',
  'Art. R127-1 à R127-10 Code de commerce'
] WHERE slug = 'cape';

-- LOGEMENT
UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Convention Action Logement du 25 avril 2019',
  'Règlement Action Logement Services — fiche ''Mobili-Jeune'''
] WHERE slug = 'action-logement-jeune';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L542-1 Code de la sécurité sociale',
  'Art. R542-1 à R542-19 CSS'
] WHERE slug = 'alf';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L115-3 Code de l''action sociale et des familles',
  'Loi n°90-449 du 31 mai 1990 (loi Besson)',
  'Décret n°2005-212 du 2 mars 2005'
] WHERE slug = 'fsl';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L313-19-2 Code de la construction et de l''habitation',
  'Convention quinquennale État — Action Logement'
] WHERE slug = 'loca-pass';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L313-1 Code de la construction et de l''habitation',
  'Règlement Visale — Action Logement Services'
] WHERE slug = 'visale';

-- SANTÉ
UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L251-1 Code de l''action sociale et des familles',
  'Art. R251-1 à R251-5 CASF'
] WHERE slug = 'ame';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L861-1 Code de la sécurité sociale',
  'Décret n°2019-599 du 18 juin 2019'
] WHERE slug = 'css';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L861-1 Code de la sécurité sociale',
  'Art. D861-1 à D861-3 CSS'
] WHERE slug = 'c2s-participation';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Convention collective CARSAT — action sanitaire et sociale'
] WHERE slug = 'aide-mutuelle-retraite';

-- FAMILLE
UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L168-8 Code de la sécurité sociale',
  'Décret n°2020-1208 du 1er octobre 2020'
] WHERE slug = 'ajpa';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L521-1 Code de la sécurité sociale',
  'Art. R521-1 à R521-2 CSS'
] WHERE slug = 'allocation-familiale';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L522-1 Code de la sécurité sociale',
  'Art. D522-1 à D522-2 CSS'
] WHERE slug = 'complement-familial';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L523-1 Code de la sécurité sociale',
  'Art. R523-1 à R523-5 CSS'
] WHERE slug = 'asf';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L531-5 Code de la sécurité sociale (CMG)',
  'Art. R531-5 à R531-8 CSS',
  'Décret n°2004-1441 du 23 décembre 2004'
] WHERE slug = 'cmg';

-- HANDICAP
UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L541-1 Code de la sécurité sociale (AEEH)',
  'Art. R541-1 à R541-10 CSS',
  'Décret n°2002-423 du 29 mars 2002'
] WHERE slug = 'aeeh';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L241-3 Code de l''action sociale et des familles',
  'Décret n°2016-1849 du 23 décembre 2016 (Carte Mobilité Inclusion)'
] WHERE slug = 'carte-mobilite';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L821-1-2 Code de la sécurité sociale (MVA)',
  'Art. R821-5 CSS'
] WHERE slug = 'mva';

-- SENIOR
UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L232-1 Code de l''action sociale et des familles (APA)',
  'Art. L232-2 à L232-28 CASF'
] WHERE slug = 'apa';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L815-1 Code de la sécurité sociale (ASPA)',
  'Art. R815-1 à R815-80 CSS',
  'Décret n°2007-56 du 12 janvier 2007'
] WHERE slug = 'aspa';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L313-1-3 Code de l''action sociale et des familles',
  'Loi n°2015-1776 du 28 décembre 2015 (ASV)'
] WHERE slug = 'aide-aidant';

-- JEUNE / ÉTUDIANT
UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. D821-1 Code de l''éducation',
  'Arrêté annuel MESRI — barèmes échelons bourses CROUS'
] WHERE slug = 'bourse-crous';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L611-1 Code de l''éducation',
  'Arrêté annuel MESRI — aide mobilité Parcoursup'
] WHERE slug = 'aide-mobilite-parcoursup';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Convention Action Logement du 25 avril 2019 — fiche Permis à 1€',
  'Décret n°2005-1225 du 29 septembre 2005'
] WHERE slug = 'aide-permis-1euro';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L6222-27-1 Code du travail (aide permis apprentis)',
  'Décret n°2018-1347 du 28 décembre 2018'
] WHERE slug = 'aide-permis-apprenti';

-- ÉNERGIE / LOGEMENT
UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. L124-2 Code de l''énergie (chèque énergie complémentaire bois)',
  'Décret n°2022-1552 du 8 décembre 2022'
] WHERE slug = 'cheque-bois';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Décret n°2018-1043 du 28 novembre 2018 (coups de pouce CEE)',
  'Arrêté du 29 décembre 2014 (dispositif CEE)'
] WHERE slug = 'coup-de-pouce';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. 244 quater U Code général des impôts (éco-PTZ)',
  'Décret n°2009-344 du 30 mars 2009'
] WHERE slug = 'eco-ptz';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Décret n°2020-26 du 14 janvier 2020 (MaPrimeRénov'')',
  'Arrêté du 14 janvier 2020 (barèmes)'
] WHERE slug = 'maprimerenov';

-- REVENU / PONCTUEL
UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Décret annuel — prime exceptionnelle de fin d''année',
  'Art. L262-8 Code de l''action sociale et des familles (base RSA)'
] WHERE slug = 'prime-noel';

-- FISCAL ZFRR (Frasne 25560 — relevant pour SASU PURAMA)
UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. 44 quindecies Code général des impôts (ZFRR exonération IS)',
  'Art. 1465 A CGI (ZFRR CFE)',
  'Loi de finances 2024 — périmètre ZFRR'
] WHERE slug = 'zfrr-exoneration';

UPDATE vida_sante.aides SET legifrance_refs = ARRAY[
  'Art. 1383 F Code général des impôts (exonération TFPB ZFRR)',
  'Art. 1639 A bis CGI (délibération collectivités)'
] WHERE slug = 'zfrr-tfpb';

-- Sanity check — après cette migration, 0 aide active sans legifrance_refs
-- (hors cas documenté). Query à lancer manuellement :
--   SELECT slug FROM vida_sante.aides
--   WHERE active AND COALESCE(array_length(legifrance_refs,1),0) = 0;
