'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type WorkoutSet = {
  id?: string
  weight_kg?: number
  reps?: number
}

export type WorkoutExercise = {
  id?: string
  exercise_name: string
  sets: WorkoutSet[]
}

export type WorkoutLog = {
  id: string
  log_date: string
  category_id: string
  custom_category_name?: string
  duration_minutes?: number
  intensity_level?: number
  notes?: string
  exercises: WorkoutExercise[]
}

export async function getWorkoutLogs(startDate: string, endDate: string): Promise<WorkoutLog[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Fetch logs
  const { data: logs, error: logsError } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: true })

  if (logsError || !logs) {
    console.error('Error fetching workout logs:', logsError)
    return []
  }

  // Fetch exercises for these logs
  const logIds = logs.map(l => l.id)
  if (logIds.length === 0) return []

  const { data: exercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .select(`
      id,
      workout_log_id,
      exercise_name,
      workout_sets (
        id,
        weight_kg,
        reps,
        set_number
      )
    `)
    .in('workout_log_id', logIds)
    .order('order_index', { ascending: true })

  if (exercisesError) {
    console.error('Error fetching exercises:', exercisesError)
    return []
  }

  // Assemble the data
  const result: WorkoutLog[] = logs.map(log => {
    const logExercises = exercises
      .filter(e => e.workout_log_id === log.id)
      .map(e => ({
        id: e.id,
        exercise_name: e.exercise_name,
        sets: (e.workout_sets || []).sort((a: any, b: any) => a.set_number - b.set_number).map((s: any) => ({
          id: s.id,
          weight_kg: s.weight_kg,
          reps: s.reps
        }))
      }))

    return {
      id: log.id,
      log_date: log.log_date,
      category_id: log.category_id,
      custom_category_name: log.custom_category_name,
      duration_minutes: log.duration_minutes,
      intensity_level: log.intensity_level,
      notes: log.notes,
      exercises: logExercises
    }
  })

  return result
}

export type SaveWorkoutInput = {
  id?: string
  date: string
  category_id: string
  custom_category_name?: string
  duration?: number
  intensity?: number
  notes?: string
  exercises: {
    name: string
    sets: {
      weight?: number
      reps?: number
    }[]
  }[]
}

export async function saveWorkoutLog(input: SaveWorkoutInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  // 1. Upsert Log
  const logData = {
    user_id: user.id,
    log_date: input.date,
    category_id: input.category_id,
    custom_category_name: input.custom_category_name,
    duration_minutes: input.duration,
    intensity_level: input.intensity,
    notes: input.notes,
    updated_at: new Date().toISOString()
  }

  let logId = input.id

  if (logId) {
    // Update existing
    const { error } = await supabase
      .from('workout_logs')
      .update(logData)
      .eq('id', logId)
      .eq('user_id', user.id)
    
    if (error) throw error
  } else {
    // Insert new - use upsert to handle duplicates in one call
    const { data, error } = await supabase
      .from('workout_logs')
      .upsert({
        ...logData,
        user_id: user.id
      }, {
        onConflict: 'user_id,log_date', // Assuming you have a unique constraint on these
        ignoreDuplicates: false
      })
      .select()
      .single()
    
    if (error) throw error
    logId = data.id
  }

  if (!logId) throw new Error('Failed to get log ID')

  // 2. Handle Exercises - OPTIMIZED: Delete all and batch insert
  // First, delete existing exercises for this log (cascade deletes sets automatically)
  await supabase.from('workout_exercises').delete().eq('workout_log_id', logId)

  // Batch insert all exercises
  if (input.exercises.length > 0) {
    const exercisesData = input.exercises.map((ex, i) => ({
      workout_log_id: logId,
      exercise_name: ex.name,
      order_index: i
    }))

    const { data: insertedExercises, error: exError } = await supabase
      .from('workout_exercises')
      .insert(exercisesData)
      .select('id, order_index')
    
    if (exError) throw exError
    if (!insertedExercises) throw new Error('Failed to insert exercises')

    // Batch insert all sets at once
    const allSetsData: any[] = []
    insertedExercises.forEach((exData) => {
      const exercise = input.exercises[exData.order_index]
      if (exercise.sets.length > 0) {
        exercise.sets.forEach((s, idx) => {
          allSetsData.push({
            workout_exercise_id: exData.id,
            set_number: idx + 1,
            weight_kg: s.weight || 0,
            reps: s.reps || 0
          })
        })
      }
    })

    if (allSetsData.length > 0) {
      const { error: setsError } = await supabase
        .from('workout_sets')
        .insert(allSetsData)
      
      if (setsError) throw setsError
    }
  }

  revalidatePath('/workout')
}

export async function deleteWorkoutLog(logId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
  
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('workout_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', user.id)

    if (error) throw error
    revalidatePath('/workout')
}

export async function getCustomExercises() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
  
    if (!user) return []

    const { data, error } = await supabase
        .from('user_custom_exercises')
        .select('name')
        .eq('user_id', user.id)
    
    if (error) return []
    return data.map(d => d.name)
}

export async function saveCustomExercise(name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
  
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('user_custom_exercises')
        .insert({ user_id: user.id, name })
        .ignore() // Ignore if duplicate
    
    if (error) console.error('Error saving custom exercise', error)
}
