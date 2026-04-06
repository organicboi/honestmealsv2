import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { updateUserStreak } from '@/lib/utils/streak';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateUserStreak(supabase, user.id);

        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('has_onboarded, user_type')
          .eq('id', user.id)
          .single();

        let destination: string;
        if (!profile?.has_onboarded) {
          destination = '/onboarding';
        } else if (profile?.user_type === 'trainer') {
          destination = '/trainer';
        } else {
          destination = next;
        }

        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${destination}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${destination}`);
        } else {
          return NextResponse.redirect(`${origin}${destination}`);
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
