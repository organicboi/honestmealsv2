import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import GymnaClientWrapper from './GymnaClientWrapper';

export default async function AskMePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/sign-in');
    }

    return <GymnaClientWrapper user={user} />;
}
