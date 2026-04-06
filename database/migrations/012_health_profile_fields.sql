-- ============================================================
-- Migration 012: Add health & fitness fields to profiles
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add missing columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender                  text CHECK (gender IN ('male', 'female', 'other')),
  ADD COLUMN IF NOT EXISTS preferred_cuisine       text DEFAULT 'Mixed',
  ADD COLUMN IF NOT EXISTS workout_experience      text DEFAULT 'beginner'
    CHECK (workout_experience IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS workout_equipment       text DEFAULT 'Full Gym',
  ADD COLUMN IF NOT EXISTS workout_days_per_week   integer DEFAULT 3
    CHECK (workout_days_per_week BETWEEN 1 AND 7),
  ADD COLUMN IF NOT EXISTS workout_session_duration text DEFAULT '60 minutes',
  ADD COLUMN IF NOT EXISTS workout_focus_areas     text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS injuries_limitations    text,
  ADD COLUMN IF NOT EXISTS daily_water_goal_ml     integer DEFAULT 2500,
  ADD COLUMN IF NOT EXISTS bmr                     numeric,
  ADD COLUMN IF NOT EXISTS tdee                    numeric;

-- 2. Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_profiles_goal_type     ON public.profiles(goal_type);
CREATE INDEX IF NOT EXISTS idx_profiles_has_onboarded ON public.profiles(has_onboarded);

-- 3. Ensure has_onboarded defaults false for existing rows
UPDATE public.profiles SET has_onboarded = false WHERE has_onboarded IS NULL;

-- 4. A helper VIEW that surfaces calculated TDEE for existing rows
--    (useful in the dashboard without requiring a code deploy)
CREATE OR REPLACE VIEW public.profiles_computed AS
SELECT
  p.*,
  -- Mifflin-St Jeor BMR
  CASE
    WHEN p.gender = 'male'   AND p.weight IS NOT NULL AND p.height IS NOT NULL AND p.age IS NOT NULL
      THEN ROUND((10 * p.weight + 6.25 * p.height - 5 * p.age + 5)::numeric, 0)
    WHEN p.gender = 'female' AND p.weight IS NOT NULL AND p.height IS NOT NULL AND p.age IS NOT NULL
      THEN ROUND((10 * p.weight + 6.25 * p.height - 5 * p.age - 161)::numeric, 0)
    ELSE p.bmr
  END AS computed_bmr,
  -- TDEE
  CASE
    WHEN p.gender IS NOT NULL AND p.weight IS NOT NULL AND p.height IS NOT NULL AND p.age IS NOT NULL THEN
      ROUND((
        CASE
          WHEN p.gender = 'male'   THEN 10 * p.weight + 6.25 * p.height - 5 * p.age + 5
          WHEN p.gender = 'female' THEN 10 * p.weight + 6.25 * p.height - 5 * p.age - 161
          ELSE NULL
        END
        *
        CASE p.activity_level
          WHEN 'sedentary'        THEN 1.2
          WHEN 'lightly_active'   THEN 1.375
          WHEN 'moderately_active' THEN 1.55
          WHEN 'very_active'      THEN 1.725
          ELSE 1.55
        END
      )::numeric, 0)
    ELSE p.tdee
  END AS computed_tdee
FROM public.profiles p;

-- 5. Grant access to the view (matches profiles access pattern)
GRANT SELECT ON public.profiles_computed TO authenticated;
GRANT SELECT ON public.profiles_computed TO service_role;
