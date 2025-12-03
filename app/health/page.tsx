import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import HealthClient from './HealthClient';

export default async function HealthPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/sign-in');
    }

    return <HealthClient user={user} />;
}
