'use client';

import { Utensils, Activity, Dumbbell, TrendingUp, Users, Settings, LayoutDashboard, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/database.types';
import { motion } from 'framer-motion';
import { useNavVisibility } from '@/context/NavVisibilityContext';

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

// Base navigation items available to ALL users
const baseNavItems: NavItem[] = [
    { label: 'Home',    href: '/dashboard', icon: LayoutDashboard },
    { label: 'Meals',   href: '/meals',     icon: Utensils },
    { label: 'Workout', href: '/workout',   icon: Dumbbell },
    { label: 'Ask AI',  href: '/honestask', icon: MessageSquare },
];

// Role-specific navigation items (shown in addition to base items)
const roleSpecificNavItems: Partial<Record<UserRole, NavItem[]>> = {
    admin: [
        // { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        // { label: 'Users', href: '/admin/users', icon: Users },
        // { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
        // { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
    
    trainer: [
        { label: 'My Clients', href: '/trainer/clients', icon: Users },
        { label: 'Earnings',   href: '/trainer/commissions', icon: TrendingUp },
    ],
    
    gym_franchise: [
        // { label: 'Dashboard', href: '/gym', icon: LayoutDashboard },
        // { label: 'Members', href: '/gym/members', icon: Users },
        // { label: 'Analytics', href: '/gym/analytics', icon: TrendingUp },
    ],
    
    influencer: [
        // { label: 'Dashboard', href: '/influencer', icon: LayoutDashboard },
        // { label: 'Referrals', href: '/influencer/referrals', icon: Users },
        // { label: 'Earnings', href: '/influencer/earnings', icon: TrendingUp },
    ],
};

interface BottomNavProps {
    userRole?: UserRole;
}

export default function BottomNav({ userRole = 'standard_user' }: BottomNavProps) {
    const pathname = usePathname();
    const { setNavVisible } = useNavVisibility();
    const [visible, setVisibleLocal] = useState(true);
    const lastScrollTop = useRef(0);
    const scrollAccum = useRef(0);
    const lastDir = useRef<'up' | 'down' | null>(null);
    const isLocked = useRef(false);
    const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTyping = useRef(false);

    const SCROLL_THRESHOLD = 30; // px of sustained scroll before toggling
    const LOCK_MS = 350;         // ms to ignore scroll after a toggle

    // Keep context in sync whenever local visible changes
    const setVisible = (v: boolean) => {
        setVisibleLocal(v);
        setNavVisible(v);
    };

    useEffect(() => {
        const handleScroll = (e: Event) => {
            if (isTyping.current || isLocked.current) return;
            const target = e.target as HTMLElement;
            const scrollTop =
                target === document.documentElement || target === document.body
                    ? window.scrollY
                    : target.scrollTop ?? 0;
            const delta = scrollTop - lastScrollTop.current;
            if (Math.abs(delta) < 1) return;
            lastScrollTop.current = scrollTop;

            const dir = delta > 0 ? 'down' : 'up';
            if (dir !== lastDir.current) {
                scrollAccum.current = 0;
                lastDir.current = dir;
            }
            scrollAccum.current += Math.abs(delta);

            if (scrollAccum.current >= SCROLL_THRESHOLD) {
                scrollAccum.current = 0;
                const next = dir === 'up';
                setVisible(next);
                // Lock briefly so layout-reflow scroll events don't flip us back
                isLocked.current = true;
                if (lockTimer.current) clearTimeout(lockTimer.current);
                lockTimer.current = setTimeout(() => { isLocked.current = false; }, LOCK_MS);
            }
        };

        const handleFocusIn = (e: FocusEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') {
                isTyping.current = true;
                setVisible(false);
            }
        };

        const handleFocusOut = (e: FocusEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') {
                isTyping.current = false;
                setVisible(true);
            }
        };

        document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
        document.addEventListener('focusin', handleFocusIn, true);
        document.addEventListener('focusout', handleFocusOut, true);
        return () => {
            document.removeEventListener('scroll', handleScroll, { capture: true });
            document.removeEventListener('focusin', handleFocusIn, true);
            document.removeEventListener('focusout', handleFocusOut, true);
            if (lockTimer.current) clearTimeout(lockTimer.current);
        };
    }, []);

    // Combine base items with role-specific items
    const roleItems = userRole !== 'standard_user' ? (roleSpecificNavItems[userRole] || []) : [];
    const navItems = [...baseNavItems, ...roleItems];

    return (
        <nav className={cn(
            "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 md:hidden pb-safe transition-transform duration-300 ease-in-out",
            visible ? "translate-y-0" : "translate-y-full"
        )}>
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || 
                                   (item.href !== '/' && pathname.startsWith(item.href));
                    
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 relative group",
                                "active:scale-95"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute -top-px w-12 h-1 bg-green-600 rounded-b-full"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            
                            <div className={cn(
                                "flex items-center justify-center transition-all duration-200",
                                isActive 
                                    ? "text-green-600 transform -translate-y-1" 
                                    : "text-gray-400 group-hover:text-gray-600"
                            )}>
                                <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium transition-colors duration-200",
                                isActive ? "text-green-600" : "text-gray-400"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
