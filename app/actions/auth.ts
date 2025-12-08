'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { data: authData, error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  // TEMPORARY: Increase streak on every login
  if (authData.user) {
    try {
      const { data: streak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('customer_id', authData.user.id)
        .eq('streak_type', 'nutrition_goals')
        .maybeSingle();

      if (streak) {
        await supabase
          .from('user_streaks')
          .update({ 
            current_streak: streak.current_streak + 1,
            // Update longest streak if current exceeds it
            longest_streak: Math.max(streak.longest_streak, streak.current_streak + 1),
            last_activity_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', streak.id);
      } else {
        await supabase
          .from('user_streaks')
          .insert({
            customer_id: authData.user.id,
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

  redirect('/');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  // Sign up the user
  // The database trigger (handle_new_user) will automatically:
  // 1. Assign the 'standard_user' role
  // 2. Create a profile entry
  const { data: authData, error: signUpError } = await supabase.auth.signUp(data);

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (!authData.user) {
    return { error: 'Failed to create user account' };
  }

  redirect('/');
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/sign-in');
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: 'Password reset email sent!' };
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}
