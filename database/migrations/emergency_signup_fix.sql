-- Emergency Signup Fix
-- Run this to check for and remove any problematic triggers that might be causing the signup error

-- 1. Check for existing triggers on auth.users that might be causing issues
SELECT 
    tgname as trigger_name,
    tgtype as trigger_type,
    prosrc as function_source
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = (SELECT oid FROM pg_class WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth'))
ORDER BY tgname;

-- 2. If you see any problematic triggers, you can drop them with:
-- DROP TRIGGER IF EXISTS [trigger_name] ON auth.users;

-- 3. Then run both migration files in order:
-- First:  database/migrations/001_setup_roles.sql
-- Second: database/migrations/002_custom_access_token_hook.sql

-- 4. Verification queries to run after migrations:
-- Check if roles exist
SELECT * FROM public.roles ORDER BY name;

-- Check if trigger was created properly
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created' 
AND tgrelid = (
    SELECT oid FROM pg_class 
    WHERE relname = 'users' 
    AND relnamespace = (
        SELECT oid FROM pg_namespace WHERE nspname = 'auth'
    )
);

-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname IN ('handle_new_user', 'jwt_has_role', 'get_user_roles', 'custom_access_token_hook');

-- 5. Test signup after applying fixes:
-- Try creating a test user and check if role is assigned:
-- SELECT 
--   u.email,
--   r.name as role_name
-- FROM auth.users u
-- LEFT JOIN public.user_roles ur ON u.id = ur.user_id
-- LEFT JOIN public.roles r ON ur.role_id = r.id
-- WHERE u.email = 'your-test-email@example.com';