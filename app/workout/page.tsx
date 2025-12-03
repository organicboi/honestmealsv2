import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import WorkoutClient from './WorkoutClient';

export default async function WorkoutPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/sign-in');
    }

    return <WorkoutClient user={user} />;
}
