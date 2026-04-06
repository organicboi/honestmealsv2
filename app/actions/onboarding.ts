'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// ── BMR/TDEE Helpers (Mifflin-St Jeor equation) ──────────────────────────────

function computeBMR(weight: number, height: number, age: number, gender: string): number {
    if (gender === 'male') return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
    sedentary:          1.2,
    lightly_active:     1.375,
    moderately_active:  1.55,
    very_active:        1.725,
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OnboardingData {
    // Step 1 – Personal
    name: string;
    gender: 'male' | 'female' | 'other';
    age: number;
    // Step 2 – Body & Goals
    weight: number;
    height: number;
    goal_weight?: number | null;
    goal_type: string;
    food_type: string;
    dietary_restrictions?: string[];
    preferred_cuisine: string;
    meals_per_day: number;
    // Step 3 – Lifestyle
    activity_level: string;
    workout_experience: string;
    workout_equipment: string;
    workout_days_per_week: number;
    workout_session_duration: string;
    workout_focus_areas?: string[];
    injuries_limitations?: string;
}

// ── Server Action ─────────────────────────────────────────────────────────────

export async function saveOnboardingProfile(data: OnboardingData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Derived calculations
    const bmr  = computeBMR(data.weight, data.height, data.age, data.gender);
    const tdee = Math.round(bmr * (ACTIVITY_MULTIPLIERS[data.activity_level] ?? 1.55));

    // Calorie goal: deficit / surplus / maintenance
    let daily_calorie_goal = tdee;
    if (data.goal_type === 'lose_weight')  daily_calorie_goal = Math.round(tdee * 0.80);
    if (data.goal_type === 'gain_weight')  daily_calorie_goal = Math.round(tdee * 1.15);
    if (data.goal_type === 'build_muscle') daily_calorie_goal = Math.round(tdee * 1.10);

    // Protein goal: 1.8 g/kg for muscle goals, 1.2 g/kg otherwise
    const proteinMult = ['build_muscle', 'gain_weight'].includes(data.goal_type) ? 1.8 : 1.2;
    const daily_protein_goal = Math.round(data.weight * proteinMult);

    // Water goal: 35 ml/kg body weight
    const daily_water_goal_ml = Math.round(data.weight * 35);

    const { error } = await supabase
        .from('profiles')
        .update({
            name:                     data.name,
            gender:                   data.gender,
            age:                      data.age,
            weight:                   data.weight,
            height:                   data.height,
            goal_weight:              data.goal_weight ?? null,
            goal_type:                data.goal_type,
            food_type:                data.food_type,
            dietary_restrictions:     data.dietary_restrictions ?? [],
            preferred_cuisine:        data.preferred_cuisine,
            meals_per_day:            data.meals_per_day,
            activity_level:           data.activity_level,
            workout_experience:       data.workout_experience,
            workout_equipment:        data.workout_equipment,
            workout_days_per_week:    data.workout_days_per_week,
            workout_session_duration: data.workout_session_duration,
            workout_focus_areas:      data.workout_focus_areas ?? [],
            injuries_limitations:     data.injuries_limitations ?? null,
            // Computed
            bmr,
            tdee,
            daily_calorie_goal,
            daily_protein_goal,
            daily_water_goal_ml,
            // Mark complete
            has_onboarded:             true,
            onboarding_completed_at:   new Date().toISOString(),
            updated_at:                new Date().toISOString(),
        })
        .eq('id', user.id);

    if (error) {
        console.error('saveOnboardingProfile error:', error);
        return { error: error.message };
    }

    revalidatePath('/');
    return { success: true };
}

// ── Read helper used by honestask and other features ─────────────────────────

export async function getUserHealthProfile() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id, name, email, gender, age, weight, height, goal_weight,
            goal_type, food_type, dietary_restrictions, preferred_cuisine,
            meals_per_day, activity_level, activity_level,
            workout_experience, workout_equipment, workout_days_per_week,
            workout_session_duration, workout_focus_areas,
            injuries_limitations, daily_water_goal_ml,
            daily_calorie_goal, daily_protein_goal,
            bmr, tdee, has_onboarded, health_conditions
        `)
        .eq('id', user.id)
        .single();

    if (error) return null;
    return data;
}
