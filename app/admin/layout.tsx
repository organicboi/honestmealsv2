import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, UtensilsCrossed, PlusCircle, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Double check role here just in case middleware missed it or for better UX
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
          <p className="text-sm text-gray-500">Honest Meals</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LayoutDashboard size={20} />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/meals">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <UtensilsCrossed size={20} />
              All Meals
            </Button>
          </Link>
          <Link href="/admin/addmeal">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <PlusCircle size={20} />
              Add Meal
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings size={20} />
              Settings
            </Button>
          </Link>
        </nav>
        <div className="p-4 border-t">
          <form action="/auth/signout" method="post">
             <Button variant="outline" className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50">
              <LogOut size={20} />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile Header (visible only on small screens) */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white z-50 border-b p-4 flex justify-between items-center">
         <span className="font-bold">Admin Panel</span>
         {/* Mobile menu toggle could go here */}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto mt-14 md:mt-0">
        {children}
      </main>
    </div>
  );
}
