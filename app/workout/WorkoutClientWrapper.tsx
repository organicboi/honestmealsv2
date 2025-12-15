'use client';

import dynamic from 'next/dynamic';
import { User } from '@supabase/supabase-js';

// Dynamic import to reduce initial bundle size (WorkoutClient is 800+ lines with animations)
const WorkoutClient = dynamic(() => import('./WorkoutClient'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="max-w-md mx-auto px-4 py-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
                        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={`day-${i}`} className="h-4 bg-gray-200 rounded animate-pulse" />
                        ))}
                        {Array.from({ length: 35 }).map((_, i) => (
                            <div key={`date-${i}`} className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                            <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-1 animate-pulse" />
                            <div className="h-3 w-16 bg-gray-200 rounded mx-auto animate-pulse" />
                        </div>
                    ))}
                </div>
                <div className="h-14 w-full bg-gray-200 rounded-2xl animate-pulse" />
            </div>
        </div>
    ),
});

interface WorkoutClientWrapperProps {
    user: User;
}

export default function WorkoutClientWrapper({ user }: WorkoutClientWrapperProps) {
    return <WorkoutClient user={user} />;
}
