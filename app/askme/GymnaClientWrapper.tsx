'use client';

import dynamic from 'next/dynamic';
import { User } from '@supabase/supabase-js';

// Dynamic import to reduce initial bundle size (Google AI SDK is heavy)
const GymnaClient = dynamic(() => import('./GymnaClient'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="max-w-md mx-auto px-4 py-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 space-y-4 min-h-[400px]">
                        <div className="flex gap-3">
                            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 p-4">
                        <div className="flex gap-2">
                            <div className="flex-1 h-12 bg-gray-200 rounded-xl animate-pulse" />
                            <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ),
});

interface GymnaClientWrapperProps {
    user: User;
}

export default function GymnaClientWrapper({ user }: GymnaClientWrapperProps) {
    return <GymnaClient user={user} />;
}
