-- ════════════════════════════════════════════════════════════════════════════
-- VIDA — Schema Supabase self-hosted
-- Slug: vida  |  Schema: vida_sante  |  Domain: vida.purama.dev
-- Une compagne vivante. Santé holistique, impact réel, communauté.
-- ════════════════════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS vida_sante;
GRANT USAGE ON SCHEMA vida_sante TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA vida_sante GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA vida_sante GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- ─── PROFILES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  pseudo TEXT UNIQUE,
  bio TEXT,

  language TEXT DEFAULT 'fr',
  country TEXT,
  timezone TEXT DEFAULT 'Europe/Paris',

  -- VIDA identity (évolutive)
  vida_level INTEGER DEFAULT 1,
  vida_xp INTEGER DEFAULT 0,
  vida_energy INTEGER DEFAULT 50,           -- 0..100
  consciousness_level TEXT DEFAULT 'seed',  -- seed|sprout|tree|forest|river|ocean|guardian
  impact_score NUMERIC(12,2) DEFAULT 0,

  -- Onboarding answers
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_objective TEXT,                -- calm|energy|sleep|impact|focus|heal
  onboarding_interest TEXT,                 -- health|ecology|community|mind|body|nature
  onboarding_rhythm TEXT,                   -- slow|balanced|dynamic|intuitive
  preferences_json JSONB DEFAULT '{}',
  rhythm_data JSONB DEFAULT '{}',

  -- Subscription
  plan TEXT DEFAULT 'free',                 -- free | premium
  plan_period TEXT,                         -- month | year
  subscription_status TEXT DEFAULT 'none',  -- none | trialing | active | past_due | canceled | half_price
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_started_at TIMESTAMPTZ,
  subscription_canceled_at TIMESTAMPTZ,
  half_price_lifetime BOOLEAN DEFAULT false,

  -- Engagement
  role TEXT DEFAULT 'user',                 -- user | admin | super_admin
  streak_count INTEGER DEFAULT 0,
  last_streak_at DATE,
  tutorial_completed BOOLEAN DEFAULT false,
  intro_seen BOOLEAN DEFAULT false,

  -- Points & wallet
  vida_points INTEGER DEFAULT 0,            -- universels
  lifetime_points INTEGER DEFAULT 0,
  wallet_balance NUMERIC(10,2) DEFAULT 0,   -- euros, abonnés seulement
  pending_earnings NUMERIC(10,2) DEFAULT 0, -- en attente (freemium)

  -- Daily
  daily_ai_messages INTEGER DEFAULT 0,
  daily_missions INTEGER DEFAULT 0,

  -- Referral
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_tier TEXT DEFAULT 'none',        -- none|bronze|silver|gold|platinum|diamond|legend

  -- Theme / UI
  theme TEXT DEFAULT 'dark',

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON vida_sante.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON vida_sante.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe ON vida_sante.profiles(stripe_customer_id);

-- ─── USER IMPACT (cumulatif personnel) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.user_impact (
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  total_co2_saved_kg NUMERIC(14,2) DEFAULT 0,
  total_waste_removed_g NUMERIC(14,2) DEFAULT 0,
  total_water_protected_l NUMERIC(14,2) DEFAULT 0,
  total_trees_funded NUMERIC(10,2) DEFAULT 0,
  total_people_helped INTEGER DEFAULT 0,
  total_missions_completed INTEGER DEFAULT 0,
  total_actions INTEGER DEFAULT 0,
  first_action_at TIMESTAMPTZ,
  last_action_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── FIL DE VIE™ (timeline cross-app) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.life_thread_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  app_slug TEXT DEFAULT 'vida',
  action_type TEXT NOT NULL,                -- mission|ritual|chat|donation|purchase|impact|achievement
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  impact_units NUMERIC(10,2) DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_life_thread_user ON vida_sante.life_thread_entries(user_id, created_at DESC);

-- ─── MISSIONS (Impact Engine) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,                   -- ecology | human | social | pub_vida | health | community
  type TEXT NOT NULL,                       -- solo | group | paid | unpaid
  difficulty TEXT DEFAULT 'easy',           -- easy | medium | hard
  icon TEXT,
  cover_url TEXT,

  reward_points INTEGER DEFAULT 50,
  reward_money_cents INTEGER DEFAULT 0,
  reward_tickets INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,

  funder_type TEXT DEFAULT 'vida',          -- vida | partner | sponsor
  funder_id UUID,

  proof_type TEXT NOT NULL,                 -- photo | photo_gps | qr | file | ai_check | story_share | follow | review
  max_completions INTEGER DEFAULT 10000,
  current_completions INTEGER DEFAULT 0,

  -- Impact generated per completion
  impact_co2_kg NUMERIC(10,2) DEFAULT 0,
  impact_waste_g NUMERIC(10,2) DEFAULT 0,
  impact_water_l NUMERIC(10,2) DEFAULT 0,
  impact_trees NUMERIC(6,2) DEFAULT 0,
  impact_people INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_missions_active ON vida_sante.missions(is_active, category);

CREATE TABLE IF NOT EXISTS vida_sante.user_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES vida_sante.missions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',             -- active | submitted | verified | rejected
  proof_url TEXT,
  proof_gps_lat NUMERIC(10,6),
  proof_gps_lng NUMERIC(10,6),
  ai_confidence NUMERIC(4,3),
  rejection_reason TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  UNIQUE(user_id, mission_id)
);
CREATE INDEX IF NOT EXISTS idx_user_missions_user ON vida_sante.user_missions(user_id, status);

-- ─── IMPACT EVENTS (Carte mondiale) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.impact_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE SET NULL,
  mission_id UUID REFERENCES vida_sante.missions(id) ON DELETE SET NULL,
  impact_type TEXT NOT NULL,                -- waste_removal | tree_planted | water_protected | person_helped
  impact_value NUMERIC(12,2) DEFAULT 0,
  impact_unit TEXT,                         -- kg | g | l | count
  location_label TEXT,
  location_lat NUMERIC(10,6),
  location_lng NUMERIC(10,6),
  partner_name TEXT,
  proof_photos TEXT[],
  status TEXT DEFAULT 'funded',             -- funded | in_progress | realized
  realized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_impact_events_location ON vida_sante.impact_events(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_impact_events_user ON vida_sante.impact_events(user_id);

-- ─── TRANSACTIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,                       -- subscription | purchase | commission | cashback | reward | donation | withdrawal
  direction TEXT NOT NULL,                  -- in | out
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'pending',            -- pending | succeeded | failed | refunded
  stripe_payment_intent TEXT,
  stripe_invoice_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON vida_sante.transactions(user_id, created_at DESC);

-- ─── VIDA POINTS LEDGER ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL,                       -- earn | spend | convert
  source TEXT NOT NULL,                     -- mission | referral | streak | achievement | share | daily_gift | challenge | purchase | review | feedback
  reference_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_points_user ON vida_sante.point_transactions(user_id, created_at DESC);

-- ─── SUBSCRIPTIONS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL,                       -- premium
  period TEXT NOT NULL,                     -- month | year
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL,                     -- trialing | active | past_due | canceled | paused
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  half_price_offered BOOLEAN DEFAULT false,
  half_price_accepted BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subs_user ON vida_sante.subscriptions(user_id);

-- ─── REFERRALS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  status TEXT DEFAULT 'pending',            -- pending | active | churned
  first_payment_commission_cents INTEGER DEFAULT 0,
  recurring_commission_rate NUMERIC(4,3) DEFAULT 0.10,
  first_payment_commission_rate NUMERIC(4,3) DEFAULT 0.50,
  created_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  UNIQUE(referrer_id, referred_id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON vida_sante.referrals(referrer_id);

CREATE TABLE IF NOT EXISTS vida_sante.referral_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES vida_sante.referrals(id) ON DELETE CASCADE,
  referrer_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  source TEXT NOT NULL,                     -- first_payment | recurring
  period DATE,
  paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── INFLUENCERS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.influencer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  social_links JSONB DEFAULT '{}',
  approved BOOLEAN DEFAULT true,
  tier TEXT DEFAULT 'bronze',
  promo_percent INTEGER DEFAULT 50,
  promo_code_active BOOLEAN DEFAULT true,
  promo_expires_at TIMESTAMPTZ,
  commission_rate_first NUMERIC(4,3) DEFAULT 0.50,
  commission_rate_recurring NUMERIC(4,3) DEFAULT 0.10,
  total_clicks INTEGER DEFAULT 0,
  total_signups INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earned_cents INTEGER DEFAULT 0,
  kit_downloaded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vida_sante.influencer_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID REFERENCES vida_sante.influencer_profiles(id) ON DELETE CASCADE,
  ip_hash TEXT,
  country TEXT,
  referer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vida_sante.influencer_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID REFERENCES vida_sante.influencer_profiles(id) ON DELETE CASCADE,
  converted_user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES vida_sante.subscriptions(id) ON DELETE SET NULL,
  commission_cents INTEGER NOT NULL,
  type TEXT DEFAULT 'first',                -- first | recurring
  paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── CONTESTS / LOTTERY ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,                       -- weekly | monthly | annual | special
  prize_pool_cents INTEGER DEFAULT 0,
  prizes_json JSONB DEFAULT '[]',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'upcoming',           -- upcoming | live | completed
  winners_count INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vida_sante.contest_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES vida_sante.contests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  tickets_count INTEGER DEFAULT 1,
  source TEXT,                              -- usage | subscription | mission | purchase | share | streak
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contest_entries ON vida_sante.contest_entries(contest_id, user_id);

CREATE TABLE IF NOT EXISTS vida_sante.contest_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES vida_sante.contests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE SET NULL,
  rank INTEGER NOT NULL,
  amount_cents INTEGER DEFAULT 0,
  method TEXT DEFAULT 'performance',        -- performance | lottery
  paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── COMMUNAUTÉ & PRACTICE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  type TEXT DEFAULT 'post',                 -- post | victory | encouragement | gratitude | milestone
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  pinned BOOLEAN DEFAULT false,
  moderated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vida_sante.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES vida_sante.community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vida_sante.community_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES vida_sante.community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS vida_sante.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'solo',                 -- solo | group | meetup
  theme TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 15,
  max_participants INTEGER DEFAULT 20,
  participants_ids UUID[] DEFAULT '{}',
  location_label TEXT,
  location_lat NUMERIC(10,6),
  location_lng NUMERIC(10,6),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Buddies
CREATE TABLE IF NOT EXISTS vida_sante.buddies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  user_b UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  streak_days INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',             -- active | paused | ended
  matched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_a, user_b)
);

CREATE TABLE IF NOT EXISTS vida_sante.buddy_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buddy_id UUID REFERENCES vida_sante.buddies(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  message TEXT,
  mood_emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Love wall / cercles
CREATE TABLE IF NOT EXISTS vida_sante.love_circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective TEXT NOT NULL,
  description TEXT,
  max_members INTEGER DEFAULT 12,
  current_members INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vida_sante.circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES vida_sante.love_circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',               -- member | captain
  streak_days INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

-- ─── DONATIONS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  destination TEXT DEFAULT 'association_vida',  -- association_vida | ecology | social
  stripe_payment_intent TEXT,
  rewards_json JSONB DEFAULT '{}',
  contest_tickets_earned INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  message TEXT,
  anonymous BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',            -- pending | succeeded | failed
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.notification_preferences (
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  frequency TEXT DEFAULT 'balanced',        -- minimal | balanced | full
  quiet_hours_start INTEGER DEFAULT 20,
  quiet_hours_end INTEGER DEFAULT 9,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  channels_json JSONB DEFAULT '{}',
  engagement_score INTEGER DEFAULT 50,
  notification_style TEXT DEFAULT 'warm',   -- encouraging | informative | warm
  paused_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vida_sante.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  icon TEXT,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  important BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON vida_sante.notifications(user_id, read, created_at DESC);

-- ─── INTERNAL ADS (pub interne utilisateurs) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.internal_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  media_url TEXT,
  target_url TEXT,
  budget_cents INTEGER NOT NULL,
  spent_cents INTEGER DEFAULT 0,
  placement TEXT DEFAULT 'feed',            -- pre_video | feed | sidebar
  status TEXT DEFAULT 'pending',            -- pending | approved | active | paused | ended
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── RITUELS COLLECTIFS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.weekly_rituals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme TEXT NOT NULL,                      -- depollution | peace | love | forgiveness | gratitude | abundance
  title TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 20,
  participants_count INTEGER DEFAULT 0,
  impact_generated NUMERIC(14,2) DEFAULT 0,
  status TEXT DEFAULT 'upcoming',           -- upcoming | live | completed
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(year, week_number, theme)
);

CREATE TABLE IF NOT EXISTS vida_sante.user_ritual_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  ritual_id UUID REFERENCES vida_sante.weekly_rituals(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, ritual_id)
);

-- ─── PRODUITS VIDA & ORDERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  image_urls TEXT[],
  price_cents INTEGER NOT NULL,
  subscriber_discount_percent INTEGER DEFAULT 10,
  cashback_points INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 100,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vida_sante.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE SET NULL,
  items_json JSONB NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER DEFAULT 0,
  total_cents INTEGER NOT NULL,
  cashback_points INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',            -- pending | paid | shipped | delivered | canceled
  shipping_address JSONB,
  stripe_payment_intent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── AI / CHAT VIDA ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  title TEXT,
  context TEXT,                             -- dashboard | missions | coach | general
  is_favorite BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vida_sante.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES vida_sante.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                       -- user | assistant | system
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── WITHDRAWALS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  iban TEXT NOT NULL,
  bic TEXT,
  full_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',            -- pending | processing | completed | rejected
  reject_reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- ─── POOL BALANCES (reward, asso, partner) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.pool_balances (
  pool_type TEXT PRIMARY KEY,               -- reward | asso | partner
  balance_cents INTEGER DEFAULT 0,
  total_in_cents INTEGER DEFAULT 0,
  total_out_cents INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vida_sante.pool_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  direction TEXT NOT NULL,                  -- in | out
  reason TEXT NOT NULL,                     -- ca_10pct | aide_deposit | contest_payout | mission_payout | asso_transfer | partner_commission
  reference_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── FAQ / AIDE ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.faq_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  search_keywords TEXT[],
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── CONTACT MESSAGES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  responded BOOLEAN DEFAULT false,
  ai_response TEXT
);

-- ─── DAILY GIFTS / REVIEWS / SHARES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.daily_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  gift_type TEXT NOT NULL,                  -- points | coupon | ticket | credits | discount
  gift_value NUMERIC(10,2),
  streak_count INTEGER DEFAULT 0,
  opened_at TIMESTAMPTZ DEFAULT now(),
  opened_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, opened_date)
);

CREATE TABLE IF NOT EXISTS vida_sante.user_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_percent INTEGER NOT NULL,
  source TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vida_sante.social_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  share_code TEXT NOT NULL,
  platform TEXT,
  shared_at TIMESTAMPTZ DEFAULT now(),
  points_given INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS vida_sante.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vida_sante.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  category TEXT,
  comment TEXT,
  points_given INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── HEALTH CHECKS / INCIDENT LOG ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vida_sante.health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  status_code INTEGER,
  latency_ms INTEGER,
  success BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vida_sante.incident_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL,                   -- info | warn | critical
  title TEXT NOT NULL,
  description TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── AUTO TIMESTAMP TRIGGER ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION vida_sante.set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_updated_at') THEN
    CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON vida_sante.profiles
      FOR EACH ROW EXECUTE FUNCTION vida_sante.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'subscriptions_updated_at') THEN
    CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON vida_sante.subscriptions
      FOR EACH ROW EXECUTE FUNCTION vida_sante.set_updated_at();
  END IF;
END $$;

-- ─── AUTO CREATE PROFILE ON AUTH SIGNUP ──────────────────────────────────────
CREATE OR REPLACE FUNCTION vida_sante.handle_new_user() RETURNS trigger AS $$
DECLARE
  new_code TEXT;
BEGIN
  new_code := 'VIDA' || upper(substring(md5(NEW.id::text) from 1 for 6));
  INSERT INTO vida_sante.profiles (id, email, full_name, avatar_url, referral_code, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    new_code,
    CASE WHEN NEW.email = 'matiss.frasne@gmail.com' THEN 'super_admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO vida_sante.user_impact (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO vida_sante.notification_preferences (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_vida') THEN
    CREATE TRIGGER on_auth_user_created_vida
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION vida_sante.handle_new_user();
  END IF;
END $$;

-- ─── RLS ENABLE + POLICIES ───────────────────────────────────────────────────
ALTER TABLE vida_sante.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.user_impact ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.life_thread_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.impact_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.influencer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.influencer_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.influencer_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.contest_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.contest_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.buddies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.buddy_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.love_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.internal_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.weekly_rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.user_ritual_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.pool_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.pool_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.faq_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.daily_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.user_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.social_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vida_sante.incident_log ENABLE ROW LEVEL SECURITY;

-- Policies — read/write own rows for users, public read for missions/contests/rituals/products/faq
DO $$
BEGIN
  -- profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='profiles' AND policyname='profiles_self_read') THEN
    CREATE POLICY profiles_self_read ON vida_sante.profiles FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM vida_sante.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='profiles' AND policyname='profiles_self_update') THEN
    CREATE POLICY profiles_self_update ON vida_sante.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;

  -- user_impact
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='user_impact' AND policyname='impact_self_read') THEN
    CREATE POLICY impact_self_read ON vida_sante.user_impact FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- life_thread
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='life_thread_entries' AND policyname='life_thread_self') THEN
    CREATE POLICY life_thread_self ON vida_sante.life_thread_entries FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- missions (public read)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='missions' AND policyname='missions_read_all') THEN
    CREATE POLICY missions_read_all ON vida_sante.missions FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='user_missions' AND policyname='user_missions_self') THEN
    CREATE POLICY user_missions_self ON vida_sante.user_missions FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- impact_events (public read)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='impact_events' AND policyname='impact_events_read') THEN
    CREATE POLICY impact_events_read ON vida_sante.impact_events FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='transactions' AND policyname='transactions_self') THEN
    CREATE POLICY transactions_self ON vida_sante.transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='point_transactions' AND policyname='points_self') THEN
    CREATE POLICY points_self ON vida_sante.point_transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='subscriptions' AND policyname='subs_self') THEN
    CREATE POLICY subs_self ON vida_sante.subscriptions FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- referrals
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='referrals' AND policyname='referrals_self') THEN
    CREATE POLICY referrals_self ON vida_sante.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='referral_earnings' AND policyname='ref_earnings_self') THEN
    CREATE POLICY ref_earnings_self ON vida_sante.referral_earnings FOR SELECT USING (auth.uid() = referrer_id);
  END IF;

  -- influencer
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='influencer_profiles' AND policyname='infl_read') THEN
    CREATE POLICY infl_read ON vida_sante.influencer_profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='influencer_profiles' AND policyname='infl_self_update') THEN
    CREATE POLICY infl_self_update ON vida_sante.influencer_profiles FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='influencer_conversions' AND policyname='infl_conv_self') THEN
    CREATE POLICY infl_conv_self ON vida_sante.influencer_conversions FOR SELECT USING (EXISTS (SELECT 1 FROM vida_sante.influencer_profiles ip WHERE ip.id = influencer_id AND ip.user_id = auth.uid()));
  END IF;

  -- contests (public read)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='contests' AND policyname='contests_read') THEN
    CREATE POLICY contests_read ON vida_sante.contests FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='contest_entries' AND policyname='contest_entries_self') THEN
    CREATE POLICY contest_entries_self ON vida_sante.contest_entries FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='contest_winners' AND policyname='contest_winners_read') THEN
    CREATE POLICY contest_winners_read ON vida_sante.contest_winners FOR SELECT USING (true);
  END IF;

  -- community public read, write self
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='community_posts' AND policyname='community_read') THEN
    CREATE POLICY community_read ON vida_sante.community_posts FOR SELECT USING (moderated = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='community_posts' AND policyname='community_self_write') THEN
    CREATE POLICY community_self_write ON vida_sante.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='community_comments' AND policyname='comments_read') THEN
    CREATE POLICY comments_read ON vida_sante.community_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='community_comments' AND policyname='comments_self_write') THEN
    CREATE POLICY comments_self_write ON vida_sante.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='community_reactions' AND policyname='reactions_all') THEN
    CREATE POLICY reactions_all ON vida_sante.community_reactions FOR ALL USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='practice_sessions' AND policyname='practice_read') THEN
    CREATE POLICY practice_read ON vida_sante.practice_sessions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='practice_sessions' AND policyname='practice_self_write') THEN
    CREATE POLICY practice_self_write ON vida_sante.practice_sessions FOR INSERT WITH CHECK (auth.uid() = creator_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='buddies' AND policyname='buddies_self') THEN
    CREATE POLICY buddies_self ON vida_sante.buddies FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='buddy_checkins' AND policyname='buddy_checkins_self') THEN
    CREATE POLICY buddy_checkins_self ON vida_sante.buddy_checkins FOR ALL USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM vida_sante.buddies b WHERE b.id = buddy_id AND (b.user_a = auth.uid() OR b.user_b = auth.uid())));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='love_circles' AND policyname='circles_read') THEN
    CREATE POLICY circles_read ON vida_sante.love_circles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='circle_members' AND policyname='circle_members_self') THEN
    CREATE POLICY circle_members_self ON vida_sante.circle_members FOR ALL USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='donations' AND policyname='donations_self') THEN
    CREATE POLICY donations_self ON vida_sante.donations FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='donations' AND policyname='donations_self_insert') THEN
    CREATE POLICY donations_self_insert ON vida_sante.donations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='notification_preferences' AND policyname='notif_prefs_self') THEN
    CREATE POLICY notif_prefs_self ON vida_sante.notification_preferences FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='notifications' AND policyname='notifications_self') THEN
    CREATE POLICY notifications_self ON vida_sante.notifications FOR ALL USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='internal_ads' AND policyname='ads_read_approved') THEN
    CREATE POLICY ads_read_approved ON vida_sante.internal_ads FOR SELECT USING (status = 'active' OR advertiser_user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='internal_ads' AND policyname='ads_self_write') THEN
    CREATE POLICY ads_self_write ON vida_sante.internal_ads FOR INSERT WITH CHECK (auth.uid() = advertiser_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='weekly_rituals' AND policyname='rituals_read') THEN
    CREATE POLICY rituals_read ON vida_sante.weekly_rituals FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='user_ritual_participations' AND policyname='ritual_part_self') THEN
    CREATE POLICY ritual_part_self ON vida_sante.user_ritual_participations FOR ALL USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='products' AND policyname='products_read') THEN
    CREATE POLICY products_read ON vida_sante.products FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='orders' AND policyname='orders_self') THEN
    CREATE POLICY orders_self ON vida_sante.orders FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='orders' AND policyname='orders_self_insert') THEN
    CREATE POLICY orders_self_insert ON vida_sante.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='conversations' AND policyname='conv_self') THEN
    CREATE POLICY conv_self ON vida_sante.conversations FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='messages' AND policyname='msg_self') THEN
    CREATE POLICY msg_self ON vida_sante.messages FOR ALL USING (EXISTS (SELECT 1 FROM vida_sante.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='withdrawals' AND policyname='withdrawals_self') THEN
    CREATE POLICY withdrawals_self ON vida_sante.withdrawals FOR ALL USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='pool_balances' AND policyname='pools_read') THEN
    CREATE POLICY pools_read ON vida_sante.pool_balances FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='faq_articles' AND policyname='faq_read') THEN
    CREATE POLICY faq_read ON vida_sante.faq_articles FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='contact_messages' AND policyname='contact_self') THEN
    CREATE POLICY contact_self ON vida_sante.contact_messages FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='daily_gifts' AND policyname='daily_gifts_self') THEN
    CREATE POLICY daily_gifts_self ON vida_sante.daily_gifts FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='user_coupons' AND policyname='coupons_self') THEN
    CREATE POLICY coupons_self ON vida_sante.user_coupons FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='social_shares' AND policyname='shares_self') THEN
    CREATE POLICY shares_self ON vida_sante.social_shares FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='vida_sante' AND tablename='user_feedback' AND policyname='feedback_self') THEN
    CREATE POLICY feedback_self ON vida_sante.user_feedback FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─── POOL BALANCES SEED ──────────────────────────────────────────────────────
INSERT INTO vida_sante.pool_balances (pool_type, balance_cents) VALUES
  ('reward', 0), ('asso', 0), ('partner', 0)
ON CONFLICT (pool_type) DO NOTHING;

-- ─── SEED MISSIONS (VIDA-specific) ───────────────────────────────────────────
INSERT INTO vida_sante.missions (title, description, category, type, difficulty, proof_type, reward_points, reward_money_cents, is_paid, impact_co2_kg, impact_waste_g, impact_trees, impact_people)
VALUES
  ('Ramasser 5 déchets dans la nature', 'Photo géolocalisée des déchets collectés. Impact direct sur la pollution locale.', 'ecology', 'solo', 'easy', 'photo_gps', 100, 300, true, 0.5, 250, 0, 0),
  ('10 000 pas dans la journée', 'Partage ta capture d''écran Santé/Google Fit. Mouvement pour toi, bien-être pour la planète.', 'health', 'solo', 'easy', 'photo', 50, 100, true, 0.2, 0, 0, 0),
  ('Don du sang', 'Certificat après prélèvement. Tu sauves jusqu''à 3 vies.', 'human', 'solo', 'medium', 'file', 500, 1000, true, 0, 0, 0, 3),
  ('Plante un arbre', 'Photo de ton arbre planté + géolocalisation. VIDA finance 1 arbre complémentaire.', 'ecology', 'solo', 'easy', 'photo_gps', 200, 500, true, 22, 0, 1, 0),
  ('Rituel respiration 4-7-8', 'Pratique 3 cycles. Calme instantané.', 'health', 'solo', 'easy', 'ai_check', 30, 0, false, 0, 0, 0, 0),
  ('Médite 10 minutes', 'Timer VIDA. Présence à toi-même.', 'health', 'solo', 'easy', 'ai_check', 30, 0, false, 0, 0, 0, 0),
  ('Gratitude du soir', 'Nomme 3 choses pour lesquelles tu es reconnaissant.', 'community', 'solo', 'easy', 'ai_check', 20, 0, false, 0, 0, 0, 0),
  ('Covoiturage ce trajet', 'Photo capture d''écran app de covoiturage. CO₂ divisé par 2.', 'ecology', 'solo', 'medium', 'photo', 80, 300, true, 3, 0, 0, 0),
  ('Bénévolat association locale', 'QR code signé par l''association. Ton temps = son impact.', 'human', 'solo', 'medium', 'qr', 300, 500, true, 0, 0, 0, 1),
  ('Quiz santé holistique', 'Réponds au quiz VIDA. Apprentissage pur.', 'community', 'solo', 'easy', 'ai_check', 50, 0, false, 0, 0, 0, 0),
  ('Note VIDA sur l''App Store', 'Partage ton avis sincère. Aide les autres à nous trouver.', 'pub_vida', 'solo', 'easy', 'review', 500, 0, false, 0, 0, 0, 0),
  ('Partage en story Instagram', 'Partage ton lien VIDA en story. Points si quelqu''un clique.', 'pub_vida', 'solo', 'easy', 'story_share', 300, 0, false, 0, 0, 0, 0),
  ('Rituel hebdo de dépollution', 'Rejoins le rituel collectif du dimanche. Impact collectif massif.', 'community', 'group', 'easy', 'ai_check', 100, 0, false, 1, 500, 0, 0),
  ('Accompagne ton buddy', 'Envoie un check-in à ton buddy VIDA aujourd''hui.', 'community', 'solo', 'easy', 'ai_check', 20, 0, false, 0, 0, 0, 0),
  ('Lettre de motivation à un inconnu', 'Écris un mot d''encouragement à un autre utilisateur VIDA.', 'community', 'solo', 'easy', 'ai_check', 500, 0, false, 0, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- ─── SEED PRODUCTS ───────────────────────────────────────────────────────────
INSERT INTO vida_sante.products (slug, name, description, price_cents, cashback_points, category) VALUES
  ('graines-vida', 'Kit Graines VIDA', '20 variétés de graines bio pour cultiver ton potager urbain. Issue de producteurs français.', 1990, 400, 'ecology'),
  ('huile-essentielle-lavande', 'Huile essentielle de lavande bio', '100% pure et bio. Sommeil, détente, bien-être. 10ml.', 990, 200, 'health'),
  ('gourde-acier', 'Gourde acier VIDA', 'Gourde isotherme 500ml. -1kg de plastique par an.', 2490, 500, 'ecology'),
  ('carnet-gratitude', 'Carnet de gratitude', '365 pages pour nourrir ta gratitude quotidienne. Papier recyclé.', 1490, 300, 'mind'),
  ('infusion-calme', 'Tisane Calme VIDA', 'Mélange de camomille, mélisse, tilleul. Bio français. 50g.', 890, 180, 'health')
ON CONFLICT (slug) DO NOTHING;

-- ─── SEED FAQ ────────────────────────────────────────────────────────────────
INSERT INTO vida_sante.faq_articles (category, question, answer, display_order) VALUES
  ('demarrer', 'Comment fonctionne VIDA ?', 'VIDA est une compagne vivante. Elle apprend ton rythme, te propose des micro-actions (2 min), et transforme chacune en impact réel sur le monde. Aucune action n''est perdue.', 1),
  ('demarrer', 'C''est gratuit ?', 'Oui, tu peux explorer VIDA gratuitement. Premium (9,90€/mois ou 79,90€/an avec -33%) débloque les missions payées, les gains en argent réel, et l''accès complet aux rituels collectifs. 14 jours d''essai offerts.', 2),
  ('impact', 'D''où vient l''impact sur la planète ?', 'Chaque abonnement finance 1 arbre + 750g de déchets retirés (via nos partenaires Ecologi, Plastic Bank, Trees for the Future). Chaque mission génère un impact additionnel traçable.', 3),
  ('impact', 'Comment voir mon impact personnel ?', 'Onglet "Mon Univers VIDA" → Impact Profile. Tu vois tes totaux (CO₂, déchets, arbres, personnes aidées) et le Mode Miroir mensuel.', 4),
  ('abonnement', 'Puis-je annuler à tout moment ?', 'Oui. Tu peux annuler depuis ton espace. Si tu annules, VIDA te proposera automatiquement la moitié prix à vie.', 5),
  ('gains', 'Comment gagner de l''argent avec VIDA ?', 'Missions payées, parrainage (50% du 1er abo + 10% récurrent à vie), redistribution mensuelle du CA, jeux concours hebdomadaires. Gains réels réservés aux abonnés Premium.', 6),
  ('gains', 'Seuil minimum pour retrait IBAN ?', '5€. Le retrait est traité en 48-72h ouvrées.', 7),
  ('parrainage', 'Comment fonctionne le parrainage ?', 'Partage ton lien. À chaque filleul abonné : 50% du 1er paiement instantané + 10% sur chaque renouvellement à vie. Le filleul obtient -50% sur son 1er mois.', 8),
  ('rituels', 'C''est quoi les Rituels Collectifs ?', 'Chaque dimanche, nous nous rassemblons autour d''un thème (paix, gratitude, dépollution...). Participation synchronisée mondiale. Impact collectif visible en temps réel.', 9),
  ('ia', 'Est-ce que VIDA utilise une IA ?', 'VIDA est vivante, évolutive, et tutoie. Elle te connaît et s''ajuste à ton rythme. Elle apprend de vous, jamais inversement.', 10),
  ('rgpd', 'Mes données sont en sécurité ?', 'Oui. Serveurs en France (Strasbourg), chiffrement AES-256, conformité RGPD totale. Export et suppression en 1 clic. Jamais de revente.', 11),
  ('rgpd', 'Puis-je supprimer mon compte ?', 'Oui, depuis Paramètres > Compte > Supprimer. Tous tes données sont effacées immédiatement sauf obligations légales (factures 10 ans).', 12),
  ('technique', 'L''app fonctionne hors ligne ?', 'Oui, partiellement. Tu peux consulter tes données, lancer une méditation, voir tes missions. Le sync reprend dès la connexion.', 13),
  ('technique', 'Je ne reçois pas l''email de confirmation', 'Vérifie les spams. Si rien après 5min, contacte-nous à contact@purama.dev — réponse sous 24h.', 14),
  ('autre', 'Comment contacter le support ?', 'Chat IA 24/7 dans l''app ("💬"), ou email à contact@purama.dev. Les cas complexes sont traités par notre équipe humaine.', 15)
ON CONFLICT DO NOTHING;
