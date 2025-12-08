import { createClient } from '@/utils/supabase/server';
import { getProfile } from '@/lib/database/profiles';
import TopNavClient from './TopNavClient';

export default async function TopNavWrapper() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let profile = null;
    if (user) {
        profile = await getProfile(user.id);
    }

    return <TopNavClient user={user} profile={profile} />;
}
