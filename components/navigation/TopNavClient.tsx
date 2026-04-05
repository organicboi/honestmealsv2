'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Profile } from '@/types/database.types';
import { PincodeProvider } from '@/context/PincodeContext';

const TopNav = dynamic(() => import('./TopNav'), { ssr: false });

interface TopNavClientProps {
    user: any;
    profile: Profile | null;
}

export default function TopNavClient({ user, profile }: TopNavClientProps) {
    const pathname = usePathname();

    // Hide TopNav on /askme route to provide a full-screen Chat UI
    if (pathname?.startsWith('/askme')) {
        return null;
    }

    return (
        <PincodeProvider user={user}>
            <TopNav user={user} profile={profile} />
        </PincodeProvider>
    );
}
