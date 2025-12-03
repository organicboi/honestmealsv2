-- Create Profiles for Existing Users
-- This will create profile entries for any existing users who don't have them

-- Insert profiles for users who don't have them yet
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
)
SELECT 
    u.id,
    u.email,
    u.created_at,
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
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Verify the results
SELECT 
    COUNT(*) as total_users,
    COUNT(p.id) as users_with_profiles,
    COUNT(*) - COUNT(p.id) as users_without_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;