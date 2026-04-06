import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/sign-in');

    const { data: profile } = await supabase
        .from('profiles')
        .select('has_onboarded, name')
        .eq('id', user.id)
        .single();

    // Already onboarded → skip
    if (profile?.has_onboarded) redirect('/meals');

    return <OnboardingClient userName={profile?.name ?? ''} />;
}
