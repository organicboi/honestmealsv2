'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type MealSearchResult = {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  image_url: string | null
  food_type: 'vegetarian' | 'non-vegetarian'
}

export async function searchMeals(query: string): Promise<MealSearchResult[]> {
  const supabase = await createClient()
  
  if (!query || query.length < 2) return []

  const { data, error } = await supabase
    .from('meals')
    .select('id, name, calories, protein, carbs, fat, image_url, food_type')
    .ilike('name', `%${query}%`)
    .limit(10)

  if (error) {
    console.error('Error searching meals:', error)
    return []
  }

  return data as MealSearchResult[]
}

export type LogFoodInput = {
  meal_id?: string
  custom_food_name?: string
  quantity: number // Number of servings or grams? Let's assume servings for meals, 1 for manual
  calories: number
  protein: number
  carbs: number
  fat: number
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  date: string // YYYY-MM-DD
}

export async function logFood(input: LogFoodInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  // Construct timestamp from date (default to current time if today, else noon)
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  
  let consumed_at = `${input.date}T12:00:00`
  if (input.date === today) {
    consumed_at = now.toISOString()
  }

  const { error } = await supabase.from('food_logs').insert({
    user_id: user.id,
    meal_id: input.meal_id || null,
    custom_food_name: input.custom_food_name || null,
    quantity: input.quantity,
    calories_consumed: input.calories,
    protein_consumed: input.protein,
    carbs_consumed: input.carbs,
    fat_consumed: input.fat,
    meal_type: input.meal_type,
    consumed_at: consumed_at,
  })

  if (error) {
    console.error('Error logging food:', error)
    throw new Error('Failed to log food')
  }

  revalidatePath('/health')
  revalidatePath('/health/log-food')
}

export type FoodLogItem = {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  meal_type: string
  consumed_at: string
}

export async function getTodayFoodLogs(): Promise<FoodLogItem[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('food_logs')
    .select(`
      id,
      custom_food_name,
      calories_consumed,
      protein_consumed,
      carbs_consumed,
      fat_consumed,
      meal_type,
      consumed_at,
      meals (
        name
      )
    `)
    .eq('user_id', user.id)
    .gte('consumed_at', `${today}T00:00:00`)
    .lte('consumed_at', `${today}T23:59:59`)
    .order('consumed_at', { ascending: false })

  if (error) {
    console.error('Error fetching food logs:', error)
    return []
  }

  return data.map((log: any) => ({
    id: log.id,
    name: log.custom_food_name || log.meals?.name || 'Unknown Food',
    calories: log.calories_consumed,
    protein: log.protein_consumed,
    carbs: log.carbs_consumed,
    fat: log.fat_consumed,
    meal_type: log.meal_type,
    consumed_at: log.consumed_at
  }))
}

export async function deleteFoodLog(logId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('food_logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting food log:', error)
    throw new Error('Failed to delete food log')
  }

  revalidatePath('/health')
  revalidatePath('/health/log-food')
}

export async function updateFoodLog(logId: string, input: LogFoodInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('food_logs')
    .update({
      custom_food_name: input.custom_food_name || null,
      quantity: input.quantity,
      calories_consumed: input.calories,
      protein_consumed: input.protein,
      carbs_consumed: input.carbs,
      fat_consumed: input.fat,
      meal_type: input.meal_type,
    })
    .eq('id', logId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating food log:', error)
    throw new Error('Failed to update food log')
  }

  revalidatePath('/health')
  revalidatePath('/health/log-food')
}
