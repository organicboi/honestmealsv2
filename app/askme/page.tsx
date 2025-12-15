import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import GymnaClient from './GymnaClient';

export default async function AskMePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/sign-in');
    }

    return <GymnaClient user={user} />;
}
