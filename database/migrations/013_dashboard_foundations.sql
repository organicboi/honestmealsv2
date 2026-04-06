-- ============================================================
-- Migration 013: Dashboard Foundations
-- Run this in your Supabase SQL Editor (Honestmeals v2)
-- 
-- This migration:
--   1. Fixes the live credits bug (Honest Ask_credits → gymna_credits)
--   2. Adds missing profile fields needed across all modules
--   3. Creates body_measurements table for timeline tracking
--   4. Auto-creates daily_goals row when onboarding completes
-- ============================================================

-- ─── 1. FIX LIVE BUG: Rename credits column ───────────────────────────────
-- Only renames if the old spaced column still exists; safe to re-run.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'Honest Ask_credits'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN "Honest Ask_credits" TO gymna_credits;
  END IF;
END $$;

-- Ensure the column exists with the correct name and default (idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gymna_credits integer DEFAULT 10;

ALTER TABLE public.profiles
  ALTER COLUMN gymna_credits SET DEFAULT 10;


-- ─── 2. ADD MISSING PROFILE FIELDS ────────────────────────────────────────
-- Fields needed for personalized features across the app

ALTER TABLE public.profiles
  -- Target date for achieving the goal (e.g. lose weight by 3 months from now)  
  ADD COLUMN IF NOT EXISTS goal_target_date          date,
  -- Current body measurements (snapshot; history → body_measurements table)
  ADD COLUMN IF NOT EXISTS waist_cm                  numeric,
  ADD COLUMN IF NOT EXISTS neck_cm                   numeric,
  ADD COLUMN IF NOT EXISTS hip_cm                    numeric,
  -- Profile completeness score 0-100 (computed/updated on save)
  ADD COLUMN IF NOT EXISTS profile_completeness      integer DEFAULT 0,
  -- Timezone for accurate daily goal tracking
  ADD COLUMN IF NOT EXISTS user_timezone             text DEFAULT 'Asia/Kolkata';


-- ─── 3. BODY MEASUREMENTS TABLE ───────────────────────────────────────────
-- Tracks body composition over time (independent of progress photos)
-- Used for: body fat %, progress charts, BMI trends

CREATE TABLE IF NOT EXISTS public.body_measurements (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL,
  -- Weight & composition
  weight_kg       numeric,
  body_fat_pct    numeric,
  muscle_mass_kg  numeric,
  bmi             numeric,
  -- Measurements in cm
  waist_cm        numeric,
  chest_cm        numeric,
  arms_cm         numeric,
  hips_cm         numeric,
  thighs_cm       numeric,
  neck_cm         numeric,
  -- Meta
  measured_at     date        NOT NULL DEFAULT CURRENT_DATE,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  CONSTRAINT body_measurements_pkey PRIMARY KEY (id),
  CONSTRAINT body_measurements_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- RLS
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'body_measurements'
      AND policyname = 'Users manage own measurements'
  ) THEN
    CREATE POLICY "Users manage own measurements"
      ON public.body_measurements
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_measurements TO authenticated;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_body_meas_user_date
  ON public.body_measurements(user_id, measured_at DESC);


-- ─── 4. AUTO-CREATE daily_goals AFTER ONBOARDING ──────────────────────────
-- When a user completes onboarding (has_onboarded flips true),
-- automatically insert a daily_goals row so health/dashboard pages
-- always have a goals row to read.

CREATE OR REPLACE FUNCTION public.fn_auto_create_daily_goals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only fire when onboarding just completed
  IF NEW.has_onboarded = TRUE AND (OLD.has_onboarded IS NULL OR OLD.has_onboarded = FALSE) THEN
    INSERT INTO public.daily_goals (
      user_id,
      daily_calorie_goal,
      daily_protein_goal,
      daily_water_goal_ml,
      goal_type,
      is_active
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.daily_calorie_goal, 2000),
      COALESCE(NEW.daily_protein_goal, 150),
      COALESCE(NEW.daily_water_goal_ml, 2500),
      CASE
        WHEN NEW.goal_type = 'lose_weight'                    THEN 'weight_loss'
        WHEN NEW.goal_type IN ('gain_weight', 'build_muscle') THEN 'weight_gain'
        ELSE 'maintenance'
      END,
      TRUE
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_daily_goals ON public.profiles;
CREATE TRIGGER trg_auto_create_daily_goals
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_create_daily_goals();


-- ─── 5. BACKFILL: daily_goals for existing onboarded users ────────────────
-- For users who already completed onboarding before this migration
INSERT INTO public.daily_goals (
  user_id,
  daily_calorie_goal,
  daily_protein_goal,
  daily_water_goal_ml,
  goal_type,
  is_active
)
SELECT
  p.id,
  COALESCE(p.daily_calorie_goal, 2000),
  COALESCE(p.daily_protein_goal, 150),
  COALESCE(p.daily_water_goal_ml, 2500),
  CASE
    WHEN p.goal_type = 'lose_weight'                    THEN 'weight_loss'
    WHEN p.goal_type IN ('gain_weight', 'build_muscle') THEN 'weight_gain'
    ELSE 'maintenance'
  END,
  TRUE
FROM public.profiles p
WHERE p.has_onboarded = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM public.daily_goals dg
    WHERE dg.user_id = p.id AND dg.is_active = TRUE
  );


-- ─── 6. HELPFUL INDEXES ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_gymna_credits ON public.profiles(gymna_credits);
CREATE INDEX IF NOT EXISTS idx_profiles_goal_type     ON public.profiles(goal_type);
CREATE INDEX IF NOT EXISTS idx_profiles_has_onboarded ON public.profiles(has_onboarded);

-- ─── 7. UPDATE gymna_chats / gymna_messages (alias check) ─────────────────
-- If your live DB still has the old "Honest Ask_chats" / "Honest Ask_messages" names
-- (with a space), run these renames. If they already exist as gymna_*, skip.
-- UNCOMMENT only if needed:
--
-- ALTER TABLE IF EXISTS public."Honest Ask_chats"    RENAME TO gymna_chats;
-- ALTER TABLE IF EXISTS public."Honest Ask_messages" RENAME TO gymna_messages;
-- ALTER TABLE IF EXISTS public."Honest Ask_plan_data" RENAME TO gymna_plan_data;
--
-- Then update RLS policies that reference the old names:
-- DROP POLICY IF EXISTS "Users can view their own chats" ON public.gymna_chats;
-- CREATE POLICY "Users can view their own chats" ON public.gymna_chats
--   FOR SELECT USING (auth.uid() = user_id);
-- (Repeat for each policy)


-- ─── DONE ──────────────────────────────────────────────────────────────────
-- Summary of changes:
--   ✅ profiles.gymna_credits (renamed from "Honest Ask_credits")
--   ✅ profiles.goal_target_date, waist_cm, neck_cm, hip_cm (new cols)
--   ✅ body_measurements table (with RLS)
--   ✅ fn_auto_create_daily_goals trigger
--   ✅ Backfill daily_goals for existing users
--   ✅ Performance indexes
