'use server';

import { createClient } from '@/utils/supabase/server';
import { updateProfile } from '@/lib/database/profiles';
import { revalidatePath } from 'next/cache';
import type { Profile } from '@/types/database.types';

export async function updateProfileAction(updates: Partial<Profile>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    try {
        const result = await updateProfile(user.id, updates);
        
        if (result.success) {
            revalidatePath('/profile');
            return { success: true, data: result.data };
        } else {
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error('Failed to update profile:', error);
        return { success: false, error: 'Failed to update profile' };
    }
}
