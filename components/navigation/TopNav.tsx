'use client';

import React, { useState } from 'react';
import { 
    Search, 
    ShoppingCart, 
    MapPin, 
    ChevronDown,
    UtensilsCrossed,
    Menu,
    X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Profile } from '@/types/database.types';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';

interface TopNavProps {
    user: any;
    profile: Profile | null;
}

export default function TopNav({ user, profile }: TopNavProps) {
    const router = useRouter();
    const { cartTotalItems } = useCart();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/ordermeals?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo & Location */}
                        <div className="flex items-center gap-4 md:gap-8">
                            <Link href="/" className="flex items-center gap-2 cursor-pointer">
                                <div className="bg-green-600 p-1.5 rounded-lg">
                                    <UtensilsCrossed className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-bold text-xl hidden sm:block text-gray-800">
                                    Honest<span className="text-green-600">Meals</span>
                                </span>
                            </Link>
                            
                            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 cursor-pointer transition-colors max-w-[200px]">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate underline decoration-dotted underline-offset-4">
                                    {profile?.location || "Setup Location"}
                                </span>
                                <ChevronDown className="h-3 w-3 shrink-0" />
                            </div>
                        </div>

                        {/* Search Bar (Desktop) */}
                        <div className="flex-1 max-w-xl relative hidden md:block">
                            <form onSubmit={handleSearch}>
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input 
                                    placeholder="Search for meals..." 
                                    className="pl-10 bg-gray-100 border-none focus-visible:ring-green-500 rounded-xl h-11 w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </form>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="hidden md:flex items-center gap-6 text-gray-600 font-medium text-sm">
                                <Link href="/ordermeals" className="hover:text-green-600 flex items-center gap-2">
                                    <Search className="h-5 w-5 md:hidden" />
                                    <span className="hidden md:inline">Search</span>
                                </Link>
                                <Link href="/offers" className="hover:text-green-600 flex items-center gap-2">
                                    <span className="hidden md:inline">Offers</span>
                                </Link>
                            </div>

                            <Link href="/cart">
                                <Button 
                                    variant="ghost" 
                                    className="relative hover:bg-transparent hover:text-green-600 font-medium flex items-center gap-2 px-2"
                                >
                                    <ShoppingCart className="h-6 w-6 md:h-5 md:w-5" />
                                    <span className="hidden md:inline">Cart</span>
                                    {cartTotalItems > 0 && (
                                        <span className="absolute top-0 right-0 md:-top-1 md:-right-2 bg-green-600 text-white text-[10px] font-bold h-4 w-4 md:h-5 md:w-5 flex items-center justify-center rounded-full border-2 border-white">
                                            {cartTotalItems}
                                        </span>
                                    )}
                                </Button>
                            </Link>
                            
                            {user ? (
                                <Link href="/profile">
                                    <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold border border-green-200 cursor-pointer hover:bg-green-200 transition-colors">
                                        {profile?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                </Link>
                            ) : (
                                <Link href="/sign-in">
                                    <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6">
                                        Sign In
                                    </Button>
                                </Link>
                            )}

                            {/* Mobile Menu Toggle */}
                            <button 
                                className="md:hidden p-2 text-gray-600"
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black z-50 md:hidden"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-[80%] max-w-sm bg-white z-50 shadow-2xl flex flex-col md:hidden"
                        >
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                <span className="font-bold text-xl text-gray-800">Menu</span>
                                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>
                            
                            <div className="flex-1 p-5 overflow-y-auto space-y-6">
                                <div className="space-y-4">
                                    <Link href="/ordermeals" onClick={() => setIsMobileMenuOpen(false)} className="block text-lg font-medium text-gray-800">Order Meals</Link>
                                    <Link href="/offers" onClick={() => setIsMobileMenuOpen(false)} className="block text-lg font-medium text-gray-800">Offers</Link>
                                    <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)} className="block text-lg font-medium text-gray-800">Cart</Link>
                                    <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block text-lg font-medium text-gray-800">Profile</Link>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    {!user && (
                                        <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-6">
                                                Log In / Sign Up
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
