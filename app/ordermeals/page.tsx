import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getMeals, getMealCategories, getDietaryTypes } from '@/lib/database/meals';
import { getProfile } from '@/lib/database/profiles';
import OrderMealsClient from './OrderMealsClient';

export default async function OrderMealsPage({
    searchParams,
}: {
    searchParams: Promise<{ diet?: string; category?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/sign-in');
    }

    // Fetch user profile
    const profile = await getProfile(user.id);

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
        <OrderMealsClient 
            user={user} 
            profile={profile}
            initialMeals={meals}
            categories={categories}
            dietaryTypes={dietaryTypes}
            selectedDiet={params.diet} 
        />
    );
}
