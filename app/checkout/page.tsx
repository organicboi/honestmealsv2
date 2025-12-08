import { createClient } from '@/utils/supabase/server';
import { getProfile } from '@/lib/database/profiles';
import CheckoutClient from './CheckoutClient';

export default async function CheckoutPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let profile = null;
    if (user) {
        profile = await getProfile(user.id);
    }

    return (
        <CheckoutClient 
            user={user} 
            profile={profile} 
        />
    );
}
