import { getDashboardData } from '@/app/actions/dashboard';
import { buildCuratedPrompts } from '@/lib/utils/dashboard-prompts';
import DashboardClient from './DashboardClient';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/sign-in');

    const data = await getDashboardData();

    if (!data) redirect('/sign-in');

    // If user hasn't onboarded yet, send them to onboarding
    if (!data.profile.has_onboarded) redirect('/onboarding');

    const prompts = buildCuratedPrompts(data.profile);

    return <DashboardClient data={data} prompts={prompts} />;
}
