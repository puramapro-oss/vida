-- VIDA — /financer module
-- Table `aides` + 45 aides réelles françaises + RLS lecture publique

SET search_path = vida_sante, public;

CREATE TABLE IF NOT EXISTS vida_sante.aides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  nom             TEXT NOT NULL,
  type_aide       TEXT NOT NULL, -- revenu | logement | sante | handicap | famille | jeune | emploi | energie | senior | fiscal | transport
  organisme       TEXT NOT NULL, -- CAF | Pole Emploi | MSA | Region | Etat | ANAH | Commune
  profil_eligible TEXT[] NOT NULL DEFAULT '{}', -- tags: etudiant, demandeur_emploi, salarie, independant, retraite, parent, famille_monoparentale, handicape, senior, jeune, locataire, proprietaire, zfrr, tous
  situation_min_rev INTEGER, -- revenu mensuel max pour eligibilite (cents € ou null)
  situation_max_rev INTEGER,
  montant_max     INTEGER NOT NULL DEFAULT 0, -- montant estimatif annuel en € (pas centimes pour simplicité)
  periodicite     TEXT NOT NULL DEFAULT 'mensuelle', -- mensuelle | annuelle | ponctuelle
  url_officielle  TEXT NOT NULL,
  description     TEXT NOT NULL,
  region          TEXT, -- null = national, sinon code region
  cumulable       BOOLEAN NOT NULL DEFAULT TRUE,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aides_type ON vida_sante.aides(type_aide) WHERE active;
CREATE INDEX IF NOT EXISTS idx_aides_profil ON vida_sante.aides USING GIN(profil_eligible) WHERE active;

ALTER TABLE vida_sante.aides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aides_public_read ON vida_sante.aides;
CREATE POLICY aides_public_read ON vida_sante.aides FOR SELECT USING (active = TRUE);

-- Suivi des demandes par user
CREATE TABLE IF NOT EXISTS vida_sante.aide_applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aide_id     UUID NOT NULL REFERENCES vida_sante.aides(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending', -- pending | submitted | approved | rejected
  profil_snapshot JSONB NOT NULL DEFAULT '{}',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, aide_id)
);

ALTER TABLE vida_sante.aide_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS apps_own_read ON vida_sante.aide_applications;
CREATE POLICY apps_own_read ON vida_sante.aide_applications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS apps_own_write ON vida_sante.aide_applications;
CREATE POLICY apps_own_write ON vida_sante.aide_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS apps_own_update ON vida_sante.aide_applications;
CREATE POLICY apps_own_update ON vida_sante.aide_applications FOR UPDATE USING (auth.uid() = user_id);

-- === SEED 45 aides réelles ===
INSERT INTO vida_sante.aides (slug, nom, type_aide, organisme, profil_eligible, montant_max, periodicite, url_officielle, description) VALUES
-- Revenus (6)
('rsa', 'RSA — Revenu de Solidarité Active', 'revenu', 'CAF', ARRAY['demandeur_emploi','salarie','independant','parent','famille_monoparentale'], 7200, 'mensuelle', 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/revenu-de-solidarite-active-rsa', 'Revenu minimum garanti dès 25 ans (ou avant sous conditions). Montant de base ~635€/mois pour une personne seule.'),
('prime-activite', 'Prime d''activité', 'revenu', 'CAF', ARRAY['salarie','independant','jeune'], 3600, 'mensuelle', 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/prime-d-activite', 'Complément pour travailleurs modestes. ~200€/mois selon revenus.'),
('ass', 'ASS — Allocation de Solidarité Spécifique', 'revenu', 'Pole Emploi', ARRAY['demandeur_emploi'], 6600, 'mensuelle', 'https://www.pole-emploi.fr/candidat/mes-droits-aux-aides-et-allocati/lallocation-de-solidarite-specif.html', 'Fin de droits chômage : ~18,17€/jour pendant 6 mois renouvelable.'),
('are', 'ARE — Allocation de Retour à l''Emploi', 'emploi', 'Pole Emploi', ARRAY['demandeur_emploi','salarie'], 30000, 'mensuelle', 'https://www.pole-emploi.fr/candidat/mes-droits-aux-aides-et-allocati/lessentiel-a-savoir-sur-lallocat/quelle-est-la-duree-dindemnisati.html', 'Indemnité chômage après perte d''emploi involontaire.'),
('prime-noel', 'Prime de Noël', 'revenu', 'CAF', ARRAY['demandeur_emploi','parent','famille_monoparentale'], 500, 'ponctuelle', 'https://www.service-public.fr/particuliers/vosdroits/F32872', 'Versée en décembre aux bénéficiaires RSA/ASS. 152€ seul, 335€ 3 enfants.'),
('aspa', 'ASPA — Minimum vieillesse', 'senior', 'CARSAT', ARRAY['retraite','senior'], 12500, 'mensuelle', 'https://www.service-public.fr/particuliers/vosdroits/F16871', 'Retraité 65+ aux revenus modestes : jusqu''à ~1034€/mois seul.'),

-- Logement (8)
('apl', 'APL — Aide Personnalisée au Logement', 'logement', 'CAF', ARRAY['locataire','etudiant','jeune','parent','salarie','demandeur_emploi'], 3600, 'mensuelle', 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/logement', 'Aide au loyer sur critères revenus. ~150-400€/mois selon zone.'),
('als', 'ALS — Allocation de Logement Social', 'logement', 'CAF', ARRAY['locataire','etudiant','senior'], 3000, 'mensuelle', 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/logement/l-allocation-de-logement-sociale-als', 'Pour locataires non éligibles APL (ex: étudiant en résidence).'),
('alf', 'ALF — Allocation de Logement Familiale', 'logement', 'CAF', ARRAY['parent','famille_monoparentale','locataire'], 3400, 'mensuelle', 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/logement/l-allocation-de-logement-familiale-alf', 'Pour familles avec enfants ou jeunes couples mariés.'),
('loca-pass', 'Loca-Pass', 'logement', 'Action Logement', ARRAY['jeune','salarie'], 1200, 'ponctuelle', 'https://www.actionlogement.fr/l-avance-loca-pass', 'Avance gratuite du dépôt de garantie, jusqu''à 1200€, remboursable 25 mois.'),
('visale', 'Garantie Visale', 'logement', 'Action Logement', ARRAY['jeune','salarie','etudiant'], 0, 'ponctuelle', 'https://www.visale.fr/', 'Caution gratuite de l''État pour louer un logement. Économise un garant.'),
('fsl', 'FSL — Fonds de Solidarité Logement', 'logement', 'Region', ARRAY['locataire','demandeur_emploi','parent','famille_monoparentale'], 2000, 'ponctuelle', 'https://www.service-public.fr/particuliers/vosdroits/F1334', 'Aide ponctuelle pour impayés loyer, dépôt, énergie. Départemental.'),
('action-logement-jeune', 'Aide Mobili-Jeune', 'logement', 'Action Logement', ARRAY['jeune','etudiant'], 1000, 'mensuelle', 'https://www.actionlogement.fr/mobili-jeune', 'Alternants de moins de 30 ans : 10 à 100€/mois pour le loyer.'),
('cheque-energie', 'Chèque énergie', 'energie', 'Etat', ARRAY['locataire','proprietaire','demandeur_emploi','retraite','parent'], 277, 'annuelle', 'https://www.chequeenergie.gouv.fr/', 'Aide annuelle 48-277€ pour payer facture énergie. Envoi automatique.'),

-- Santé (4)
('css', 'CSS — Complémentaire Santé Solidaire', 'sante', 'CPAM', ARRAY['demandeur_emploi','salarie','retraite','etudiant','parent'], 1500, 'annuelle', 'https://www.ameli.fr/assure/droits-demarches/difficultes-acces-droits-soins/complementaire-sante/complementaire-sante-solidaire', 'Mutuelle gratuite ou à ~8€/mois selon revenus. Couvre à 100%.'),
('ame', 'AME — Aide Médicale d''État', 'sante', 'CPAM', ARRAY['demandeur_emploi','famille_monoparentale'], 3000, 'annuelle', 'https://www.ameli.fr/assure/droits-demarches/etrangers/ame', 'Soins pris en charge pour personnes en situation irrégulière sous conditions revenus.'),
('c2s-participation', 'C2S avec participation', 'sante', 'CPAM', ARRAY['salarie','independant','retraite'], 1200, 'annuelle', 'https://www.ameli.fr/assure/droits-demarches/difficultes-acces-droits-soins/complementaire-sante', 'Mutuelle à ~30€/mois pour revenus intermédiaires.'),
('aide-mutuelle-retraite', 'Aide mutuelle retraités CARSAT', 'sante', 'CARSAT', ARRAY['retraite','senior'], 800, 'annuelle', 'https://www.lassuranceretraite.fr/', 'Prise en charge partielle mutuelle pour retraités modestes. Variable.'),

-- Handicap (5)
('aah', 'AAH — Allocation Adulte Handicapé', 'handicap', 'CAF', ARRAY['handicape'], 12000, 'mensuelle', 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/handicap/l-allocation-aux-adultes-handicapes-aah', '~1000€/mois pour personne en situation de handicap, taux 50%+.'),
('pch', 'PCH — Prestation Compensation Handicap', 'handicap', 'MDPH', ARRAY['handicape'], 15000, 'mensuelle', 'https://www.service-public.fr/particuliers/vosdroits/F14202', 'Finance aides humaines, techniques, aménagement logement/véhicule.'),
('aeeh', 'AEEH — Allocation Éducation Enfant Handicapé', 'handicap', 'CAF', ARRAY['parent','handicape'], 7200, 'mensuelle', 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/handicap/l-allocation-d-education-de-l-enfant-handicape-aeeh', 'Parent d''enfant handicapé : ~150-1500€/mois selon complément.'),
('mva', 'MVA — Majoration Vie Autonome', 'handicap', 'CAF', ARRAY['handicape'], 1500, 'mensuelle', 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/handicap/la-majoration-pour-la-vie-autonome', 'Complément AAH de 104€/mois pour autonomie (logement autonome).'),
('carte-mobilite', 'Carte Mobilité Inclusion', 'handicap', 'MDPH', ARRAY['handicape','senior'], 0, 'ponctuelle', 'https://www.service-public.fr/particuliers/vosdroits/F34049', 'Gratuite, donne accès priorité, stationnement, réductions transports.'),

-- Famille (6)
('paje-prime', 'PAJE — Prime à la naissance', 'famille', 'CAF', ARRAY['parent','famille_monoparentale'], 1000, 'ponctuelle', 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/petite-enfance/la-prestation-d-accueil-du-jeune-enfant-paje', '1019€ versés au 7e mois de grossesse sous plafond ressources.'),
('paje-base', 'PAJE — Allocation de base', 'famille', 'CAF', ARRAY['parent','famille_monoparentale'], 2200, 'mensuelle', 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/petite-enfance/la-prestation-d-accueil-du-jeune-enfant-paje', '~184€/mois jusqu''aux 3 ans de l''enfant.'),
('cmg', 'CMG — Complément Libre Choix Mode de Garde', 'famille', 'CAF', ARRAY['parent','salarie','famille_monoparentale'], 5500, 'mensuelle', 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/petite-enfance/le-complement-de-libre-choix-du-mode-de-garde-cmg', 'Prise en charge assistante maternelle/crèche : jusqu''à 460€/mois.'),
('allocation-familiale', 'Allocations familiales', 'famille', 'CAF', ARRAY['parent','famille_monoparentale'], 3400, 'mensuelle', 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/enfance/les-allocations-familiales', 'À partir de 2 enfants : ~142€/mois pour 2, 325€ pour 3.'),
('asf', 'ASF — Allocation Soutien Familial', 'famille', 'CAF', ARRAY['famille_monoparentale','parent'], 2000, 'mensuelle', 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/vie-personnelle/l-allocation-de-soutien-familial-asf', 'Parent isolé : ~184€/mois/enfant si autre parent absent/défaillant.'),
('complement-familial', 'Complément familial', 'famille', 'CAF', ARRAY['parent','famille_monoparentale'], 3000, 'mensuelle', 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/enfance/le-complement-familial', '3 enfants+ de 3 à 21 ans : ~258€/mois sous conditions ressources.'),

-- Jeunes / étudiants (4)
('bourse-crous', 'Bourse sur critères sociaux CROUS', 'jeune', 'CROUS', ARRAY['etudiant','jeune'], 6335, 'mensuelle', 'https://www.messervices.etudiant.gouv.fr/', 'Bourse étudiants selon revenus parents : 1145-6335€/an (échelons 0bis à 7).'),
('aide-mobilite-parcoursup', 'Aide mobilité Parcoursup', 'jeune', 'CROUS', ARRAY['etudiant','jeune'], 500, 'ponctuelle', 'https://www.messervices.etudiant.gouv.fr/', 'Bacheliers boursiers qui déménagent pour études : 500€ unique.'),
('aide-permis-1euro', 'Permis à 1€/jour', 'jeune', 'Etat', ARRAY['jeune'], 1200, 'ponctuelle', 'https://www.service-public.fr/particuliers/vosdroits/F2210', 'Prêt 15-25 ans : 800-1200€ remboursable 1€/jour.'),
('aide-permis-apprenti', 'Aide permis apprenti 500€', 'jeune', 'Etat', ARRAY['jeune','salarie'], 500, 'ponctuelle', 'https://www.service-public.fr/particuliers/vosdroits/F35440', '500€ aux apprentis 18+ préparant le permis B.'),

-- Énergie / rénovation (4)
('maprimerenov', 'MaPrimeRénov''', 'energie', 'ANAH', ARRAY['proprietaire','locataire'], 20000, 'ponctuelle', 'https://www.maprimerenov.gouv.fr/', 'Jusqu''à 20000€ pour rénovation énergétique (isolation, chauffage, pompe à chaleur).'),
('coup-de-pouce', 'Coup de pouce économies d''énergie', 'energie', 'Etat', ARRAY['proprietaire','locataire'], 5000, 'ponctuelle', 'https://www.ecologie.gouv.fr/coup-pouce-economies-denergie', 'Prime CEE pour chaudière, isolation, pompe à chaleur.'),
('eco-ptz', 'Éco-prêt à taux zéro', 'energie', 'Etat', ARRAY['proprietaire'], 50000, 'ponctuelle', 'https://www.service-public.fr/particuliers/vosdroits/F19905', 'Prêt 0% jusqu''à 50000€ pour travaux économies énergie.'),
('cheque-bois', 'Chèque énergie bois (complément)', 'energie', 'Etat', ARRAY['proprietaire','locataire'],  231, 'annuelle', 'https://www.chequeenergie.gouv.fr/', 'Complément chèque énergie pour ménages chauffés au bois.'),

-- Emploi / création (3)
('cape', 'CAPE — Contrat d''Appui au Projet d''Entreprise', 'emploi', 'Etat', ARRAY['demandeur_emploi','salarie','jeune'], 0, 'ponctuelle', 'https://www.service-public.fr/professionnels-entreprises/vosdroits/F23269', 'Accompagnement jusqu''à 3 ans pour porteur de projet entreprise.'),
('arce', 'ARCE — Aide à la Reprise et Création d''Entreprise', 'emploi', 'Pole Emploi', ARRAY['demandeur_emploi'], 15000, 'ponctuelle', 'https://www.pole-emploi.fr/candidat/en-formation/mes-aides-financieres/arce-ou-maintien-des-allocations.html', '45% de vos droits chômage versés en capital pour créer votre entreprise.'),
('acre', 'ACRE — Exonération cotisations créateurs', 'emploi', 'URSSAF', ARRAY['demandeur_emploi','jeune','salarie'], 8000, 'annuelle', 'https://www.service-public.fr/professionnels-entreprises/vosdroits/F11677', 'Exonération partielle cotisations sociales 1ère année (micro-entrepreneur).'),

-- ZFRR / Frasne (2)
('zfrr-exoneration', 'ZFRR — Exonération fiscale Zone France Ruralité Revitalisation', 'fiscal', 'Etat', ARRAY['independant','salarie','zfrr'], 50000, 'annuelle', 'https://www.service-public.fr/professionnels-entreprises/vosdroits/F31135', 'Exonération IR/IS 100% sur 5 ans + 75/50/25% sur 3 ans en Zone Ruralité Revitalisation (Frasne incluse).'),
('zfrr-tfpb', 'ZFRR — Exonération Taxe Foncière TFPB', 'fiscal', 'Commune', ARRAY['proprietaire','independant','zfrr'], 3000, 'annuelle', 'https://www.service-public.fr/professionnels-entreprises/vosdroits/F32126', 'Exonération taxe foncière propriétés bâties 5 ans en ZFRR sur délibération commune.'),

-- Seniors / aidants (3)
('apa', 'APA — Allocation Personnalisée Autonomie', 'senior', 'Region', ARRAY['senior','retraite'], 22000, 'mensuelle', 'https://www.service-public.fr/particuliers/vosdroits/F10009', 'Perte autonomie 60+ : finance aide à domicile ou EHPAD. Jusqu''à ~1900€/mois.'),
('aide-aidant', 'Aide aux aidants familiaux', 'senior', 'CAF', ARRAY['parent','senior'], 3000, 'annuelle', 'https://www.service-public.fr/particuliers/vosdroits/F16920', 'Congé proche aidant rémunéré ~45€/jour, jusqu''à 66 jours.'),
('ajpa', 'AJPA — Allocation Journalière Proche Aidant', 'famille', 'CAF', ARRAY['salarie','parent','senior'], 3000, 'mensuelle', 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/solidarite-et-insertion/l-allocation-journaliere-du-proche-aidant', '~66€/jour, 22 jours/mois max, 66 jours sur carrière.');

-- Verif
SELECT COUNT(*) AS total_aides FROM vida_sante.aides WHERE active;
