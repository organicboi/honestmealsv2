import React from 'react';
import { createClient } from "@/utils/supabase/server";
import HomePageClient from './HomePageClient';

export default async function HomePage() {
    // Fetch user data on the server using SSR
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return <HomePageClient user={user} />;
}
