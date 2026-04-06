-- ============================================================
-- Migration 014b: Fix generate_trainer_invite_code trigger
-- Replaces gen_random_bytes() (requires pgcrypto extension)
-- with md5(random()) which is always available in PostgreSQL.
-- Run this in Supabase SQL Editor AFTER 014.
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_trainer_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code TEXT;
  attempts INT := 0;
BEGIN
  IF NEW.user_type = 'trainer' AND (NEW.trainer_invite_code IS NULL OR NEW.trainer_invite_code = '') THEN
    LOOP
      new_code := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 8));
      attempts := attempts + 1;
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE trainer_invite_code = new_code
      );
      IF attempts > 20 THEN
        RAISE EXCEPTION 'Could not generate unique trainer invite code after 20 attempts';
      END IF;
    END LOOP;
    NEW.trainer_invite_code := new_code;
  END IF;
  RETURN NEW;
END;
$$;
