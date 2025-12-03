-- RBAC Setup Migration
-- This sets up the role-based access control system for Honest Meals

-- 1. Insert default roles into the roles table
INSERT INTO public.roles (name) VALUES
  ('standard_user'),
  ('admin'),
  ('moderator'),
  ('trainer'),
  ('influencer')
ON CONFLICT (name) DO NOTHING;

-- 2. Create JWT helper function for RLS policies
CREATE OR REPLACE FUNCTION public.jwt_has_role(role_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
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

-- 3. Create function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(user_id uuid)
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT ARRAY(
    SELECT r.name
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_id
  );
$$;

-- 4. Create the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  standard_user_role_id integer;
BEGIN
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
  END IF;

  -- Create a profile entry for the new user
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

  RETURN NEW;
END;
$$;

-- 5. Create the trigger that fires when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for user_roles table
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.jwt_has_role('admin'));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.jwt_has_role('admin'));

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- 9. Ensure profiles table has proper RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.jwt_has_role('admin'));

-- Grant permissions for the handle_new_user function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.jwt_has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically assigns standard_user role and creates profile when a new user signs up';
COMMENT ON FUNCTION public.jwt_has_role(text) IS 'Helper function to check if JWT contains a specific role for RLS policies';
COMMENT ON FUNCTION public.get_user_roles(uuid) IS 'Returns array of role names for a given user ID';