import { createClient, createAnonymousClient } from '@/utils/supabase/server';
import { unstable_cache } from 'next/cache';
import type { Meal, MealWithDetails, MealCategory, DietaryType } from '@/types/database.types';

export async function getMeals(options?: {
  foodType?: 'vegetarian' | 'non-vegetarian';
  categoryId?: string;
  dietaryTypeId?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  limit?: number;
}) {
  const supabase = await createClient();
  
  let query = supabase
    .from('meals')
    .select(`
      *,
      meal_categories (
        id,
        name,
        description
      ),
      dietary_types (
        id,
        name,
        description
      )
    `)
    .order('created_at', { ascending: false });

  if (options?.foodType) {
    query = query.eq('food_type', options.foodType);
  }

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId);
  }

  if (options?.dietaryTypeId) {
    query = query.eq('dietary_type_id', options.dietaryTypeId);
  }

  if (options?.isAvailable !== undefined) {
    query = query.eq('is_available', options.isAvailable);
  }

  if (options?.isFeatured !== undefined) {
    query = query.eq('is_featured', options.isFeatured);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching meals:', error);
    return [];
  }

  return data as MealWithDetails[];
}

export async function getMealById(mealId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('meals')
    .select(`
      *,
      meal_categories (
        id,
        name,
        description
      ),
      dietary_types (
        id,
        name,
        description
      ),
      reviews (
        id,
        rating,
        comment,
        taste_rating,
        portion_rating,
        value_rating,
        created_at,
        profiles (
          name,
          email
        )
      )
    `)
    .eq('id', mealId)
    .single();

  if (error) {
    console.error('Error fetching meal:', error);
    return null;
  }

  return data as MealWithDetails;
}

// Cache meal categories for 1 hour (they rarely change)
// Uses anonymous client to avoid cookies() inside unstable_cache
export const getMealCategories = unstable_cache(
  async () => {
    const supabase = createAnonymousClient();

    const { data, error } = await supabase
      .from('meal_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data as MealCategory[];
  },
  ['meal-categories'],
  { revalidate: 3600, tags: ['meal-categories'] }
);

// Cache dietary types for 1 hour (they rarely change)
// Uses anonymous client to avoid cookies() inside unstable_cache
export const getDietaryTypes = unstable_cache(
  async () => {
    const supabase = createAnonymousClient();

    const { data, error } = await supabase
      .from('dietary_types')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching dietary types:', error);
      return [];
    }

    return data as DietaryType[];
  },
  ['dietary-types'],
  { revalidate: 3600, tags: ['dietary-types'] }
);

export async function searchMeals(searchQuery: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('meals')
    .select(`
      *,
      meal_categories (
        id,
        name
      ),
      dietary_types (
        id,
        name
      )
    `)
    .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    .eq('is_available', true)
    .order('average_rating', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error searching meals:', error);
    return [];
  }

  return data as MealWithDetails[];
}

export async function getFeaturedMeals(limit: number = 6) {
  return getMeals({ 
    isFeatured: true, 
    isAvailable: true,
    limit 
  });
}

export async function getUserFavoriteMeals(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      meal_id,
      meals (
        *,
        meal_categories (
          id,
          name
        ),
        dietary_types (
          id,
          name
        )
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }

  // @ts-ignore - Supabase returns nested meals as an array
  return (data.map(fav => fav.meals).filter(Boolean) as unknown) as Meal[];
}

export async function toggleFavorite(userId: string, mealId: string) {
  const supabase = await createClient();

  // Optimized: Try to delete first, if no rows affected then insert
  // This reduces 2 queries to 1 in most cases
  const { data: deleted, error: deleteError } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('meal_id', mealId)
    .select('id');

  if (deleteError) {
    return { success: false, action: 'error' };
  }

  // If we deleted something, the favorite was removed
  if (deleted && deleted.length > 0) {
    return { success: true, action: 'removed' };
  }

  // Nothing was deleted, so add the favorite
  const { error: insertError } = await supabase
    .from('favorites')
    .insert({ user_id: userId, meal_id: mealId });

  return { success: !insertError, action: 'added' };
}
