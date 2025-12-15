'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type WeightLog = {
  id: string
  weight: number
  log_date: string
  created_at: string
}

export type ProgressPhoto = {
  id: string
  image_url: string
  weight: number | null
  taken_at: string
  notes: string | null
  photo_type: 'progress' | 'before' | 'after' | 'milestone'
}

export async function getWeightHistory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('weight_logs')
    .select('id, weight, log_date, created_at')
    .eq('user_id', user.id)
    .order('log_date', { ascending: true })

  if (error) throw error
  return data as WeightLog[]
}

export async function getProgressPhotos() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('progress_photos')
    .select('id, image_url, weight, taken_at, notes, photo_type')
    .eq('user_id', user.id)
    .order('taken_at', { ascending: false })

  if (error) throw error
  return data as ProgressPhoto[]
}

// OPTIMIZED: Fetch both weight history and photos in parallel
export async function getProgressData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const [weightHistory, progressPhotos] = await Promise.all([
    getWeightHistory(),
    getProgressPhotos()
  ])

  return { weightHistory, progressPhotos }
}

export async function logWeight(weight: number, date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('weight_logs')
    .insert({
      user_id: user.id,
      weight,
      log_date: date
    })

  if (error) throw error
  revalidatePath('/health/progress')
  revalidatePath('/health')
}

export async function addProgressPhoto(
  imageUrl: string, 
  weight: number | null, 
  date: string,
  notes: string | null,
  type: 'progress' | 'before' | 'after' | 'milestone' = 'progress'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  // 1. Add photo
  const { error: photoError } = await supabase
    .from('progress_photos')
    .insert({
      user_id: user.id,
      image_url: imageUrl,
      weight,
      taken_at: date,
      notes,
      photo_type: type
    })

  if (photoError) throw photoError

  // 2. If weight is provided, also log it to weight_logs for the chart
  if (weight) {
    await supabase
      .from('weight_logs')
      .insert({
        user_id: user.id,
        weight,
        log_date: date.split('T')[0] // Ensure YYYY-MM-DD
      })
  }

  revalidatePath('/health/progress')
  revalidatePath('/health')
}

export async function deleteProgressPhoto(photoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  // 1. Get the photo URL first to delete from storage
  const { data: photo } = await supabase
    .from('progress_photos')
    .select('image_url')
    .eq('id', photoId)
    .eq('user_id', user.id)
    .single()

  if (photo?.image_url) {
    try {
      // Extract filename from URL
      // URL format: .../storage/v1/object/public/progress_photos/filename.ext
      const fileName = photo.image_url.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('progress_photos')
          .remove([fileName])
      }
    } catch (e) {
      console.error('Error deleting file from storage:', e)
      // Continue to delete record even if storage delete fails
    }
  }

  const { error } = await supabase
    .from('progress_photos')
    .delete()
    .eq('id', photoId)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/health/progress')
}

export async function updateProgressPhoto(
  photoId: string,
  updates: { weight?: number | null; notes?: string | null; photo_type?: string }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('progress_photos')
    .update(updates)
    .eq('id', photoId)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/health/progress')
}

export async function deleteWeightLog(logId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('weight_logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/health/progress')
  revalidatePath('/health')
}

export async function updateWeightLog(logId: string, weight: number, date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('weight_logs')
    .update({
      weight,
      log_date: date
    })
    .eq('id', logId)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/health/progress')
  revalidatePath('/health')
}

export async function getGoalWeight() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('goal_weight')
      .eq('id', user.id)
      .single()

    if (error) {
      // If the column doesn't exist yet, just return null
      console.warn('Error fetching goal weight (possibly missing column):', error.message)
      return null
    }
    return data?.goal_weight as number | null
  } catch (e) {
    return null
  }
}

export async function updateGoalWeight(weight: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('profiles')
    .update({ goal_weight: weight })
    .eq('id', user.id)

  if (error) throw error
  revalidatePath('/health/progress')
}
