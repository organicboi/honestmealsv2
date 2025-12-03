import { createClient } from '@/utils/supabase/server';
import { getUserRole } from '@/lib/database/profiles';
import BottomNav from './BottomNav';

export default async function BottomNavWrapper() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Don't show bottom nav if user is not logged in
    if (!user) {
        return null;
    }

    // Get user role from database
    const userRole = await getUserRole(user.id);

    return <BottomNav userRole={userRole} />;
}
