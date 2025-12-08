'use server';

import { createClient } from '@/utils/supabase/server';
import { Meal } from '@/types/database.types';
import { revalidatePath } from 'next/cache';

export async function getMeals() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching meals:', error);
    return [];
  }

  return data as Meal[];
}

export async function getMeal(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching meal:', error);
    return null;
  }

  return data as Meal;
}

export async function createMeal(formData: FormData) {
  const supabase = await createClient();
  
  // Check admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (profile?.role !== 'admin') return { error: 'Unauthorized' };

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const calories = parseInt(formData.get('calories') as string);
  const protein = parseFloat(formData.get('protein') as string);
  const carbs = parseFloat(formData.get('carbs') as string);
  const fat = parseFloat(formData.get('fat') as string);
  const fiber = parseFloat(formData.get('fiber') as string);
  
  // Handle Image Upload
  let image_url = formData.get('image_url') as string;
  const imageFile = formData.get('image') as File;

  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `meal-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('meals')
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return { error: 'Failed to upload image' };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('meals')
      .getPublicUrl(filePath);
      
    image_url = publicUrl;
  }

  const food_type = formData.get('food_type') as 'vegetarian' | 'non-vegetarian';
  const spice_level = parseInt(formData.get('spice_level') as string);
  const cooking_time_minutes = parseInt(formData.get('cooking_time_minutes') as string);
  const is_available = formData.get('is_available') === 'on';
  const is_featured = formData.get('is_featured') === 'on';

  const mealData = {
    name,
    description,
    price,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    image_url,
    food_type,
    spice_level,
    cooking_time_minutes,
    is_available,
    is_featured,
    // Default values for required fields not in form yet
    average_rating: 0,
    total_reviews: 0,
  };

  const { data, error } = await supabase
    .from('meals')
    .insert(mealData)
    .select()
    .single();

  if (error) {
    console.error('Error creating meal:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/meals');
  revalidatePath('/meals'); // Update public page too
  return { success: true, data };
}

export async function updateMeal(id: string, formData: FormData) {
  const supabase = await createClient();
  
  // Check admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (profile?.role !== 'admin') return { error: 'Unauthorized' };

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const calories = parseInt(formData.get('calories') as string);
  const protein = parseFloat(formData.get('protein') as string);
  const carbs = parseFloat(formData.get('carbs') as string);
  const fat = parseFloat(formData.get('fat') as string);
  const fiber = parseFloat(formData.get('fiber') as string);
  
  // Handle Image Upload
  let image_url = formData.get('image_url') as string;
  const imageFile = formData.get('image') as File;

  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `meal-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('meals')
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return { error: 'Failed to upload image' };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('meals')
      .getPublicUrl(filePath);
      
    image_url = publicUrl;
  }

  const food_type = formData.get('food_type') as 'vegetarian' | 'non-vegetarian';
  const spice_level = parseInt(formData.get('spice_level') as string);
  const cooking_time_minutes = parseInt(formData.get('cooking_time_minutes') as string);
  const is_available = formData.get('is_available') === 'on';
  const is_featured = formData.get('is_featured') === 'on';

  const mealData = {
    name,
    description,
    price,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    image_url,
    food_type,
    spice_level,
    cooking_time_minutes,
    is_available,
    is_featured,
  };

  const { error } = await supabase
    .from('meals')
    .update(mealData)
    .eq('id', id);

  if (error) {
    console.error('Error updating meal:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/meals');
  revalidatePath('/meals');
  return { success: true };
}

export async function deleteMeal(id: string) {
  const supabase = await createClient();
  
  // Check admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (profile?.role !== 'admin') return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('meals')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting meal:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/meals');
  revalidatePath('/meals');
  return { success: true };
}
