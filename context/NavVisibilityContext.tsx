'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface NavVisibilityContextType {
    hideBottomNav: boolean;
    setHideBottomNav: (hide: boolean) => void;
    /** Auto-hide state driven by scroll / keyboard focus in BottomNav */
    navVisible: boolean;
    setNavVisible: (v: boolean) => void;
}

const NavVisibilityContext = createContext<NavVisibilityContextType>({
    hideBottomNav: false,
    setHideBottomNav: () => {},
    navVisible: true,
    setNavVisible: () => {},
});

export function NavVisibilityProvider({ children }: { children: ReactNode }) {
    const [hideBottomNav, setHideBottomNav] = useState(false);
    const [navVisible, setNavVisible] = useState(true);

    return (
        <NavVisibilityContext.Provider value={{ hideBottomNav, setHideBottomNav, navVisible, setNavVisible }}>
            {children}
        </NavVisibilityContext.Provider>
    );
}

export function useNavVisibility() {
    return useContext(NavVisibilityContext);
}
