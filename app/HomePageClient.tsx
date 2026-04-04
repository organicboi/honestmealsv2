'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
    Activity,
    ArrowRight,
    ChefHat,
    Utensils,
    Droplets,
    Dumbbell,
    Flame,
    Coffee
} from 'lucide-react';

// Assets
import bgVeg from '@/assets/images/homepage/bg-veg.jpg';
import bgNonVeg from '@/assets/images/homepage/bg-non-veg.jpg';
import bgDrinks from '@/app/bg-healthyDrinks.avif';
import bgCustom from '@/app/bg-customizeMeals.jpg';

export default function HomePageClient({ user }: { user: any }) {
    const router = useRouter();

    const FEATURES = [
        {
            title: 'Food & Macros',
            desc: 'High-protein, air-fried meals with exact macros.',
            icon: Utensils,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
            path: '/meals'
        },
        {
            title: 'Health Tracking',
            desc: 'Log every calorie, macro, and water intake.',
            icon: Activity,
            color: 'text-lime-600',
            bg: 'bg-lime-50',
            path: '/health'
        },
        {
            title: 'Workout Log',
            desc: 'Log your sets, reps, and weights like an athlete.',
            icon: Dumbbell,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            path: '/workout'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900 selection:bg-lime-200">
            
            {/* 1. HERO SECTION (App-like Gradient Hero) */}
            <section className="bg-[#F5F4EF] px-5 pt-12 pb-[5rem] rounded-b-[2.5rem] relative overflow-hidden border-b border-stone-200/50">
                {/* Decorative background shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-stone-300/30 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
                
                <div className="relative z-10 max-w-md mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap items-center gap-2 mb-6"
                    >
                        <div className="inline-flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1.5 rounded-full text-stone-900 text-xs font-bold uppercase tracking-wider shadow-sm">
                            <Flame className="w-3.5 h-3.5 fill-lime-500 text-lime-500" />
                            <span>Honest Meals · Pune</span>
                        </div>
                        <div className="inline-flex items-center gap-1 bg-lime-100/50 border border-lime-200/50 px-3 py-1.5 rounded-full text-lime-700 text-[11px] font-bold uppercase tracking-wider">
                            <span>100% Real Macros</span>
                        </div>
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-[2.75rem] md:text-6xl font-black text-stone-900 leading-[1] mb-5 tracking-tight"
                    >
                        Food that works <br/>
                        <span className="text-lime-500">as hard as you.</span>
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-stone-600 text-base md:text-lg mb-8 max-w-sm font-medium leading-relaxed"
                    >
                        High-protein. Air fried. Macro-counted. Order your food and track your progress in one place.
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-3 shadow-xl shadow-stone-200/50 rounded-2xl bg-white p-1.5 border border-stone-100 mb-8"
                    >
                        <button 
                            onClick={() => router.push('/meals')}
                            className="bg-lime-400 text-lime-950 px-6 py-4 rounded-xl font-bold flex items-center justify-between active:scale-[0.98] transition-all hover:bg-lime-500 w-full sm:w-auto flex-1 cursor-pointer"
                        >
                            <span className="text-[15px]">Browse Menu</span>
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                        <button 
                            onClick={() => router.push('/health')}
                            className="bg-stone-50 text-stone-900 px-6 py-4 rounded-xl font-bold flex items-center justify-between active:scale-[0.98] transition-all hover:bg-stone-100 border border-stone-200 w-full sm:w-auto flex-1 cursor-pointer"
                        >
                            <span className="text-[15px]">Track Progress</span>
                            <Activity className="w-5 h-5 ml-2 text-stone-500" />
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-3 text-xs font-semibold text-stone-500"
                    >
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className={`w-7 h-7 rounded-full border-2 border-[#F5F4EF] bg-stone-200 z-${4-i} flex items-center justify-center overflow-hidden`}>
                                    <div className="w-full h-full bg-stone-300" />
                                </div>
                            ))}
                        </div>
                        <p>Trusted by <span className="text-stone-900">5,000+</span> athletes</p>
                    </motion.div>
                </div>
            </section>

            <main className="max-w-md mx-auto px-4 -mt-10 space-y-5 relative z-20">
                
                {/* 2. MAIN CATEGORIES (App-like split cards) */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/meals?diet=veg')}
                        className="bg-white rounded-3xl p-1.5 shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="relative h-36 rounded-[1.25rem] overflow-hidden mb-3 bg-gray-100">
                            <Image src={bgVeg} alt="Vegetarian" fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
                            <div className="absolute inset-0 bg-linear-to-t from-gray-900/70 to-transparent" />
                            <div className="absolute bottom-2 left-2">
                                <span className="bg-lime-400 text-lime-950 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Most Ordered</span>
                            </div>
                        </div>
                        <div className="px-3 pb-3">
                            <h3 className="font-bold text-gray-900 text-base">Vegetarian</h3>
                            <p className="text-xs text-gray-400 mt-0.5 font-medium">Protein+ Air fried</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/meals?diet=non-veg')}
                        className="bg-white rounded-3xl p-1.5 shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="relative h-36 rounded-[1.25rem] overflow-hidden mb-3 bg-gray-100">
                            <Image src={bgNonVeg} alt="Non-Veg" fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
                            <div className="absolute inset-0 bg-linear-to-t from-gray-900/70 to-transparent" />
                        </div>
                        <div className="px-3 pb-3">
                            <h3 className="font-bold text-gray-900 text-base">Non-Veg</h3>
                            <p className="text-xs text-gray-400 mt-0.5 font-medium">Premium chicken/egg</p>
                        </div>
                    </motion.div>
                </div>
                
                {/* 2.1 SUPPLEMENTARY CATEGORIES */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/meals?diet=healthy-drinks')}
                        className="bg-white border border-gray-100 rounded-3xl p-4 flex items-center gap-3 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                    >
                         <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                             <Coffee className="w-5 h-5 text-orange-500" />
                         </div>
                         <div>
                             <h4 className="font-bold text-gray-900 text-sm">Elixirs</h4>
                             <p className="text-[10px] text-gray-500 font-medium">Zero sugar</p>
                         </div>
                    </motion.div>

                    <motion.div 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/customize-meal')}
                        className="bg-white border border-gray-100 rounded-3xl p-4 flex items-center gap-3 cursor-pointer shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                         <div className="absolute -right-3 -top-3 w-12 h-12 bg-lime-50 rounded-full mix-blend-multiply" />
                         <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 relative z-10 border border-gray-100">
                             <ChefHat className="w-5 h-5 text-gray-600" />
                         </div>
                         <div className="relative z-10">
                             <h4 className="font-bold text-gray-900 text-sm">Custom</h4>
                             <p className="text-[10px] text-gray-500 font-medium">Build a plate</p>
                         </div>
                    </motion.div>
                </div>

                {/* 3. PLATFORM FEATURES (List View) */}
                <div className="pt-2">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-lg font-bold text-gray-900">Your Health Stack</h2>
                        <span className="text-[10px] font-bold text-lime-600 bg-lime-100 px-2 py-0.5 rounded-full uppercase tracking-wider">All in one</span>
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-3">
                        {FEATURES.map((feature, idx) => (
                            <motion.div 
                                key={idx}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push(feature.path)}
                                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group border border-transparent hover:border-gray-100"
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${feature.bg} shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]`}>
                                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 text-[15px]">{feature.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1 leading-snug">{feature.desc}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm">
                                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
                
                {/* 4. CALL TO ACTION - Bottom Card */}
                {!user ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-gray-950 rounded-3xl p-7 text-white text-center shadow-xl mt-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="w-14 h-14 bg-gray-800 rounded-[1.25rem] mx-auto flex items-center justify-center mb-5 relative z-10 border border-gray-700">
                            <Activity className="w-7 h-7 text-lime-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 relative z-10 text-white">Start eating right.</h2>
                        <p className="text-gray-400 text-sm mb-6 max-w-[250px] mx-auto relative z-10">
                            Meal ordering + full health tracking, in one single platform.
                        </p>
                        <button 
                            onClick={() => router.push('/sign-up')}
                            className="bg-lime-400 text-lime-950 w-full py-4 rounded-xl font-bold active:scale-[0.98] transition-all hover:bg-lime-500 shadow-lg shadow-lime-400/20 relative z-10 text-[15px]"
                        >
                            Create Free Account
                        </button>
                    </motion.div>
                ) : (
                    <div className="pb-8" />
                )}

            </main>
        </div>
    );
}
