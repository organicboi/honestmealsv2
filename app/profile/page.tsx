import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getProfileWithStats } from '@/lib/database/profiles';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/sign-in');
    }

    const profile = await getProfileWithStats(user.id);

    return <ProfileClient user={user} profile={profile} />;
}
