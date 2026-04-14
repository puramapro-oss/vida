-- VIDA — Spiritual Layer (affirmations, breathe, gratitude, intentions, awakening)

SET search_path = vida_sante, public;

-- Colonnes profil
ALTER TABLE vida_sante.profiles
  ADD COLUMN IF NOT EXISTS awakening_level INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS awakening_xp INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS affirmations_seen INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_affirmation_at TIMESTAMPTZ;

-- Affirmations (bibliothèque)
CREATE TABLE IF NOT EXISTS vida_sante.affirmations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category         TEXT NOT NULL CHECK (category IN ('love','power','abundance','health','wisdom','gratitude')),
  text_fr          TEXT NOT NULL,
  text_en          TEXT,
  frequency_weight INT  NOT NULL DEFAULT 1,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affirmations_cat ON vida_sante.affirmations(category) WHERE active;

ALTER TABLE vida_sante.affirmations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aff_public_read ON vida_sante.affirmations;
CREATE POLICY aff_public_read ON vida_sante.affirmations FOR SELECT USING (active = TRUE);

-- Gratitude entries
CREATE TABLE IF NOT EXISTS vida_sante.gratitude_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  mood       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gratitude_user_date ON vida_sante.gratitude_entries(user_id, created_at DESC);
ALTER TABLE vida_sante.gratitude_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS grat_own ON vida_sante.gratitude_entries;
CREATE POLICY grat_own ON vida_sante.gratitude_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Intentions
CREATE TABLE IF NOT EXISTS vida_sante.intentions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text         TEXT NOT NULL,
  remind_at    TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intent_user ON vida_sante.intentions(user_id, created_at DESC);
ALTER TABLE vida_sante.intentions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS intent_own ON vida_sante.intentions;
CREATE POLICY intent_own ON vida_sante.intentions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Breath sessions
CREATE TABLE IF NOT EXISTS vida_sante.breath_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  technique        TEXT NOT NULL DEFAULT '4-7-8',
  duration_seconds INT  NOT NULL,
  cycles           INT  NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_breath_user ON vida_sante.breath_sessions(user_id, created_at DESC);
ALTER TABLE vida_sante.breath_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS breath_own ON vida_sante.breath_sessions;
CREATE POLICY breath_own ON vida_sante.breath_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Awakening events (tracker général)
CREATE TABLE IF NOT EXISTS vida_sante.awakening_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('affirmation','breath','gratitude','intention','meditation','ritual')),
  xp_gained  INT  NOT NULL DEFAULT 0,
  metadata   JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_awake_user ON vida_sante.awakening_events(user_id, created_at DESC);
ALTER TABLE vida_sante.awakening_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS awake_own_read ON vida_sante.awakening_events;
CREATE POLICY awake_own_read ON vida_sante.awakening_events FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS awake_own_write ON vida_sante.awakening_events;
CREATE POLICY awake_own_write ON vida_sante.awakening_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- GRANTs
GRANT SELECT ON vida_sante.affirmations TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON vida_sante.gratitude_entries TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON vida_sante.intentions TO authenticated, service_role;
GRANT SELECT, INSERT ON vida_sante.breath_sessions TO authenticated, service_role;
GRANT SELECT, INSERT ON vida_sante.awakening_events TO authenticated, service_role;

-- === SEED 60 affirmations (6 cat × 10, FR+EN) ===
INSERT INTO vida_sante.affirmations (category, text_fr, text_en) VALUES
-- Love (10)
('love','Je mérite d''être aimé·e profondément, tel·le que je suis.','I deserve to be loved deeply, just as I am.'),
('love','Mon cœur est ouvert. Je donne et je reçois l''amour avec fluidité.','My heart is open. I give and receive love with ease.'),
('love','Je choisis la tendresse — pour les autres, et pour moi-même.','I choose tenderness — for others, and for myself.'),
('love','Là où je pose mon attention, l''amour grandit.','Where I place my attention, love grows.'),
('love','Je suis digne d''une relation saine, joyeuse, libre.','I am worthy of a healthy, joyful, free relationship.'),
('love','Chaque souffle me rapproche de ceux que j''aime.','Each breath brings me closer to those I love.'),
('love','Je pardonne. Je libère. Je continue.','I forgive. I release. I continue.'),
('love','Mon amour-propre est la racine de tout ce que je construis.','My self-love is the root of everything I build.'),
('love','Je suis en sécurité dans mon cœur.','I am safe within my own heart.'),
('love','L''amour que je cherche vit déjà en moi.','The love I seek already lives within me.'),
-- Power (10)
('power','Je suis la force calme qui transforme tout ce qu''elle touche.','I am the quiet force that transforms everything it touches.'),
('power','Ma voix compte. Mes idées ont de la valeur.','My voice matters. My ideas have value.'),
('power','Je fais des choix alignés avec qui je suis vraiment.','I make choices aligned with who I truly am.'),
('power','Je suis l''auteur·rice de ma journée.','I am the author of my day.'),
('power','Mes limites protègent mon énergie. Les poser est un acte d''amour.','My boundaries protect my energy. Setting them is an act of love.'),
('power','Je me relève plus vite que je ne tombe.','I rise faster than I fall.'),
('power','Ma discipline d''aujourd''hui est la liberté de demain.','Today''s discipline is tomorrow''s freedom.'),
('power','Je n''ai besoin de la permission de personne pour être moi.','I need no one''s permission to be myself.'),
('power','Chaque pas que je pose me rapproche de ma vérité.','Every step I take brings me closer to my truth.'),
('power','Je suis capable. Je suis prêt·e. Je commence.','I am capable. I am ready. I begin.'),
-- Abundance (10)
('abundance','L''abondance circule à travers moi avec fluidité.','Abundance flows through me with ease.'),
('abundance','Je suis un aimant pour les opportunités justes.','I am a magnet for the right opportunities.'),
('abundance','J''ai assez. Je suis assez. Je reçois avec gratitude.','I have enough. I am enough. I receive with gratitude.'),
('abundance','Mon travail est récompensé au-delà de mes attentes.','My work is rewarded beyond my expectations.'),
('abundance','Plus je donne, plus je reçois.','The more I give, the more I receive.'),
('abundance','Je fais confiance au flux de la vie.','I trust the flow of life.'),
('abundance','L''argent est une énergie que je guide avec sagesse.','Money is an energy I guide with wisdom.'),
('abundance','Des portes s''ouvrent là où je n''en voyais pas.','Doors open where I saw none.'),
('abundance','Je suis riche de ce que je suis, avant ce que je possède.','I am wealthy in who I am, before what I own.'),
('abundance','Chaque jour m''apporte ce dont j''ai besoin.','Each day brings me what I need.'),
-- Health (10)
('health','Mon corps est mon temple. Je l''écoute avec respect.','My body is my temple. I listen to it with respect.'),
('health','Chaque respiration me régénère.','Every breath regenerates me.'),
('health','Je choisis ce qui me nourrit, en conscience.','I choose what nourishes me, mindfully.'),
('health','Mon énergie grandit quand je bouge.','My energy grows when I move.'),
('health','Mon sommeil me répare. Je m''endors en paix.','My sleep restores me. I fall asleep in peace.'),
('health','Je suis en harmonie avec mes cycles.','I am in harmony with my cycles.'),
('health','Mon corps sait guérir. Je lui donne l''espace.','My body knows how to heal. I give it space.'),
('health','Je bois. Je marche. Je respire. Je vis.','I drink. I walk. I breathe. I live.'),
('health','Ma santé est un acte quotidien de tendresse.','My health is a daily act of tenderness.'),
('health','Je me sens vivant·e, dans chaque cellule.','I feel alive, in every cell.'),
-- Wisdom (10)
('wisdom','Je ne sais pas tout — et c''est précisément là que commence la sagesse.','I don''t know everything — and that''s where wisdom begins.'),
('wisdom','L''instant présent contient tout ce dont j''ai besoin.','The present moment holds all I need.'),
('wisdom','J''observe sans juger.','I observe without judging.'),
('wisdom','Mes émotions sont des messagères, pas des maîtres.','My emotions are messengers, not masters.'),
('wisdom','Je laisse aller ce qui n''est plus à sa place.','I release what is no longer in its place.'),
('wisdom','Le silence est plein.','Silence is full.'),
('wisdom','Je n''ai rien à prouver. J''ai tout à vivre.','I have nothing to prove. I have everything to live.'),
('wisdom','Ce qui m''arrive, arrive pour moi.','What happens, happens for me.'),
('wisdom','Je ralentis pour mieux voir.','I slow down to see better.'),
('wisdom','Mes racines sont profondes. Mes branches touchent le ciel.','My roots are deep. My branches touch the sky.'),
-- Gratitude (10)
('gratitude','Merci pour ce souffle. Merci pour cet instant.','Thank you for this breath. Thank you for this moment.'),
('gratitude','Je remarque les petites merveilles, partout.','I notice small wonders, everywhere.'),
('gratitude','Merci à mon corps pour tout ce qu''il fait sans bruit.','Thank you to my body for all it does quietly.'),
('gratitude','Merci aux mains qui ont construit ce que je touche.','Thank you to the hands that built what I touch.'),
('gratitude','Merci pour cette vie — imparfaite, précieuse.','Thank you for this life — imperfect, precious.'),
('gratitude','Merci à ceux qui m''aiment même quand je suis difficile.','Thank you to those who love me even when I am difficult.'),
('gratitude','Merci pour la lumière d''aujourd''hui.','Thank you for today''s light.'),
('gratitude','Chaque instant est un cadeau que je choisis d''ouvrir.','Every moment is a gift I choose to open.'),
('gratitude','Je suis reconnaissant·e pour ce que je ne vois pas encore.','I am grateful for what I don''t see yet.'),
('gratitude','Merci d''être là. Merci d''être toi.','Thank you for being here. Thank you for being you.');

SELECT COUNT(*) AS total FROM vida_sante.affirmations WHERE active;
