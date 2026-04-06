-- ============================================================
-- Migration 014: Trainer Feature
-- Adds trainer-client relationship, commission tracking,
-- trainer notes, assigned plans, client goals.
-- Updates signup flow to support user_type selection.
-- Run this entire file in Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- 1. ADD COLUMNS TO PROFILES
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'personal'
    CHECK (user_type IN ('personal', 'client', 'trainer')),
  ADD COLUMN IF NOT EXISTS trainer_bio TEXT,
  ADD COLUMN IF NOT EXISTS trainer_certification TEXT,
  ADD COLUMN IF NOT EXISTS trainer_commission_rate NUMERIC(5,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS trainer_invite_code TEXT;

-- Partial unique index — only enforces uniqueness when code is set
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_trainer_invite_code
  ON public.profiles(trainer_invite_code)
  WHERE trainer_invite_code IS NOT NULL;

-- ============================================================
-- 2. ADD TRAINER COMMISSION COLUMNS TO ORDERS
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trainer_commission_rate NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS trainer_commission_amount NUMERIC(10,2);

CREATE INDEX IF NOT EXISTS idx_orders_trainer_id ON public.orders(trainer_id);

-- ============================================================
-- 3. TABLE: trainer_clients
-- Maps trainers to their clients with relationship status
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trainer_clients (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
  commission_rate   NUMERIC(5,2),        -- per-client override; NULL = use trainer default
  invite_code       TEXT,                -- trainer invite code used to join
  joined_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trainer_id, client_id),
  CHECK (trainer_id <> client_id)
);

CREATE INDEX IF NOT EXISTS idx_trainer_clients_trainer ON public.trainer_clients(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_clients_client  ON public.trainer_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_trainer_clients_status  ON public.trainer_clients(status);

-- ============================================================
-- 4. TABLE: trainer_commissions
-- One row per order that earns a trainer commission
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trainer_commissions (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id          UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_amount      NUMERIC(10,2) NOT NULL,
  commission_rate   NUMERIC(5,2)  NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'processing', 'paid', 'cancelled')),
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id)   -- one commission entry per order
);

CREATE INDEX IF NOT EXISTS idx_trainer_commissions_trainer ON public.trainer_commissions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_commissions_status  ON public.trainer_commissions(status);

-- ============================================================
-- 5. TABLE: trainer_notes
-- Trainer writes notes about a client
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trainer_notes (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note        TEXT        NOT NULL,
  note_type   TEXT        NOT NULL DEFAULT 'general'
              CHECK (note_type IN ('general', 'nutrition', 'workout', 'progress', 'goal')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trainer_notes_trainer ON public.trainer_notes(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_notes_client  ON public.trainer_notes(client_id);

-- ============================================================
-- 6. TABLE: trainer_assigned_plans
-- Meal or workout plans trainer creates and assigns to clients
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trainer_assigned_plans (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type   TEXT        NOT NULL CHECK (plan_type IN ('meal', 'workout', 'combined')),
  title       TEXT        NOT NULL,
  description TEXT,
  plan_data   JSONB       NOT NULL DEFAULT '{}',
  is_active   BOOLEAN     DEFAULT true,
  starts_at   DATE,
  ends_at     DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trainer_plans_trainer ON public.trainer_assigned_plans(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_plans_client  ON public.trainer_assigned_plans(client_id);

-- ============================================================
-- 7. TABLE: trainer_client_goals
-- Measurable targets a trainer sets for a client
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trainer_client_goals (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title          TEXT        NOT NULL,
  goal_type      TEXT        NOT NULL
                 CHECK (goal_type IN (
                   'weight', 'body_fat', 'muscle_mass', 'calories',
                   'protein', 'workout_frequency', 'custom'
                 )),
  target_value   NUMERIC(10,2),
  current_value  NUMERIC(10,2),
  target_unit    TEXT,
  deadline       DATE,
  notes          TEXT,
  status         TEXT        NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trainer_goals_trainer ON public.trainer_client_goals(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_goals_client  ON public.trainer_client_goals(client_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function: generate a unique 8-char hex invite code for trainers
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

DROP TRIGGER IF EXISTS set_trainer_invite_code ON public.profiles;
CREATE TRIGGER set_trainer_invite_code
  BEFORE INSERT OR UPDATE OF user_type ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_trainer_invite_code();

-- Function: link_order_to_trainer
-- Fires BEFORE INSERT on orders — auto-populates trainer_id + commission from active relationship
CREATE OR REPLACE FUNCTION public.link_order_to_trainer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tc_rec RECORD;
BEGIN
  SELECT
    tc.trainer_id,
    COALESCE(tc.commission_rate, p.trainer_commission_rate, 10.00) AS eff_rate
  INTO tc_rec
  FROM public.trainer_clients tc
  JOIN public.profiles p ON p.id = tc.trainer_id
  WHERE tc.client_id = NEW.customer_id
    AND tc.status = 'active'
  LIMIT 1;

  IF FOUND THEN
    NEW.trainer_id               := tc_rec.trainer_id;
    NEW.trainer_commission_rate  := tc_rec.eff_rate;
    NEW.trainer_commission_amount := ROUND(NEW.total_amount * tc_rec.eff_rate / 100.0, 2);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_link_trainer ON public.orders;
CREATE TRIGGER orders_link_trainer
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.link_order_to_trainer();

-- Function: create_trainer_commission_entry
-- Fires AFTER INSERT on orders — creates trainer_commissions row if trainer was linked
CREATE OR REPLACE FUNCTION public.create_trainer_commission_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.trainer_id IS NOT NULL THEN
    INSERT INTO public.trainer_commissions (
      trainer_id, client_id, order_id,
      order_amount, commission_rate, commission_amount, status
    ) VALUES (
      NEW.trainer_id,
      NEW.customer_id,
      NEW.id,
      NEW.total_amount,
      NEW.trainer_commission_rate,
      NEW.trainer_commission_amount,
      'pending'
    )
    ON CONFLICT (order_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_create_commission ON public.orders;
CREATE TRIGGER orders_create_commission
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_trainer_commission_entry();

-- Function: updated_at auto-update for trainer tables
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trainer_clients_updated_at ON public.trainer_clients;
CREATE TRIGGER trainer_clients_updated_at
  BEFORE UPDATE ON public.trainer_clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trainer_notes_updated_at ON public.trainer_notes;
CREATE TRIGGER trainer_notes_updated_at
  BEFORE UPDATE ON public.trainer_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trainer_plans_updated_at ON public.trainer_assigned_plans;
CREATE TRIGGER trainer_plans_updated_at
  BEFORE UPDATE ON public.trainer_assigned_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trainer_goals_updated_at ON public.trainer_client_goals;
CREATE TRIGGER trainer_goals_updated_at
  BEFORE UPDATE ON public.trainer_client_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- UPDATE handle_new_user
-- Reads user_type from signup metadata, assigns correct role
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  standard_user_role_id INTEGER;
  trainer_role_id       INTEGER;
  raw_user_type         TEXT;
BEGIN
  -- Read user_type passed during signUp({ options: { data: { user_type } } })
  raw_user_type := COALESCE(
    NEW.raw_user_meta_data->>'user_type',
    'personal'
  );

  -- Sanitise
  IF raw_user_type NOT IN ('personal', 'client', 'trainer') THEN
    raw_user_type := 'personal';
  END IF;

  -- Assign role
  IF raw_user_type = 'trainer' THEN
    SELECT id INTO trainer_role_id FROM public.roles WHERE name = 'trainer' LIMIT 1;
    IF trainer_role_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role_id)
      VALUES (NEW.id, trainer_role_id)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
  ELSE
    SELECT id INTO standard_user_role_id FROM public.roles WHERE name = 'standard_user' LIMIT 1;
    IF standard_user_role_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role_id)
      VALUES (NEW.id, standard_user_role_id)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
  END IF;

  -- Create / upsert profile
  INSERT INTO public.profiles (
    id,
    email,
    user_type,
    created_at,
    updated_at,
    has_onboarded,
    onboarding_step
  ) VALUES (
    NEW.id,
    NEW.email,
    raw_user_type,
    NOW(),
    NOW(),
    false,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    user_type  = EXCLUDED.user_type,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;

-- ============================================================
-- HELPER FUNCTION: is_trainer_of
-- Returns true if calling user is an active trainer of client_user_id
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_trainer_of(client_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trainer_clients
    WHERE trainer_id = auth.uid()
      AND client_id  = client_user_id
      AND status     = 'active'
  );
$$;

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

ALTER TABLE public.trainer_clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_commissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_assigned_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_client_goals  ENABLE ROW LEVEL SECURITY;

-- trainer_clients
DROP POLICY IF EXISTS "Trainer sees own relationships"    ON public.trainer_clients;
DROP POLICY IF EXISTS "Trainer manages own relationships" ON public.trainer_clients;
DROP POLICY IF EXISTS "Client updates own status"         ON public.trainer_clients;

CREATE POLICY "Trainer sees own relationships"
  ON public.trainer_clients FOR SELECT
  USING (trainer_id = auth.uid() OR client_id = auth.uid());

CREATE POLICY "Trainer manages own relationships"
  ON public.trainer_clients FOR ALL
  USING (trainer_id = auth.uid());

CREATE POLICY "Client updates own status"
  ON public.trainer_clients FOR UPDATE
  USING (client_id = auth.uid());

-- trainer_commissions
DROP POLICY IF EXISTS "Trainer sees own commissions" ON public.trainer_commissions;
DROP POLICY IF EXISTS "Trainer updates own commissions" ON public.trainer_commissions;
DROP POLICY IF EXISTS "Admins manage commissions"    ON public.trainer_commissions;

CREATE POLICY "Trainer sees own commissions"
  ON public.trainer_commissions FOR SELECT
  USING (trainer_id = auth.uid());

CREATE POLICY "Trainer updates own commissions"
  ON public.trainer_commissions FOR UPDATE
  USING (trainer_id = auth.uid());

CREATE POLICY "Admins manage commissions"
  ON public.trainer_commissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- trainer_notes
DROP POLICY IF EXISTS "Trainer CRUD own notes"  ON public.trainer_notes;
DROP POLICY IF EXISTS "Client reads own notes"  ON public.trainer_notes;

CREATE POLICY "Trainer CRUD own notes"
  ON public.trainer_notes FOR ALL
  USING (trainer_id = auth.uid());

CREATE POLICY "Client reads own notes"
  ON public.trainer_notes FOR SELECT
  USING (client_id = auth.uid());

-- trainer_assigned_plans
DROP POLICY IF EXISTS "Trainer CRUD own plans"      ON public.trainer_assigned_plans;
DROP POLICY IF EXISTS "Client reads assigned plans" ON public.trainer_assigned_plans;

CREATE POLICY "Trainer CRUD own plans"
  ON public.trainer_assigned_plans FOR ALL
  USING (trainer_id = auth.uid());

CREATE POLICY "Client reads assigned plans"
  ON public.trainer_assigned_plans FOR SELECT
  USING (client_id = auth.uid());

-- trainer_client_goals
DROP POLICY IF EXISTS "Trainer CRUD own goals"  ON public.trainer_client_goals;
DROP POLICY IF EXISTS "Client reads own goals"  ON public.trainer_client_goals;

CREATE POLICY "Trainer CRUD own goals"
  ON public.trainer_client_goals FOR ALL
  USING (trainer_id = auth.uid());

CREATE POLICY "Client reads own goals"
  ON public.trainer_client_goals FOR SELECT
  USING (client_id = auth.uid());

-- Cross-table: trainers can read active clients' health/fitness data
DROP POLICY IF EXISTS "Trainer reads client food logs"      ON public.food_logs;
DROP POLICY IF EXISTS "Trainer reads client nutrition log"  ON public.daily_nutrition_log;
DROP POLICY IF EXISTS "Trainer reads client weight logs"    ON public.weight_logs;
DROP POLICY IF EXISTS "Trainer reads client measurements"   ON public.body_measurements;
DROP POLICY IF EXISTS "Trainer reads client progress photos" ON public.progress_photos;
DROP POLICY IF EXISTS "Trainer reads client workout logs"   ON public.workout_logs;
DROP POLICY IF EXISTS "Trainer reads client profile"        ON public.profiles;
DROP POLICY IF EXISTS "Trainer reads assigned orders"       ON public.orders;

CREATE POLICY "Trainer reads client food logs"
  ON public.food_logs FOR SELECT
  USING (public.is_trainer_of(user_id));

CREATE POLICY "Trainer reads client nutrition log"
  ON public.daily_nutrition_log FOR SELECT
  USING (public.is_trainer_of(customer_id));

CREATE POLICY "Trainer reads client weight logs"
  ON public.weight_logs FOR SELECT
  USING (public.is_trainer_of(user_id));

CREATE POLICY "Trainer reads client measurements"
  ON public.body_measurements FOR SELECT
  USING (public.is_trainer_of(user_id));

CREATE POLICY "Trainer reads client progress photos"
  ON public.progress_photos FOR SELECT
  USING (public.is_trainer_of(user_id));

CREATE POLICY "Trainer reads client workout logs"
  ON public.workout_logs FOR SELECT
  USING (public.is_trainer_of(user_id));

CREATE POLICY "Trainer reads client profile"
  ON public.profiles FOR SELECT
  USING (public.is_trainer_of(id));

CREATE POLICY "Trainer reads assigned orders"
  ON public.orders FOR SELECT
  USING (trainer_id = auth.uid());

-- ============================================================
-- GRANTS
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_clients        TO authenticated;
GRANT SELECT, UPDATE                  ON public.trainer_commissions    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_notes          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_assigned_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_client_goals   TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_trainer_of(uuid)                        TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_trainer_invite_code()             TO service_role;
GRANT EXECUTE ON FUNCTION public.link_order_to_trainer()                    TO service_role;
GRANT EXECUTE ON FUNCTION public.create_trainer_commission_entry()          TO service_role;
