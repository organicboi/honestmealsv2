'use server';

import { createClient } from '@/utils/supabase/server';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface DashboardProfile {
    id: string;
    name: string | null;
    email: string;
    gender: string | null;
    age: number | null;
    weight: number | null;
    height: number | null;
    goal_weight: number | null;
    goal_type: string | null;
    food_type: string | null;
    activity_level: string | null;
    workout_experience: string | null;
    workout_equipment: string | null;
    daily_calorie_goal: number | null;
    daily_protein_goal: number | null;
    daily_water_goal_ml: number | null;
    bmr: number | null;
    tdee: number | null;
    gymna_credits: number;
    has_onboarded: boolean;
}

export interface DashboardData {
    profile: DashboardProfile;
    today: {
        calories: { current: number; goal: number };
        protein:  { current: number; goal: number };
        carbs:    { current: number; goal: number };
        fat:      { current: number; goal: number };
        water:    { current: number; goal: number };
    };
    streak:  { current: number; longest: number };
    weight: {
        current: number | null;
        start:   number | null;
        goal:    number | null;
        logs:    { weight: number; log_date: string }[];
    };
    recentOrders: { id: string; order_date: string; status: string; total_amount: number }[];
}

// ─── Action ────────────────────────────────────────────────────────────────

export async function getDashboardData(): Promise<DashboardData | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const today = new Date().toISOString().split('T')[0];

    const [
        { data: profile },
        { data: foodLogs },
        { data: waterLogs },
        { data: streak },
        { data: weightLogs },
        { data: recentOrders },
    ] = await Promise.all([
        // Profile (source of truth for goals)
        supabase
            .from('profiles')
            .select(`
                id, name, email, gender, age, weight, height, goal_weight,
                goal_type, food_type, activity_level, workout_experience,
                workout_equipment, daily_calorie_goal, daily_protein_goal,
                daily_water_goal_ml, bmr, tdee, gymna_credits, has_onboarded
            `)
            .eq('id', user.id)
            .single(),

        // Today's food logs
        supabase
            .from('food_logs')
            .select('calories_consumed, protein_consumed, carbs_consumed, fat_consumed')
            .eq('user_id', user.id)
            .gte('consumed_at', `${today}T00:00:00`)
            .lte('consumed_at', `${today}T23:59:59`),

        // Today's water
        supabase
            .from('water_logs')
            .select('amount_ml')
            .eq('user_id', user.id)
            .gte('logged_at', `${today}T00:00:00`)
            .lte('logged_at', `${today}T23:59:59`),

        // Streak (nutrition_goals type)
        supabase
            .from('user_streaks')
            .select('current_streak, longest_streak')
            .eq('customer_id', user.id)
            .eq('streak_type', 'nutrition_goals')
            .maybeSingle(),

        // Last 30 weight logs for mini chart
        supabase
            .from('weight_logs')
            .select('weight, log_date')
            .eq('user_id', user.id)
            .order('log_date', { ascending: false })
            .limit(30),

        // Last 3 orders
        supabase
            .from('orders')
            .select('id, order_date, status, total_amount')
            .eq('customer_id', user.id)
            .order('order_date', { ascending: false })
            .limit(3),
    ]);

    if (!profile) return null;

    // Compute today's totals
    const cals    = foodLogs?.reduce((s, l) => s + (l.calories_consumed || 0), 0) || 0;
    const protein = foodLogs?.reduce((s, l) => s + (l.protein_consumed  || 0), 0) || 0;
    const carbs   = foodLogs?.reduce((s, l) => s + (l.carbs_consumed    || 0), 0) || 0;
    const fat     = foodLogs?.reduce((s, l) => s + (l.fat_consumed      || 0), 0) || 0;
    const water   = waterLogs?.reduce((s, l) => s + l.amount_ml, 0) || 0;

    const latestWeight = weightLogs?.[0]?.weight ?? null;
    const startWeight  = weightLogs?.[weightLogs.length - 1]?.weight ?? null;

    return {
        profile: profile as DashboardProfile,
        today: {
            calories: { current: Math.round(cals),    goal: profile.daily_calorie_goal ?? 2000 },
            protein:  { current: Math.round(protein), goal: profile.daily_protein_goal ?? 150 },
            carbs:    { current: Math.round(carbs),   goal: 250 },
            fat:      { current: Math.round(fat),     goal: 65 },
            water:    { current: water,                goal: profile.daily_water_goal_ml ?? 2500 },
        },
        streak: {
            current: streak?.current_streak ?? 0,
            longest: streak?.longest_streak ?? 0,
        },
        weight: {
            current: latestWeight ?? profile.weight ?? null,
            start:   startWeight  ?? profile.weight ?? null,
            goal:    profile.goal_weight ?? null,
            logs:    (weightLogs ?? []).reverse(), // ascending for chart
        },
        recentOrders: recentOrders ?? [],
    };
}

// ─── Curated prompt type (used by lib/utils/dashboard-prompts.ts) ──────────

export interface CuratedPrompt {
    id:       string;
    text:     string;
    category: 'diet' | 'workout' | 'hydration' | 'motivation';
    emoji:    string;
}
