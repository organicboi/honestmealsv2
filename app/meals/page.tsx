import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getMeals, getMealCategories, getDietaryTypes } from '@/lib/database/meals';
import { getProfile } from '@/lib/database/profiles';
import MealsClient from './MealsClient';

export default async function MealsPage({
    searchParams,
}: {
    searchParams: Promise<{ diet?: string; category?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch user profile if user exists
    const profile = user ? await getProfile(user.id) : null;

    // Await searchParams
    const params = await searchParams;

    // Map diet parameter to food type
    let foodType: 'vegetarian' | 'non-vegetarian' | undefined;
    if (params.diet === 'veg') {
        foodType = 'vegetarian';
    } else if (params.diet === 'non-veg') {
        foodType = 'non-vegetarian';
    }

    // Fetch meals from database
    const meals = await getMeals({
        foodType,
        categoryId: params.category,
        isAvailable: true,
    });

    // Fetch categories and dietary types
    const categories = await getMealCategories();
    const dietaryTypes = await getDietaryTypes();

    return (
        <MealsClient 
            user={user} 
            profile={profile}
            initialMeals={meals}
            categories={categories}
            dietaryTypes={dietaryTypes}
            selectedDiet={params.diet} 
        />
    );
}
