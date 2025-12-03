-- Custom Access Token Hook Migration
-- This creates the function that injects user roles into JWT tokens

-- Create the custom access token hook function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  user_id uuid;
  user_roles text[];
BEGIN
  -- Extract user ID from the event
  user_id := (event->>'user_id')::uuid;
  
  -- Get user roles
  SELECT ARRAY(
    SELECT r.name
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_id
  ) INTO user_roles;
  
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
END;
$$;

-- Grant necessary permissions to supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- Grant read access to the tables used by the hook
GRANT SELECT ON public.user_roles TO supabase_auth_admin;
GRANT SELECT ON public.roles TO supabase_auth_admin;

-- Comments for documentation
COMMENT ON FUNCTION public.custom_access_token_hook(jsonb) IS 'Custom Access Token Hook that injects user roles into JWT app_metadata.roles for authorization';

-- Note: After running this migration, you need to:
-- 1. Go to Supabase Dashboard → Authentication → Hooks
-- 2. Create a new hook with type "Custom Access Token"
-- 3. Select the function "custom_access_token_hook"
-- 4. Enable the hook