-- Diagnostic Script: Check Profile Creation Issues
-- Run this to diagnose why profiles aren't being created automatically

-- 1. Check if the trigger exists and is active
SELECT 
    tgname as trigger_name,
    tgenabled as is_enabled,
    tgtype as trigger_type
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created'
AND tgrelid = (
    SELECT oid FROM pg_class 
    WHERE relname = 'users' 
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
);

-- 2. Check if the handle_new_user function exists
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Check recent users without profiles
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    p.id as profile_id,
    p.created_at as profile_created
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.created_at > NOW() - INTERVAL '1 hour'
ORDER BY u.created_at DESC
LIMIT 10;

-- 4. Check user_roles assignments
SELECT 
    u.email,
    r.name as role_name,
    ur.created_at as role_assigned
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
WHERE u.created_at > NOW() - INTERVAL '1 hour'
ORDER BY u.created_at DESC;

-- 5. Test if we can manually create a profile for a user
-- (Replace 'user-id-here' with an actual user ID that has no profile)
/*
INSERT INTO public.profiles (
    id,
    email,
    created_at,
    updated_at,
    has_onboarded,
    onboarding_step
) 
SELECT 
    u.id,
    u.email,
    NOW(),
    NOW(),
    false,
    0
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
LIMIT 1;
*/