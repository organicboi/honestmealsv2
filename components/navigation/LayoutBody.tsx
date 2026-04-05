'use client';

import { usePathname } from 'next/navigation';
import { useNavVisibility } from '@/context/NavVisibilityContext';

// Routes that should take full-screen height with no nav padding
const FULLSCREEN_ROUTES = ['/honestask'];

export default function LayoutBody({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { navVisible } = useNavVisibility();
    const isFullscreen = FULLSCREEN_ROUTES.some(r => pathname?.startsWith(r));

    // On fullscreen routes (like /honestask) the page manages its own layout.
    // On other routes, add bottom padding equal to the nav height when the nav
    // is visible, and remove it when the nav is hidden — with a smooth transition.
    return (
        <div
            className="transition-[padding] duration-300 ease-in-out md:pb-0"
            style={isFullscreen ? undefined : { paddingBottom: navVisible ? '4rem' : '0' }}
        >
            {children}
        </div>
    );
}
