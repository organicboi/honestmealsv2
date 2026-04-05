'use client';

import { usePathname } from 'next/navigation';

// Routes that should take full-screen height with no nav padding
const FULLSCREEN_ROUTES = ['/askme'];

export default function LayoutBody({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFullscreen = FULLSCREEN_ROUTES.some(r => pathname?.startsWith(r));

    return (
        <div className={isFullscreen ? undefined : 'pb-16 md:pb-0'}>
            {children}
        </div>
    );
}
