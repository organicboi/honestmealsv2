-- DEVELOPMENT MODE: Complete RBAC Setup with Full Cleanup
-- This script safely drops existing triggers/functions and sets up everything fresh

-- ============================================================================
-- 1. CLEANUP EXISTING PROBLEMATIC TRIGGERS/FUNCTIONS
-- ============================================================================

-- Drop any existing CUSTOM triggers on auth.users that might be causing issues
-- (Skip system constraint triggers that start with "RI_ConstraintTrigger")
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = (
            SELECT oid FROM pg_class 
            WHERE relname = 'users' 
            AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
        )
        AND tgname NOT LIKE 'RI_ConstraintTrigger%'  -- Skip system constraint triggers
        AND tgname NOT LIKE '%_not_null'              -- Skip system not null triggers
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_rec.tgname) || ' ON auth.users CASCADE';
        RAISE NOTICE 'Dropped custom trigger: %', trigger_rec.tgname;
    END LOOP;
END $$;

-- Drop existing functions that might conflict
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.jwt_has_role(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_roles(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb) CASCADE;

-- ============================================================================
-- 2. SETUP ROLES DATA
-- ============================================================================

-- Ensure roles exist
INSERT INTO public.roles (name) VALUES
  ('standard_user'),
  ('admin'),
  ('moderator'),
  ('trainer'),
  ('influencer')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. CREATE HELPER FUNCTIONS
-- ============================================================================

-- JWT helper function for RLS policies
CREATE OR REPLACE FUNCTION public.jwt_has_role(role_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(
      COALESCE(
        auth.jwt() -> 'app_metadata' -> 'roles',
        '[]'::jsonb
      )
    ) AS user_role
    WHERE user_role = role_name
  );
$$;

-- Function to get user roles from database
CREATE OR REPLACE FUNCTION public.get_user_roles(user_id uuid)
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT r.name
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = user_id
    ),
    ARRAY[]::text[]
  );
$$;

-- ============================================================================
-- 4. CREATE NEW USER HANDLER (FIXED VERSION)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  standard_user_role_id integer;
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user trigger fired for user: %', NEW.email;
  
  -- Get the standard_user role ID
  SELECT id INTO standard_user_role_id
  FROM public.roles
  WHERE name = 'standard_user'
  LIMIT 1;

  -- Assign the standard_user role to the new user
  IF standard_user_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, standard_user_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    RAISE LOG 'Assigned standard_user role to user: %', NEW.email;
  ELSE
    RAISE WARNING 'standard_user role not found in roles table';
  END IF;

  -- Create/update profile entry for the new user
  INSERT INTO public.profiles (
    id,
    email,
    created_at,
    updated_at,
    has_onboarded,
    onboarding_step
  ) VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW(),
    false,
    0
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = EXCLUDED.updated_at;
    
  RAISE LOG 'Created/updated profile for user: %', NEW.email;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user for %: %', NEW.email, SQLERRM;
    -- Don't fail the signup, just log the error
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 5. CREATE CUSTOM ACCESS TOKEN HOOK
-- ============================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  user_roles text[];
BEGIN
  -- Extract user ID from the event
  user_id := (event->>'user_id')::uuid;
  
  -- Get user roles
  SELECT public.get_user_roles(user_id) INTO user_roles;
  
  -- If no roles found, assign default standard_user role
  IF user_roles IS NULL OR array_length(user_roles, 1) IS NULL THEN
    user_roles := ARRAY['standard_user'];
  END IF;
  
  -- Inject roles into the JWT app_metadata
  event := jsonb_set(
    event,
    '{claims, app_metadata, roles}',
    to_jsonb(user_roles)
  );
  
  RETURN event;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't break authentication
    RAISE LOG 'Error in custom_access_token_hook: %', SQLERRM;
    RETURN event;
END;
$$;

-- ============================================================================
-- 6. CREATE NEW TRIGGER
-- ============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 7. SETUP RLS POLICIES
-- ============================================================================

-- Enable RLS on key tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create new policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.jwt_has_role('admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.jwt_has_role('admin'));

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.jwt_has_role('admin'));

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role, supabase_auth_admin;
GRANT SELECT ON public.roles TO authenticated, anon, service_role, supabase_auth_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated, service_role, supabase_auth_admin;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated, service_role, supabase_auth_admin;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role, supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.jwt_has_role(text) TO authenticated, anon, service_role, supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO authenticated, service_role, supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- ============================================================================
-- 9. VERIFICATION QUERIES
-- ============================================================================

-- Check if everything was created properly
DO $$
BEGIN
  RAISE NOTICE '============ VERIFICATION RESULTS ============';
  
  -- Check roles
  RAISE NOTICE 'Roles count: %', (SELECT count(*) FROM public.roles);
  
  -- Check functions
  RAISE NOTICE 'Functions created: %', (
    SELECT count(*) FROM pg_proc 
    WHERE proname IN ('handle_new_user', 'jwt_has_role', 'get_user_roles', 'custom_access_token_hook')
  );
  
  -- Check trigger
  RAISE NOTICE 'Trigger exists: %', (
    SELECT EXISTS(
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created'
    )
  );
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Setup complete! Next steps:';
  RAISE NOTICE '1. Go to Supabase Dashboard → Auth → Hooks';
  RAISE NOTICE '2. Create Custom Access Token hook';
  RAISE NOTICE '3. Select function: custom_access_token_hook';
  RAISE NOTICE '4. Enable the hook';
  RAISE NOTICE '5. Test signup!';
END $$;