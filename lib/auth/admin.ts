import { createClient } from '@/utils/supabase/server';
import { SupabaseClient, User } from '@supabase/supabase-js';

interface AdminAuthResult {
    authorized: true;
    supabase: SupabaseClient;
    user: User;
}

interface AdminAuthError {
    authorized: false;
    error: string;
}

type RequireAdminResult = AdminAuthResult | AdminAuthError;

/**
 * Verifies the current user is authenticated and has admin role.
 * Use this at the start of admin server actions to avoid repeating the same check.
 *
 * @returns Object with authorized status, supabase client, and user if authorized
 *
 * @example
 * export async function createMeal(formData: FormData) {
 *   const auth = await requireAdmin();
 *   if (!auth.authorized) return { error: auth.error };
 *
 *   const { supabase, user } = auth;
 *   // ... rest of the action
 * }
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { authorized: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { authorized: false, error: 'Unauthorized' };
    }

    return { authorized: true, supabase, user };
}
