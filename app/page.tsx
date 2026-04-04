import React from 'react';
import { createClient } from "@/utils/supabase/server";
import HomePageClient from './HomePageClient';
import { redirect } from 'next/navigation';
import { updateUserStreak } from '@/lib/utils/streak';

export default async function HomePage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
    const supabase = await createClient();
    
    // Process search params for auth fallbacks (Magic Link or OAuth)
    const searchParams = await props.searchParams;
    const code = searchParams?.code;
    const errorParam = searchParams?.error;
    const errorDesc = searchParams?.error_description;

    // Capture error in URL from auth flows (e.g. expired magic link)
    if (errorParam) {
        redirect(`/sign-in?error=${encodeURIComponent(errorDesc || 'Authentication failed. Please try again.')}`);
    }

    // Handle Auth Code Exchange on Root Callback
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await updateUserStreak(supabase, user.id);
            }
        }
        // Force redirect to clean URL without bleeding auth codes
        redirect('/');
    }

    // Fetch user data on the server using SSR
    const { data: { user } } = await supabase.auth.getUser();

    return <HomePageClient user={user} />;
}
