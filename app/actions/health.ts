'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type HealthDashboardData = {
  nutrition: {
    calories: { current: number; goal: number }
    protein: { current: number; goal: number }
    carbs: { current: number; goal: number }
    fat: { current: number; goal: number }
  }
  water: {
    current: number // in ml
    goal: number // in ml
  }
  streak: {
    current: number
    longest: number
  }
  weight: {
    current: number
    goal: number | null
    start: number | null
  }
  user: {
    name: string
    avatar: string | null
  }
}

export async function getHealthDashboardData(): Promise<HealthDashboardData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const today = new Date().toISOString().split('T')[0]

  // 1. Fetch Daily Goals
  const { data: goals } = await supabase
    .from('daily_goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  // 2. Fetch Today's Food Logs directly for real-time updates
  const { data: foodLogs } = await supabase
    .from('food_logs')
    .select('calories_consumed, protein_consumed, carbs_consumed, fat_consumed')
    .eq('user_id', user.id)
    .gte('consumed_at', `${today}T00:00:00`)
    .lte('consumed_at', `${today}T23:59:59`)

  const nutritionTotals = foodLogs?.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories_consumed || 0),
      protein: acc.protein + (log.protein_consumed || 0),
      carbs: acc.carbs + (log.carbs_consumed || 0),
      fat: acc.fat + (log.fat_consumed || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fat: 0 }

  // 3. Fetch Water Intake (Sum of logs for today or from summary table)
  // Using water_logs for real-time accuracy if summary isn't updated instantly
  const { data: waterLogs } = await supabase
    .from('water_logs')
    .select('amount_ml')
    .eq('user_id', user.id)
    .gte('logged_at', `${today}T00:00:00`)
    .lte('logged_at', `${today}T23:59:59`)

  const currentWater = waterLogs?.reduce((sum, log) => sum + log.amount_ml, 0) || 0

  // 4. Fetch Streak
  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('customer_id', user.id)
    .eq('streak_type', 'nutrition_goals') // Assuming this is the main one
    .maybeSingle()

  // 5. Fetch Weight/Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('weight, goal_aim, name') // goal_aim might be text, need to check schema for target weight
    .eq('id', user.id)
    .maybeSingle()
    
  // Fetch target weight from nutrition_goals if available
  const { data: nutritionGoals } = await supabase
    .from('nutrition_goals')
    .select('target_weight')
    .eq('customer_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  return {
    nutrition: {
      calories: {
        current: nutritionTotals.calories,
        goal: goals?.daily_calorie_goal || 2000,
      },
      protein: {
        current: nutritionTotals.protein,
        goal: goals?.daily_protein_goal || 150,
      },
      carbs: {
        current: nutritionTotals.carbs,
        goal: 250, // Default or fetch if available
      },
      fat: {
        current: nutritionTotals.fat,
        goal: 65, // Default or fetch if available
      },
    },
    water: {
      current: currentWater,
      goal: goals?.daily_water_goal_ml || 2500,
    },
    streak: {
      current: streak?.current_streak || 0,
      longest: streak?.longest_streak || 0,
    },
    weight: {
      current: profile?.weight || 0,
      goal: nutritionGoals?.target_weight || null,
      start: null, // Could fetch from first progress photo or history
    },
    user: {
      name: profile?.name || 'User',
      avatar: null, // Add avatar logic if available
    },
  }
}

export async function logWater(amount: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  await supabase.from('water_logs').insert({
    user_id: user.id,
    amount_ml: amount,
  })

  revalidatePath('/health')
}
