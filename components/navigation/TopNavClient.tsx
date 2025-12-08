'use client';

import dynamic from 'next/dynamic';
import { Profile } from '@/types/database.types';

const TopNav = dynamic(() => import('./TopNav'), { ssr: false });

interface TopNavClientProps {
    user: any;
    profile: Profile | null;
}

export default function TopNavClient({ user, profile }: TopNavClientProps) {
    return <TopNav user={user} profile={profile} />;
}
