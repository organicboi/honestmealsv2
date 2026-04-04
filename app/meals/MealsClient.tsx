'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Star, X, Plus, Minus,
    ArrowRight, Wind,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import type { MealWithDetails, Profile, MealCategory, DietaryType } from '@/types/database.types';
import { useCart } from '@/context/CartContext';
import CartSheet from '@/components/cart/CartSheet';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface MealsClientProps {
    user: any;
    profile: Profile | null;
    initialMeals: MealWithDetails[];
    categories: MealCategory[];
    dietaryTypes: DietaryType[];
    selectedDiet?: string;
}

// ─── Smart Hero Metric ─────────────────────────────────────────────────────────
type HeroMetric = {
    label: string;
    value: string;
    unit: string;
    type: 'protein-high' | 'protein-mid' | 'light' | 'fiber' | 'air-fried' | 'balanced';
};

function getHeroMetric(meal: MealWithDetails): HeroMetric {
    const protein = meal.protein ?? 0;
    const calories = meal.calories ?? 0;
    const fiber = (meal as any).fiber ?? 0;
    const isAirFried = (meal as any).is_air_fried ?? false;

    if (protein >= 25)
        return { label: 'Protein', value: String(protein), unit: 'g', type: 'protein-high' };
    if (protein >= 15)
        return { label: 'Protein', value: String(protein), unit: 'g', type: 'protein-mid' };
    if (calories > 0 && calories <= 250)
        return { label: 'Only', value: String(calories), unit: 'kcal', type: 'light' };
    if (fiber >= 7)
        return { label: 'Fiber', value: String(fiber), unit: 'g', type: 'fiber' };
    if (isAirFried)
        return { label: 'Air Fried', value: String(calories), unit: 'kcal', type: 'air-fried' };
    return { label: 'Energy', value: String(calories), unit: 'kcal', type: 'balanced' };
}

const HERO_STYLES: Record<HeroMetric['type'], {
    overlay: string; numberColor: string; unitColor: string; labelColor: string;
}> = {
    'protein-high': {
        overlay: 'bg-gradient-to-t from-gray-950/90 via-gray-900/50 to-transparent',
        numberColor: 'text-green-400', unitColor: 'text-green-400/75', labelColor: 'text-green-400/80',
    },
    'protein-mid': {
        overlay: 'bg-gradient-to-t from-gray-900/80 via-gray-800/30 to-transparent',
        numberColor: 'text-emerald-300', unitColor: 'text-emerald-300/75', labelColor: 'text-emerald-300/80',
    },
    'light': {
        overlay: 'bg-gradient-to-t from-sky-950/70 via-sky-900/20 to-transparent',
        numberColor: 'text-sky-300', unitColor: 'text-sky-300/75', labelColor: 'text-sky-300/80',
    },
    'fiber': {
        overlay: 'bg-gradient-to-t from-violet-950/70 via-violet-900/20 to-transparent',
        numberColor: 'text-violet-300', unitColor: 'text-violet-300/75', labelColor: 'text-violet-300/80',
    },
    'air-fried': {
        overlay: 'bg-gradient-to-t from-amber-950/70 via-amber-900/20 to-transparent',
        numberColor: 'text-amber-300', unitColor: 'text-amber-300/75', labelColor: 'text-amber-300/80',
    },
    'balanced': {
        overlay: 'bg-gradient-to-t from-gray-900/75 via-gray-700/20 to-transparent',
        numberColor: 'text-white', unitColor: 'text-white/60', labelColor: 'text-white/60',
    },
};

// ─── Macro Bar ─────────────────────────────────────────────────────────────────
function MacroBar({ protein, carbs, fat }: { protein: number; carbs?: number | null; fat?: number | null }) {
    const p = protein ?? 0;
    const c = carbs ?? 0;
    const f = fat ?? 0;
    const total = p + c + f;
    if (total === 0) return null;
    const pPct = (p / total) * 100;
    const cPct = (c / total) * 100;
    const fPct = (f / total) * 100;

    return (
        <div className="space-y-1.5">
            <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5 bg-gray-100">
                {pPct > 0 && <div className="bg-emerald-400 rounded-l-full" style={{ width: `${pPct}%` }} />}
                {cPct > 0 && <div className="bg-amber-400" style={{ width: `${cPct}%` }} />}
                {fPct > 0 && <div className="bg-rose-400 rounded-r-full" style={{ width: `${fPct}%` }} />}
            </div>
            <div className="flex gap-2.5 text-[9px] font-bold uppercase tracking-widest">
                <span className="text-emerald-600">{p}g P</span>
                {c > 0 && <span className="text-amber-500">{c}g C</span>}
                {f > 0 && <span className="text-rose-400">{f}g F</span>}
            </div>
        </div>
    );
}

// ─── Meal Card ─────────────────────────────────────────────────────────────────
function MealCard({
    meal, cartQty, onAdd, onRemove,
}: {
    meal: MealWithDetails; cartQty: number; onAdd: () => void; onRemove: () => void;
}) {
    const hero = getHeroMetric(meal);
    const hs = HERO_STYLES[hero.type];
    const isAirFried = (meal as any).is_air_fried ?? false;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group"
        >
            {/* Image + Overlay */}
            <div className="relative h-48 shrink-0 overflow-hidden bg-gray-100">
                {meal.image_url ? (
                    <Image
                        src={meal.image_url}
                        alt={meal.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 300px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-6xl select-none">
                            {meal.food_type === 'vegetarian' ? '🥗' : '🍗'}
                        </span>
                    </div>
                )}

                {/* Gradient overlay */}
                <div className={`absolute inset-0 ${hs.overlay}`} />

                {/* Veg / Non-Veg dot — top left */}
                <div className="absolute top-3 left-3 z-10">
                    <div className={`w-6 h-6 rounded border-2 bg-white/95 flex items-center justify-center shadow-sm ${
                        meal.food_type === 'vegetarian' ? 'border-green-600' : 'border-red-500'
                    }`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${
                            meal.food_type === 'vegetarian' ? 'bg-green-600' : 'bg-red-500'
                        }`} />
                    </div>
                </div>

                {/* Air Fried badge — top right */}
                {isAirFried ? (
                    <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm text-amber-700 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Wind className="w-2.5 h-2.5" /> Air Fried
                    </div>
                ) : meal.average_rating > 0 ? (
                    <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-[11px] font-black text-gray-800">{meal.average_rating?.toFixed(1)}</span>
                    </div>
                ) : null}

                {/* Hero Metric — bottom left */}
                <div className="absolute bottom-3 left-4 z-10">
                    <span className={`text-[10px] font-black uppercase tracking-widest block leading-none mb-0.5 ${hs.labelColor}`}>
                        {hero.label}
                    </span>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-black leading-none tracking-tighter ${hs.numberColor}`}>
                            {hero.value}
                        </span>
                        <span className={`text-sm font-bold ${hs.unitColor}`}>{hero.unit}</span>
                    </div>
                </div>

                {/* Rating alongside air-fried badge */}
                {isAirFried && meal.average_rating > 0 && (
                    <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-black text-white/90">{meal.average_rating?.toFixed(1)}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col grow gap-3">
                <div>
                    <h3 className="font-black text-gray-900 text-sm leading-snug line-clamp-1">{meal.name}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1 leading-relaxed">{meal.description}</p>
                </div>

                {/* Macro Bar */}
                <MacroBar protein={meal.protein} carbs={meal.carbs} fat={meal.fat} />

                {/* Price + Action */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
                    <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block leading-none mb-0.5">Price</span>
                        <span className="text-xl font-black text-gray-900">₹{meal.price}</span>
                    </div>

                    {cartQty > 0 ? (
                        <div className="flex items-center gap-2 bg-green-50 rounded-2xl px-2.5 py-1.5 border border-green-100">
                            <button
                                onClick={onRemove}
                                className="p-1 rounded-xl hover:bg-green-100 text-green-700 transition-colors active:scale-90"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-black text-green-700 text-sm min-w-5 text-center">{cartQty}</span>
                            <button
                                onClick={onAdd}
                                className="p-1 rounded-xl hover:bg-green-100 text-green-700 transition-colors active:scale-90"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onAdd}
                            disabled={!meal.is_available}
                            className="bg-gray-900 hover:bg-green-700 text-white text-[11px] font-black px-5 py-2.5 rounded-2xl active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed tracking-wide uppercase"
                        >
                            Add
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function MealsClient({
    user,
    profile,
    initialMeals,
    categories,
    dietaryTypes,
    selectedDiet,
}: MealsClientProps) {
    const { items: cartItems, addToCart: ctxAdd, removeFromCart: ctxRemove, cartTotalItems, cartTotalPrice } = useCart();

    const [activeFilter, setActiveFilter] = useState<'all' | 'vegetarian' | 'non-vegetarian'>(
        selectedDiet === 'veg' ? 'vegetarian' : selectedDiet === 'non-veg' ? 'non-vegetarian' : 'all'
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showFloating, setShowFloating] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            setIsScrolled(y > 10);
            if (y < 10) { setShowFloating(true); return; }
            setShowFloating(y < lastScrollY);
            setLastScrollY(y);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const filteredMeals = useMemo(() => {
        let meals = initialMeals;
        if (activeFilter !== 'all') meals = meals.filter(m => m.food_type === activeFilter);
        if (selectedCategory) meals = meals.filter(m => m.category_id === selectedCategory);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            meals = meals.filter(m =>
                m.name.toLowerCase().includes(q) ||
                m.description?.toLowerCase().includes(q) ||
                m.search_tags?.some(t => t.toLowerCase().includes(q))
            );
        }
        return meals;
    }, [initialMeals, activeFilter, searchQuery, selectedCategory]);

    const addToCart = useCallback((meal: MealWithDetails) => {
        ctxAdd({ id: meal.id, name: meal.name, price: meal.price, image_url: meal.image_url, description: meal.description, food_type: meal.food_type });
    }, [ctxAdd]);

    const getQty = (id: string) => cartItems.find(i => i.id === id)?.quantity ?? 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-32">

            {/* ── Sticky Filter Bar ── */}
            <div className={`sticky z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all duration-300 top-[60px] md:top-[68px] ${isScrolled ? 'shadow-sm' : ''}`}>
                <div className="max-w-md mx-auto px-4 pt-3 pb-3">
                    <AnimatePresence mode="wait">
                        {isSearchOpen ? (
                            <motion.div
                                key="search"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-2"
                            >
                                <button
                                    onClick={() => setIsSearchOpen(false)}
                                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors shrink-0"
                                >
                                    <ArrowRight className="h-4 w-4 rotate-180" />
                                </button>
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                    <Input
                                        autoFocus
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search meals, ingredients..."
                                        className="pl-10 pr-8 h-10 rounded-2xl bg-gray-100 border-transparent focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-gray-300 rounded-full p-0.5 hover:bg-gray-400 transition-colors"
                                        >
                                            <X className="h-3 w-3 text-gray-600" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="filters"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-0.5"
                            >
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className={`shrink-0 h-9 w-9 rounded-full border flex items-center justify-center transition-all ${
                                        searchQuery ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    <Search className="h-4 w-4" />
                                </button>

                                <div className="w-px h-5 bg-gray-200 shrink-0" />

                                {[
                                    { key: 'all', label: 'All' },
                                    { key: 'vegetarian', label: '🟢 Veg' },
                                    { key: 'non-vegetarian', label: '🔴 Non-Veg' },
                                ].map(({ key, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => { setActiveFilter(key as any); setSelectedCategory(null); }}
                                        className={`shrink-0 h-9 px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                                            activeFilter === key && !selectedCategory
                                                ? 'bg-gray-900 text-white border-transparent shadow-md'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}

                                <div className="w-px h-5 bg-gray-200 shrink-0" />

                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                        className={`shrink-0 h-9 px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                                            selectedCategory === cat.id
                                                ? 'bg-gray-900 text-white border-transparent shadow-md'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Main Content ── */}
            <main className="max-w-md mx-auto px-4 pt-6 space-y-6">

                {/* Hero */}
                {!searchQuery && !selectedCategory && activeFilter === 'all' && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-gray-950 rounded-3xl overflow-hidden px-6 py-7 text-white shadow-xl"
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/15 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none" />

                        <div className="relative z-10 flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <p className="text-green-400 text-[10px] font-black uppercase tracking-widest mb-2">Honest Meals</p>
                                <h2 className="text-2xl font-black leading-tight tracking-tight mb-3">
                                    Eat Smart.<br />
                                    <span className="text-green-400">Hit Your Goals.</span>
                                </h2>
                                <p className="text-gray-400 text-xs leading-relaxed max-w-[190px]">
                                    Chef-cooked meals with real macros, no guesswork.
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <div className="bg-green-500/15 border border-green-500/30 rounded-2xl px-3.5 py-2.5 text-right">
                                    <span className="text-[9px] font-black text-green-400/70 uppercase tracking-widest block">Up to</span>
                                    <span className="text-green-400 font-black text-2xl leading-none">42g</span>
                                    <span className="text-green-400/60 text-[10px] font-bold block">protein / meal</span>
                                </div>
                                {profile?.daily_protein_goal && (
                                    <div className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-right">
                                        <span className="text-[9px] text-gray-500 block">Your goal</span>
                                        <span className="text-white font-black text-sm">{profile.daily_protein_goal}g protein</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="relative z-10 flex gap-3 mt-5 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                <span className="text-[10px] text-gray-400 font-bold">Protein</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                <span className="text-[10px] text-gray-400 font-bold">Carbs</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                                <span className="text-[10px] text-gray-400 font-bold">Fat</span>
                            </div>
                            <span className="text-[10px] text-gray-600 font-medium ml-auto">on every card →</span>
                        </div>
                    </motion.div>
                )}

                {/* Results header */}
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-base font-black text-gray-900">
                        {searchQuery
                            ? `Results for "${searchQuery}"`
                            : selectedCategory
                                ? categories.find(c => c.id === selectedCategory)?.name
                                : activeFilter === 'vegetarian' ? 'Vegetarian'
                                : activeFilter === 'non-vegetarian' ? 'Non-Veg'
                                : 'All Meals'}
                    </h2>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        {filteredMeals.length} items
                    </span>
                </div>

                {/* Meal Grid */}
                <div className="grid grid-cols-2 gap-3.5">
                    <AnimatePresence>
                        {filteredMeals.map((meal, i) => (
                            <motion.div
                                key={meal.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                            >
                                <MealCard
                                    meal={meal}
                                    cartQty={getQty(meal.id)}
                                    onAdd={() => addToCart(meal)}
                                    onRemove={() => ctxRemove(meal.id)}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Empty State */}
                {filteredMeals.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">🍳</span>
                        </div>
                        <h3 className="text-base font-black text-gray-900 mb-1">No meals found</h3>
                        <p className="text-sm text-gray-400 mb-5 max-w-[220px] mx-auto leading-relaxed">
                            Try changing your filters or search for something else.
                        </p>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveFilter('all'); setSelectedCategory(null); }}
                            className="border border-gray-200 rounded-2xl px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </main>

            {/* ── Floating Cart Bar ── */}
            <AnimatePresence>
                {cartTotalItems > 0 && showFloating && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto"
                    >
                        <div className="bg-gray-950 text-white rounded-3xl px-4 py-3 flex items-center justify-between shadow-2xl shadow-gray-900/40 border border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-500 h-10 w-10 rounded-full flex items-center justify-center font-black text-sm shadow-lg shadow-green-700/30 shrink-0">
                                    {cartTotalItems}
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-0.5">Your Cart</p>
                                    <p className="font-black text-lg leading-none">₹{cartTotalPrice}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsCartOpen(true)}
                                    className="text-xs font-bold text-gray-400 hover:text-white transition-colors px-2 py-1"
                                >
                                    View
                                </button>
                                <Link href="/checkout">
                                    <button className="bg-green-600 hover:bg-green-500 text-white text-xs font-black px-4 py-2.5 rounded-2xl transition-colors flex items-center gap-1.5 shadow-md shadow-green-900/30">
                                        Checkout <ArrowRight className="h-3.5 w-3.5" />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
}

