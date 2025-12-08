import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // TEMPORARY: Increase streak on every login
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: streak } = await supabase
            .from('user_streaks')
            .select('*')
            .eq('customer_id', user.id)
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
                customer_id: user.id,
                current_streak: 1,
                longest_streak: 1,
                streak_type: 'nutrition_goals',
                last_activity_date: new Date().toISOString()
              });
          }
        }
      } catch (err) {
        console.error('Failed to update streak on login:', err);
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
