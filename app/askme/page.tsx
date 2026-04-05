import { getUser } from '@/utils/supabase/server';
import { getChats, getUserCredits } from '@/app/actions/gymna';
import { redirect } from 'next/navigation';
import GymnaClientWrapper from './GymnaClientWrapper';

export default async function AskMePage() {
    const { user } = await getUser();

    if (!user) {
        redirect('/sign-in');
    }

    // Fetch initial data server-side to avoid client-side waterfalls.
    // Wrapped in try/catch: if these fail during the RSC re-render triggered
    // by a Server Action POST, the page must not crash with a 500.
    let initialChats: any[] = [];
    let initialCredits = 0;
    try {
        [initialChats, initialCredits] = await Promise.all([
            getChats(),
            getUserCredits(),
        ]);
    } catch {
        // Non-fatal — client will see empty state and can still chat
    }

    return (
        <GymnaClientWrapper
            user={user}
            initialChats={initialChats}
            initialCredits={initialCredits}
        />
    );
}
