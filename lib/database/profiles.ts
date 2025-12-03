import { createClient } from '@/utils/supabase/server';
import type { Profile, ProfileWithStats } from '@/types/database.types';

export async function getProfile(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data as Profile;
}

export async function getProfileWithStats(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      orders (
        id,
        total_amount,
        status,
        created_at
      ),
      reviews (
        id,
        rating,
        created_at
      ),
      favorites (
        id,
        meal_id
      ),
      nutrition_goals (
        id,
        goal_type,
        target_calories,
        is_active
      )
    `)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile with stats:', error);
    return null;
  }

  return data as ProfileWithStats;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function createProfile(userId: string, email: string, data: Partial<Profile> = {}) {
  const supabase = await createClient();
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      role: 'standard_user',
      food_type: 'no_preference',
      activity_level: 'moderately_active',
      spice_level: 3,
      meals_per_day: 3,
      delivery_time: 'morning',
      onboarding_step: 0,
      has_onboarded: false,
      total_referrals: 0,
      total_rewards_earned: 0,
      ...data,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: profile };
}

export async function getUserRole(userId: string): Promise<Profile['role'] | null> {
  const profile = await getProfile(userId);
  return profile?.role || null;
}

export async function hasRole(userId: string, requiredRole: Profile['role']): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === requiredRole || role === 'admin';
}

export async function checkOnboardingStatus(userId: string) {
  const profile = await getProfile(userId);
  
  if (!profile) {
    return { hasOnboarded: false, currentStep: 0 };
  }

  return {
    hasOnboarded: profile.has_onboarded,
    currentStep: profile.onboarding_step,
  };
}

export async function completeOnboarding(userId: string) {
  return updateProfile(userId, {
    has_onboarded: true,
    onboarding_completed_at: new Date().toISOString(),
  });
}
