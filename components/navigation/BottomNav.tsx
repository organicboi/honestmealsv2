'use client';

import { Utensils, Activity, Dumbbell, TrendingUp, Users, Settings, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/database.types';
import { motion } from 'framer-motion';

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

// Base navigation items available to ALL users
const baseNavItems: NavItem[] = [
    { label: 'Meals', href: '/meals', icon: Utensils },
    { label: 'Health', href: '/health', icon: Activity },
    { label: 'Workout', href: '/workout', icon: Dumbbell },
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
        // { label: 'Dashboard', href: '/trainer', icon: LayoutDashboard },
        // { label: 'Clients', href: '/trainer/clients', icon: Users },
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
    
    // Combine base items with role-specific items
    const roleItems = userRole !== 'standard_user' ? (roleSpecificNavItems[userRole] || []) : [];
    const navItems = [...baseNavItems, ...roleItems];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 md:hidden pb-safe">
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
                                    className="absolute -top-[1px] w-12 h-1 bg-green-600 rounded-b-full"
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
