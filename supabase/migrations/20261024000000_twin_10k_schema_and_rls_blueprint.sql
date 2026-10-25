-- ============================================================================
-- TWIN: Reference Production Schema, Indexes & RLS Migration Blueprint (10k+ Scale)
-- STATUS: PREPARATION BLUEPRINT ONLY — NOT EXECUTED OR CONNECTED IN DEMO MODE
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Normalized Cities Directory
CREATE TABLE IF NOT EXISTS public.cities (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'SA'
);

INSERT INTO public.cities (id, name_en, name_ar, country_code) VALUES
  ('Riyadh', 'Riyadh', 'الرياض', 'SA'),
  ('Jeddah', 'Jeddah', 'جدة', 'SA'),
  ('Makkah', 'Makkah', 'مكة المكرمة', 'SA'),
  ('Madinah', 'Madinah', 'المدينة المنورة', 'SA'),
  ('Dammam', 'Dammam', 'الدمام', 'SA'),
  ('Khobar', 'Khobar', 'الخبر', 'SA'),
  ('Abha', 'Abha', 'أبها', 'SA'),
  ('Dubai', 'Dubai', 'دبي', 'AE'),
  ('Abu Dhabi', 'Abu Dhabi', 'أبوظبي', 'AE'),
  ('Doha', 'Doha', 'الدوحة', 'QA'),
  ('Cairo', 'Cairo', 'القاهرة', 'EG')
ON CONFLICT (id) DO NOTHING;

-- 2. Core User Profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username CITEXT UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  city_id TEXT NOT NULL REFERENCES public.cities(id),
  gender TEXT NOT NULL DEFAULT 'prefer_not_to_say'
    CHECK (gender IN ('male', 'female', 'prefer_not_to_say')),
  age_range TEXT
    CHECK (age_range IS NULL OR age_range IN ('18-24', '22-26', '23-27', '23-28', '24-28', '25-29', '26-31', '30-35', '36+')),
  avatar JSONB NOT NULL,
  bio TEXT NOT NULL DEFAULT '' CHECK (char_length(bio) <= 500),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  answered_count SMALLINT NOT NULL DEFAULT 0,
  answer_tokens TEXT[] NOT NULL DEFAULT '{}',
  answers_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Quarantined Private User Data (Strictly owner-only, never exposed publicly)
CREATE TABLE IF NOT EXISTS public.private_user_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number_masked TEXT,
  phone_verified_at TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,
  auth_provider TEXT NOT NULL DEFAULT 'email',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Privacy & Visibility Settings
CREATE TABLE IF NOT EXISTS public.privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  show_city_publicly BOOLEAN NOT NULL DEFAULT true,
  show_gender_publicly BOOLEAN NOT NULL DEFAULT false,
  show_age_range_publicly BOOLEAN NOT NULL DEFAULT true,
  allow_discoverability BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Normalized 15-Dimension Questionnaire Responses
CREATE TABLE IF NOT EXISTS public.user_question_answers (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL CHECK (
    question_id IN (
      'q_coffee', 'q_drinks', 'q_food', 'q_sports', 'q_sports_watch',
      'q_hobbies', 'q_entertainment', 'q_places', 'q_leisure', 'q_events',
      'q_travel', 'q_lifestyle', 'q_vibe', 'q_tech', 'q_cars'
    )
  ),
  selected_options TEXT[] NOT NULL CHECK (cardinality(selected_options) BETWEEN 1 AND 5),
  question_version TEXT NOT NULL DEFAULT 'v2_15q',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

-- 6. User-Scoped Saved Profiles (Bookmarks)
CREATE TABLE IF NOT EXISTS public.saved_profiles (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  saved_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, saved_profile_id),
  CONSTRAINT saved_profiles_no_self_bookmark CHECK (user_id <> saved_profile_id)
);

-- 7. Mutual Blocking Table
CREATE TABLE IF NOT EXISTS public.blocked_users (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, blocked_user_id),
  CONSTRAINT blocked_users_no_self_block CHECK (user_id <> blocked_user_id)
);

-- 8. Daily Vibe Check Responses (Per-User Isolated)
CREATE TABLE IF NOT EXISTS public.daily_vibe_responses (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response_date DATE NOT NULL DEFAULT CURRENT_DATE,
  question_id TEXT NOT NULL,
  option_id TEXT NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, response_date, question_id)
);

-- 9. Site Feedback & Feature Suggestions (Per-User Isolated)
CREATE TABLE IF NOT EXISTS public.site_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('feature', 'avatar', 'question', 'general')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 5 AND 600),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Optional Cached Pairwise Match Scores
CREATE TABLE IF NOT EXISTS public.match_scores_cache (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  matched_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  similarity_score SMALLINT NOT NULL CHECK (similarity_score BETWEEN 0 AND 100),
  coverage_score SMALLINT NOT NULL CHECK (coverage_score BETWEEN 0 AND 100),
  shared_interests TEXT[] NOT NULL DEFAULT '{}',
  algorithm_version TEXT NOT NULL DEFAULT 'v2.0',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, matched_user_id),
  CONSTRAINT match_scores_no_self_match CHECK (user_id <> matched_user_id)
);

-- ============================================================================
-- INDEXING STRATEGY FOR 10,000+ USER ACCOUNTS
-- ============================================================================

-- Keyset pagination & regional discovery index for completed profiles
CREATE INDEX IF NOT EXISTS idx_profiles_completed_city_cursor
  ON public.profiles (city_id, updated_at DESC, id ASC)
  WHERE is_completed = true;

-- GIN index on denormalized 'question_id:option_id' tokens for fast candidate overlap pre-filtering
CREATE INDEX IF NOT EXISTS idx_profiles_answer_tokens_gin
  ON public.profiles USING GIN (answer_tokens)
  WHERE is_completed = true;

-- Fast lookup of discoverable user IDs
CREATE INDEX IF NOT EXISTS idx_privacy_discoverable
  ON public.privacy_settings (user_id)
  WHERE allow_discoverability = true;

-- Reverse lookup on blocked_users so bidirectional NOT EXISTS checks use index-only scans
CREATE INDEX IF NOT EXISTS idx_blocked_users_reverse
  ON public.blocked_users (blocked_user_id, user_id);

-- Fast bookmark list retrieval ordered by recency
CREATE INDEX IF NOT EXISTS idx_saved_profiles_user_created
  ON public.saved_profiles (user_id, created_at DESC);

-- Top matches cache retrieval index
CREATE INDEX IF NOT EXISTS idx_match_scores_cache_ranking
  ON public.match_scores_cache (user_id, similarity_score DESC, matched_user_id ASC);

-- ============================================================================
-- TRIGGER: Sync denormalized answer_tokens on public.profiles
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_profile_answer_tokens()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_uid UUID;
  tokens TEXT[];
  q_count SMALLINT;
BEGIN
  target_uid := COALESCE(NEW.user_id, OLD.user_id);

  SELECT
    COALESCE(array_agg(uqa.question_id || ':' || opt ORDER BY uqa.question_id, opt), '{}'),
    COUNT(DISTINCT uqa.question_id)::SMALLINT
  INTO tokens, q_count
  FROM public.user_question_answers uqa
  CROSS JOIN LATERAL unnest(uqa.selected_options) AS opt
  WHERE uqa.user_id = target_uid;

  UPDATE public.profiles
  SET
    answer_tokens = tokens,
    answered_count = COALESCE(q_count, 0),
    answers_updated_at = now(),
    updated_at = now()
  WHERE id = target_uid;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_answer_tokens ON public.user_question_answers;
CREATE TRIGGER trg_sync_profile_answer_tokens
  AFTER INSERT OR UPDATE OR DELETE ON public.user_question_answers
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_answer_tokens();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_vibe_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_scores_cache ENABLE ROW LEVEL SECURITY;

-- Cities: readable by authenticated users
CREATE POLICY "Cities readable by authenticated users"
  ON public.cities FOR SELECT TO authenticated USING (true);

-- Profiles: owner full access; other authenticated users can read only completed, discoverable, unblocked profiles
CREATE POLICY "Profiles viewable when owner or discoverable and unblocked"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR (
      is_completed = true
      AND EXISTS (
        SELECT 1 FROM public.privacy_settings ps
        WHERE ps.user_id = profiles.id AND ps.allow_discoverability = true
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users bu
        WHERE (bu.user_id = auth.uid() AND bu.blocked_user_id = profiles.id)
           OR (bu.user_id = profiles.id AND bu.blocked_user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users insert own profile only"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users update own profile only"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Private User Data: strictly owner-only
CREATE POLICY "Private data strictly owner-only"
  ON public.private_user_data FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Privacy Settings: strictly owner-only direct access
CREATE POLICY "Privacy settings owner select/write"
  ON public.privacy_settings FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- User Question Answers: owner write; readable for comparison only if target profile is discoverable & unblocked
CREATE POLICY "Question answers readable for discoverable profiles"
  ON public.user_question_answers FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.privacy_settings ps ON ps.user_id = p.id
      WHERE p.id = user_question_answers.user_id
        AND p.is_completed = true
        AND ps.allow_discoverability = true
        AND NOT EXISTS (
          SELECT 1 FROM public.blocked_users bu
          WHERE (bu.user_id = auth.uid() AND bu.blocked_user_id = p.id)
             OR (bu.user_id = p.id AND bu.blocked_user_id = auth.uid())
        )
    )
  );

CREATE POLICY "Users manage own question answers"
  ON public.user_question_answers FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Saved Profiles: strictly owner-only
CREATE POLICY "Users manage own saved profiles"
  ON public.saved_profiles FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Blocked Users: strictly owner-only
CREATE POLICY "Users manage own block list"
  ON public.blocked_users FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Daily Vibe Responses: strictly owner-only
CREATE POLICY "Users manage own daily vibe responses"
  ON public.daily_vibe_responses FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Site Feedback: owner can insert & view own submissions only
CREATE POLICY "Users view own feedback"
  ON public.site_feedback FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own feedback"
  ON public.site_feedback FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Match Scores Cache: readable by owner, mutated only by server-side SECURITY DEFINER RPC
CREATE POLICY "Users read own cached match scores"
  ON public.match_scores_cache FOR SELECT TO authenticated
  USING (user_id = auth.uid());
