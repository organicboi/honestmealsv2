import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/sign-in');

    const { data: profile } = await supabase
        .from('profiles')
        .select('has_onboarded, name, user_type')
        .eq('id', user.id)
        .single();

    // Already onboarded → send to appropriate home
    if (profile?.has_onboarded) {
        if (profile.user_type === 'trainer') redirect('/trainer');
        redirect('/dashboard');
    }

    return (
        <OnboardingClient
            userName={profile?.name ?? ''}
            userType={(profile?.user_type as 'personal' | 'client' | 'trainer') ?? 'personal'}
        />
    );
}
