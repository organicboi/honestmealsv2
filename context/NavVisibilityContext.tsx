'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface NavVisibilityContextType {
    hideBottomNav: boolean;
    setHideBottomNav: (hide: boolean) => void;
}

const NavVisibilityContext = createContext<NavVisibilityContextType>({
    hideBottomNav: false,
    setHideBottomNav: () => {},
});

export function NavVisibilityProvider({ children }: { children: ReactNode }) {
    const [hideBottomNav, setHideBottomNav] = useState(false);

    return (
        <NavVisibilityContext.Provider value={{ hideBottomNav, setHideBottomNav }}>
            {children}
        </NavVisibilityContext.Provider>
    );
}

export function useNavVisibility() {
    return useContext(NavVisibilityContext);
}
