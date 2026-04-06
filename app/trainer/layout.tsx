import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, DollarSign, ClipboardList, Settings, LogOut, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/sign-in');

    const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, name, trainer_invite_code')
        .eq('id', user.id)
        .single();

    if (profile?.user_type !== 'trainer') redirect('/unauthorized');

    const navItems = [
        { href: '/trainer',             icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { href: '/trainer/clients',     icon: <Users size={20} />,           label: 'Clients' },
        { href: '/trainer/commissions', icon: <DollarSign size={20} />,      label: 'Commissions' },
        { href: '/trainer/plans',       icon: <ClipboardList size={20} />,   label: 'Plans' },
    ];

    return (
        <div className="min-h-screen flex bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
                <div className="p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                            <Dumbbell size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Trainer Portal</h1>
                            <p className="text-xs text-gray-400 truncate max-w-[140px]">{profile?.name ?? user.email}</p>
                        </div>
                    </div>
                    {profile?.trainer_invite_code && (
                        <div className="mt-3 px-3 py-2 bg-orange-50 rounded-lg">
                            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Invite Code</p>
                            <p className="text-sm font-black text-orange-700 tracking-widest">{profile.trainer_invite_code}</p>
                        </div>
                    )}
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map(item => (
                        <Link key={item.href} href={item.href}>
                            <Button variant="ghost" className="w-full justify-start gap-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50">
                                {item.icon}
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t space-y-1">
                    <Link href="/trainer/settings">
                        <Button variant="ghost" className="w-full justify-start gap-2 text-gray-500 hover:text-gray-700">
                            <Settings size={20} /> Settings
                        </Button>
                    </Link>
                    <form action="/api/auth/signout" method="post">
                        <Button variant="ghost" type="submit" className="w-full justify-start gap-2 text-gray-500 hover:text-red-600">
                            <LogOut size={20} /> Sign out
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Mobile top bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                        <Dumbbell size={16} className="text-white" />
                    </div>
                    <span className="font-bold text-gray-900">Trainer Portal</span>
                </div>
            </div>

            {/* Mobile bottom nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t flex">
                {navItems.map(item => (
                    <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center py-2 text-gray-500 hover:text-orange-500 text-xs gap-1">
                        {item.icon}
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Main content */}
            <main className="flex-1 overflow-auto md:p-8 p-4 mt-14 md:mt-0 mb-16 md:mb-0">
                {children}
            </main>
        </div>
    );
}
