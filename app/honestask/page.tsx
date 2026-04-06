import { getUser } from '@/utils/supabase/server';
import { getChats, getUserCredits } from '@/app/actions/gymna';
import { getUserHealthProfile } from '@/app/actions/onboarding';
import { redirect } from 'next/navigation';
import GymnaClientWrapper from './GymnaClientWrapper';

export default async function AskMePage() {
    const { user } = await getUser();

    if (!user) {
        redirect('/sign-in');
    }

    let initialChats: any[] = [];
    let initialCredits = 0;
    let healthProfile: any = null;
    try {
        [initialChats, initialCredits, healthProfile] = await Promise.all([
            getChats(),
            getUserCredits(),
            getUserHealthProfile(),
        ]);
    } catch {
        // Non-fatal — client will see empty state and can still chat
    }

    return (
        <GymnaClientWrapper
            user={user}
            initialChats={initialChats}
            initialCredits={initialCredits}
            healthProfile={healthProfile}
        />
    );
}
