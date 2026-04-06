'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { updateUserStreak } from '@/lib/utils/streak';

export async function signInWithMagicLink(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: 'Check your email for the magic link!' };
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

export async function signInWithPassword(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Redirect based on user type and onboarding state
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, has_onboarded')
      .eq('id', user.id)
      .single();

    if (!profile?.has_onboarded) redirect('/onboarding');
    if (profile?.user_type === 'trainer') redirect('/trainer');
  }

  redirect('/dashboard');
}

export async function signUpWithEmail(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const rawUserType = formData.get('user_type') as string | null;
  const user_type = ['personal', 'client', 'trainer'].includes(rawUserType ?? '')
    ? rawUserType!
    : 'personal';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: { user_type },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // When email auto-confirm is ON (email verification disabled in Supabase dashboard),
  // signUp returns a session immediately — redirect straight to onboarding.
  if (data.session) {
    redirect('/onboarding');
  }

  return { success: 'Account created! Please check your email to confirm your account.' };
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
