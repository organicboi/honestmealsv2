-- Fixed Profile Creation Trigger
-- This fixes the issue with profiles not being created automatically

-- Drop and recreate the handle_new_user function with better profile handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  standard_user_role_id integer;
  profile_exists boolean := false;
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user trigger fired for user: % (ID: %)', NEW.email, NEW.id;
  
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO profile_exists;
  
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

  -- Create profile entry if it doesn't exist
  IF NOT profile_exists THEN
    INSERT INTO public.profiles (
      id,
      email,
      created_at,
      updated_at,
      has_onboarded,
      onboarding_step,
      total_referrals,
      total_rewards_earned,
      food_type,
      activity_level,
      spice_level,
      meals_per_day,
      delivery_time
    ) VALUES (
      NEW.id,
      NEW.email,
      NOW(),
      NOW(),
      false,
      0,
      0,
      0,
      'no_preference',
      'moderately_active',
      3,
      3,
      'morning'
    );
    
    RAISE LOG 'Created profile for user: %', NEW.email;
  ELSE
    -- Update existing profile
    UPDATE public.profiles 
    SET 
      email = NEW.email,
      updated_at = NOW()
    WHERE id = NEW.id;
    
    RAISE LOG 'Updated existing profile for user: %', NEW.email;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user for % (ID: %): %', NEW.email, NEW.id, SQLERRM;
    -- Don't fail the signup, just log the error
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role, supabase_auth_admin;

-- Test query: Check if profiles exist for recent users
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    CASE WHEN p.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_profile,
    p.created_at as profile_created,
    r.name as role_assigned
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
WHERE u.created_at > NOW() - INTERVAL '24 hours'
ORDER BY u.created_at DESC
LIMIT 10;

RAISE NOTICE 'Updated trigger function to properly handle profile creation with all required fields and defaults';