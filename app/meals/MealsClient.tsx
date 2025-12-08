'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    Heart, 
    Star, 
    Clock,
    Flame,
    X,
    Plus,
    Minus,
    Leaf,
    ShoppingBag,
    ArrowRight,
    SlidersHorizontal,
    Utensils
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import type { MealWithDetails, Profile, MealCategory, DietaryType } from '@/types/database.types';

import { useCart } from '@/context/CartContext';
import CartSheet from '@/components/cart/CartSheet';

interface MealsClientProps {
    user: any;
    profile: Profile | null;
    initialMeals: MealWithDetails[];
    categories: MealCategory[];
    dietaryTypes: DietaryType[];
    selectedDiet?: string;
}

export default function MealsClient({ 
    user, 
    profile,
    initialMeals, 
    categories,
    dietaryTypes,
    selectedDiet 
}: MealsClientProps) {
    const { items: cartItems, addToCart: contextAddToCart, removeFromCart: contextRemoveFromCart, cartTotalItems, cartTotalPrice } = useCart();
    const [activeFilter, setActiveFilter] = useState<'all' | 'vegetarian' | 'non-vegetarian'>(
        selectedDiet === 'veg' ? 'vegetarian' : selectedDiet === 'non-veg' ? 'non-vegetarian' : 'all'
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showNav, setShowNav] = useState(true);
    const [showCart, setShowCart] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Handle scroll effect for sticky header and floating elements
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setIsScrolled(currentScrollY > 10);

            if (currentScrollY < 10) {
                setShowNav(true);
                setShowCart(true);
            } else {
                const direction = currentScrollY > lastScrollY ? 'down' : 'up';
                if (direction === 'down') {
                    setShowNav(false);
                    setShowCart(false);
                } else {
                    setShowNav(true);
                    setShowCart(true);
                }
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Filter meals based on active filter and search
    const filteredMeals = useMemo(() => {
        let meals = initialMeals;

        // Apply food type filter
        if (activeFilter !== 'all') {
            meals = meals.filter(meal => meal.food_type === activeFilter);
        }

        // Apply category filter
        if (selectedCategory) {
            meals = meals.filter(meal => meal.category_id === selectedCategory);
        }

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            meals = meals.filter(meal => 
                meal.name.toLowerCase().includes(query) ||
                meal.description?.toLowerCase().includes(query) ||
                meal.search_tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        return meals;
    }, [initialMeals, activeFilter, searchQuery, selectedCategory]);

    const addToCart = (meal: MealWithDetails) => {
        contextAddToCart({
            id: meal.id,
            name: meal.name,
            price: meal.price,
            image_url: meal.image_url,
            description: meal.description,
            food_type: meal.food_type
        });
    };

    const removeFromCart = (mealId: string) => {
        contextRemoveFromCart(mealId);
    };

    const getCartQty = (mealId: string) => {
        return cartItems.find(item => item.id === mealId)?.quantity || 0;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-32 md:pb-0">
            {/* Sticky Header */}
            <div className={`sticky z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300 ${isScrolled ? 'shadow-sm' : ''} ${showNav ? 'top-[60px] md:top-[68px]' : 'top-0'}`}>
                <div className="max-w-md mx-auto px-4 pt-4 pb-3">
                    {isSearchOpen ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 duration-200">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setIsSearchOpen(false)}
                                className="shrink-0 -ml-2"
                            >
                                <ArrowRight className="h-5 w-5 rotate-180" />
                            </Button>
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search meals..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                    className="pl-10 pr-8 h-10 rounded-xl bg-gray-100 border-transparent focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                                    >
                                        <X className="h-3 w-3 text-gray-600" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Filters Scroll Container */
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setIsSearchOpen(true)}
                                className={`shrink-0 rounded-full h-9 w-9 border-gray-200 ${searchQuery ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white text-gray-600'}`}
                            >
                                <Search className="h-4 w-4" />
                            </Button>

                            {searchQuery && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setIsSearchOpen(true);
                                    }}
                                    className="rounded-full h-9 px-3 whitespace-nowrap text-sm font-medium bg-green-50 border-green-200 text-green-700 flex items-center gap-1"
                                >
                                    "{searchQuery}"
                                    <div 
                                        role="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSearchQuery('');
                                        }}
                                        className="hover:bg-green-200 rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </div>
                                </Button>
                            )}

                            <div className="w-px h-6 bg-gray-200 mx-1 shrink-0" />

                            <Button
                                variant={activeFilter === 'all' && !selectedCategory ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    setActiveFilter('all');
                                    setSelectedCategory(null);
                                }}
                                className={`rounded-full h-9 px-5 whitespace-nowrap text-sm font-medium transition-all ${
                                    activeFilter === 'all' && !selectedCategory 
                                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 border-transparent' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                All
                            </Button>
                            
                            <Button
                                variant={activeFilter === 'vegetarian' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveFilter('vegetarian')}
                                className={`rounded-full h-9 px-5 whitespace-nowrap text-sm font-medium transition-all ${
                                    activeFilter === 'vegetarian' 
                                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 border-transparent' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <Leaf className="h-3.5 w-3.5 mr-1.5" />
                                Veg
                            </Button>
                            
                            <Button
                                variant={activeFilter === 'non-vegetarian' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveFilter('non-vegetarian')}
                                className={`rounded-full h-9 px-5 whitespace-nowrap text-sm font-medium transition-all ${
                                    activeFilter === 'non-vegetarian' 
                                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 border-transparent' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <span className="mr-1.5">🍗</span> Non-Veg
                            </Button>

                            <div className="w-px h-6 bg-gray-200 mx-1 shrink-0" />

                            {categories.map((category) => (
                                <Button
                                    key={category.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                                    className={`rounded-full h-9 px-5 whitespace-nowrap text-sm font-medium transition-all ${
                                        selectedCategory === category.id 
                                            ? 'bg-green-50 border-green-200 text-green-700 shadow-sm' 
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {category.name}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <main className="max-w-md mx-auto px-4 py-6 space-y-6">
                {/* Hero Section */}
                {!searchQuery && !selectedCategory && activeFilter === 'all' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-linear-to-br from-orange-400 to-red-500 rounded-3xl p-6 text-white shadow-lg shadow-orange-200 relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Hungry?</h2>
                                    <p className="text-orange-100 text-sm font-medium">Order fresh & healthy meals now.</p>
                                </div>
                                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                    <Utensils className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white">
                                    ⚡ 30 min delivery
                                </div>
                                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white">
                                    🥗 Fresh Ingredients
                                </div>
                            </div>
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    </motion.div>
                )}

                {/* Results Header */}
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl font-bold text-gray-900">
                        {selectedCategory 
                            ? categories.find(c => c.id === selectedCategory)?.name 
                            : activeFilter === 'vegetarian' ? 'Vegetarian Menu'
                            : activeFilter === 'non-vegetarian' ? 'Non-Veg Menu'
                            : 'Popular Meals'}
                    </h2>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {filteredMeals.length} items
                    </span>
                </div>

                {/* Meal Grid */}
                <div className="grid grid-cols-1 gap-5">
                    {filteredMeals.map((meal, index) => (
                        <motion.div
                            key={meal.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white rounded-3xl group">
                                {/* Image Section - Full width on mobile for impact */}
                                <div className="relative w-full h-48 bg-gray-100">
                                    {meal.image_url ? (
                                        <Image 
                                            src={meal.image_url} 
                                            alt={meal.name}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-6xl bg-gray-50">
                                            {meal.food_type === 'vegetarian' ? '🥗' : '🍗'}
                                        </div>
                                    )}
                                    
                                    {/* Badges */}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <Badge className={`backdrop-blur-md border-0 shadow-sm ${
                                            meal.food_type === 'vegetarian' 
                                                ? 'bg-green-500/90 text-white' 
                                                : 'bg-red-500/90 text-white'
                                        }`}>
                                            {meal.food_type === 'vegetarian' ? 'Veg' : 'Non-Veg'}
                                        </Badge>
                                        {meal.calories && (
                                            <Badge variant="secondary" className="bg-white/90 backdrop-blur-md text-gray-700 border-0 shadow-sm">
                                                <Flame className="h-3 w-3 text-orange-500 mr-1" />
                                                {meal.calories} cal
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-5">
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                            {meal.name}
                                        </h3>
                                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg text-amber-700 text-xs font-bold">
                                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                            <span>{meal.average_rating?.toFixed(1) || '4.5'}</span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                                        {meal.description}
                                    </p>

                                    {/* Price & Action */}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 font-medium uppercase">Price</span>
                                            <span className="text-xl font-bold text-gray-900">
                                                ₹{meal.price}
                                            </span>
                                        </div>

                                        {getCartQty(meal.id) > 0 ? (
                                            <div className="flex items-center gap-3 bg-green-50 rounded-2xl px-3 py-1.5 border border-green-100 shadow-sm">
                                                <button
                                                    onClick={() => removeFromCart(meal.id)}
                                                    className="p-1.5 hover:bg-green-200 rounded-xl transition-colors text-green-700"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="font-bold text-green-700 text-base min-w-6 text-center">
                                                    {getCartQty(meal.id)}
                                                </span>
                                                <button
                                                    onClick={() => addToCart(meal)}
                                                    className="p-1.5 hover:bg-green-200 rounded-xl transition-colors text-green-700"
                                                    disabled={!meal.is_available}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => addToCart(meal)}
                                                className="h-11 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 px-6 transition-all active:scale-95"
                                                disabled={!meal.is_available}
                                            >
                                                Add to Cart
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredMeals.length === 0 && (
                    <div className="text-center py-16">
                        <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">🍳</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No meals found</h3>
                        <p className="text-gray-500 mb-6 max-w-xs mx-auto">
                            We couldn't find any meals matching your filters. Try changing them.
                        </p>
                        <Button
                            onClick={() => {
                                setSearchQuery('');
                                setActiveFilter('all');
                                setSelectedCategory(null);
                            }}
                            variant="outline"
                            className="rounded-xl border-gray-200"
                        >
                            Clear All Filters
                        </Button>
                    </div>
                )}
            </main>

            {/* Floating Cart Bar */}
            <AnimatePresence>
                {cartTotalItems > 0 && showCart && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-24 left-4 right-4 z-40 max-w-md mx-auto"
                    >
                        <div className="bg-gray-900 text-white p-3 pr-4 rounded-3xl shadow-2xl shadow-gray-900/30 flex items-center justify-between border border-gray-800">
                            <div className="flex items-center gap-3 pl-1">
                                <div className="bg-green-500 text-white h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-green-500/40">
                                    {cartTotalItems}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</span>
                                    <span className="font-bold text-lg">₹{cartTotalPrice}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Button 
                                    onClick={() => setIsCartOpen(true)}
                                    variant="ghost"
                                    className="text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl px-3"
                                >
                                    View Cart
                                </Button>
                                <Link href="/checkout">
                                    <Button className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-900/20">
                                        Checkout
                                        <ArrowRight className="h-4 w-4 ml-1" />
                                    </Button>
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
