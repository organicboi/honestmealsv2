import { getUser } from '@/utils/supabase/server';
import { getChats, getUserCredits } from '@/app/actions/gymna';
import { redirect } from 'next/navigation';
import GymnaClientWrapper from './GymnaClientWrapper';

export default async function AskMePage() {
    const { user } = await getUser();

    if (!user) {
        redirect('/sign-in');
    }

    // Fetch initial data server-side to avoid client-side waterfalls and
    // prevent the Supabase token-refresh cookie cycle that loops RSC refetches.
    const [initialChats, initialCredits] = await Promise.all([
        getChats(),
        getUserCredits(),
    ]);

    return (
        <GymnaClientWrapper
            user={user}
            initialChats={initialChats}
            initialCredits={initialCredits}
        />
    );
}
