-- Emergency Fix: Remove All Problematic Triggers
-- This will find and fix ALL triggers that reference non-existent fields

-- 1. First, let's see what triggers are causing issues
SELECT 
    t.tgname as trigger_name,
    p.proname as function_name,
    p.prosrc as function_source
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = (
    SELECT oid FROM pg_class 
    WHERE relname = 'users' 
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
)
AND t.tgname NOT LIKE 'RI_ConstraintTrigger%'
AND t.tgname NOT LIKE '%_not_null';

-- 2. Drop the problematic auto_create_referral_code function and its trigger
DROP FUNCTION IF EXISTS public.auto_create_referral_code() CASCADE;

-- 3. Drop any other problematic triggers that might reference NEW.role
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    -- Get all custom triggers on auth.users
    FOR trigger_rec IN 
        SELECT t.tgname, p.proname, p.prosrc
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE t.tgrelid = (
            SELECT oid FROM pg_class 
            WHERE relname = 'users' 
            AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
        )
        AND t.tgname NOT LIKE 'RI_ConstraintTrigger%'
        AND t.tgname NOT LIKE '%_not_null'
        AND t.tgname != 'on_auth_user_created'  -- Keep our good trigger
    LOOP
        -- Check if the function source contains problematic references
        IF trigger_rec.prosrc LIKE '%NEW.role%' THEN
            RAISE NOTICE 'Dropping problematic trigger: % (function: %)', trigger_rec.tgname, trigger_rec.proname;
            EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_rec.tgname) || ' ON auth.users CASCADE';
            EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(trigger_rec.proname) || '() CASCADE';
        END IF;
    END LOOP;
END $$;

-- 4. Now create a PROPER referral code function that doesn't reference NEW.role
CREATE OR REPLACE FUNCTION public.auto_create_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_referral_code text;
    user_roles text[];
BEGIN
    -- Get user roles from user_roles table (not from NEW.role which doesn't exist)
    SELECT ARRAY(
        SELECT r.name
        FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = NEW.id
    ) INTO user_roles;
    
    -- Check if user has trainer or influencer role AND no referral code
    IF (user_roles && ARRAY['trainer', 'influencer']) AND NEW.referral_code IS NULL THEN
        -- Generate a unique referral code
        new_referral_code := UPPER(SUBSTRING(NEW.email FROM 1 FOR 3)) || '_' || SUBSTRING(NEW.id::text FROM 1 FOR 8);
        
        -- Update the profile with the referral code
        UPDATE public.profiles 
        SET referral_code = new_referral_code 
        WHERE id = NEW.id;
        
        RAISE LOG 'Generated referral code % for user %', new_referral_code, NEW.email;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in auto_create_referral_code for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$;

-- 5. Create the fixed trigger (only if needed)
-- Note: This trigger should fire AFTER the profile is created
DROP TRIGGER IF EXISTS on_auto_create_referral_code ON auth.users;
CREATE TRIGGER on_auto_create_referral_code
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_referral_code();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.auto_create_referral_code() TO service_role, supabase_auth_admin;

-- 6. Verification - check what triggers remain
SELECT 
    t.tgname as trigger_name,
    p.proname as function_name,
    CASE 
        WHEN p.prosrc LIKE '%NEW.role%' THEN 'PROBLEMATIC - references NEW.role'
        ELSE 'OK'
    END as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = (
    SELECT oid FROM pg_class 
    WHERE relname = 'users' 
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
)
AND t.tgname NOT LIKE 'RI_ConstraintTrigger%'
AND t.tgname NOT LIKE '%_not_null'
ORDER BY t.tgname;

RAISE NOTICE 'Fixed all problematic triggers that referenced NEW.role';