import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Updates the user's login streak.
 * This is called on every successful login (email/password or OAuth).
 *
 * @param supabase - The Supabase client instance
 * @param userId - The user's ID
 */
export async function updateUserStreak(supabase: SupabaseClient, userId: string) {
    try {
        const { data: streak } = await supabase
            .from('user_streaks')
            .select('*')
            .eq('customer_id', userId)
            .eq('streak_type', 'nutrition_goals')
            .maybeSingle();

        if (streak) {
            await supabase
                .from('user_streaks')
                .update({
                    current_streak: streak.current_streak + 1,
                    longest_streak: Math.max(streak.longest_streak, streak.current_streak + 1),
                    last_activity_date: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', streak.id);
        } else {
            await supabase
                .from('user_streaks')
                .insert({
                    customer_id: userId,
                    current_streak: 1,
                    longest_streak: 1,
                    streak_type: 'nutrition_goals',
                    last_activity_date: new Date().toISOString()
                });
        }
    } catch (err) {
        console.error('Failed to update streak on login:', err);
    }
}
