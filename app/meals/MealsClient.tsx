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
    SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import type { MealWithDetails, Profile, MealCategory, DietaryType } from '@/types/database.types';

import { useCart } from '@/context/CartContext';

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

    // Handle scroll effect for sticky header shadow
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    const toggleFavorite = (mealId: string) => {
        const newFavorites = new Set(favorites);
        if (newFavorites.has(mealId)) {
            newFavorites.delete(mealId);
        } else {
            newFavorites.add(mealId);
        }
        setFavorites(newFavorites);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
            {/* Sticky Header */}
            <div className={`sticky top-0 z-30 bg-white transition-shadow duration-200 ${isScrolled ? 'shadow-md' : ''}`}>
                <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
                    {/* Search Bar */}
                    <div className="relative mb-3">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search meals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 pr-4 h-11 rounded-xl bg-gray-100 border-transparent focus:bg-white focus:border-green-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 bg-gray-200 rounded-full"
                            >
                                <X className="h-3 w-3 text-gray-600" />
                            </button>
                        )}
                    </div>

                    {/* Filters Scroll Container */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                        <Button
                            variant={activeFilter === 'all' && !selectedCategory ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                setActiveFilter('all');
                                setSelectedCategory(null);
                            }}
                            className={`rounded-full h-8 px-4 whitespace-nowrap text-xs font-medium ${
                                activeFilter === 'all' && !selectedCategory 
                                    ? 'bg-green-600 hover:bg-green-700 border-transparent' 
                                    : 'border-gray-200 text-gray-600'
                            }`}
                        >
                            All
                        </Button>
                        
                        <Button
                            variant={activeFilter === 'vegetarian' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveFilter('vegetarian')}
                            className={`rounded-full h-8 px-4 whitespace-nowrap text-xs font-medium ${
                                activeFilter === 'vegetarian' 
                                    ? 'bg-green-600 hover:bg-green-700 border-transparent' 
                                    : 'border-gray-200 text-gray-600'
                            }`}
                        >
                            <Leaf className="h-3 w-3 mr-1" />
                            Veg
                        </Button>
                        
                        <Button
                            variant={activeFilter === 'non-vegetarian' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveFilter('non-vegetarian')}
                            className={`rounded-full h-8 px-4 whitespace-nowrap text-xs font-medium ${
                                activeFilter === 'non-vegetarian' 
                                    ? 'bg-green-600 hover:bg-green-700 border-transparent' 
                                    : 'border-gray-200 text-gray-600'
                            }`}
                        >
                            🍗 Non-Veg
                        </Button>

                        <div className="w-px h-6 bg-gray-200 mx-1 shrink-0" />

                        {categories.map((category) => (
                            <Button
                                key={category.id}
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                                className={`rounded-full h-8 px-4 whitespace-nowrap text-xs font-medium ${
                                    selectedCategory === category.id 
                                        ? 'bg-green-50 border-green-600 text-green-700' 
                                        : 'border-gray-200 text-gray-600'
                                }`}
                            >
                                {category.name}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-4">
                {/* Results Count (Subtle) */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">
                        {selectedCategory 
                            ? categories.find(c => c.id === selectedCategory)?.name 
                            : activeFilter === 'vegetarian' ? 'Vegetarian Meals'
                            : activeFilter === 'non-vegetarian' ? 'Non-Veg Meals'
                            : 'All Meals'}
                    </h2>
                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md">
                        {filteredMeals.length} items
                    </span>
                </div>

                {/* Meal Grid - Mobile Optimized */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMeals.map((meal, index) => (
                        <motion.div
                            key={meal.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white rounded-2xl">
                                <div className="flex sm:flex-col h-full">
                                    {/* Image - Left side on mobile, Top on desktop */}
                                    <div className="relative w-32 sm:w-full sm:h-48 shrink-0 bg-gray-100">
                                        {meal.image_url ? (
                                            <Image 
                                                src={meal.image_url} 
                                                alt={meal.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl">
                                                {meal.food_type === 'vegetarian' ? '🥗' : '🍗'}
                                            </div>
                                        )}
                                        
                                        {/* Mobile: Type Indicator Dot */}
                                        <div className="absolute top-2 left-2 sm:hidden">
                                            <div className={`h-3 w-3 rounded-full border-2 border-white shadow-sm ${
                                                meal.food_type === 'vegetarian' ? 'bg-green-500' : 'bg-red-500'
                                            }`} />
                                        </div>

                                        {/* Desktop: Badges */}
                                        <div className="hidden sm:flex absolute top-3 left-3 gap-2">
                                            {meal.food_type === 'vegetarian' && (
                                                <Badge className="bg-green-600/90 backdrop-blur-sm hover:bg-green-700 border-0">
                                                    Veg
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-3 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900 line-clamp-2 text-sm sm:text-lg leading-tight">
                                                    {meal.name}
                                                </h3>
                                                {/* Mobile: Price here */}
                                                <span className="sm:hidden font-bold text-green-700 text-sm">
                                                    ₹{meal.price}
                                                </span>
                                            </div>
                                            
                                            <p className="text-xs text-gray-500 line-clamp-2 mb-2 hidden sm:block">
                                                {meal.description}
                                            </p>

                                            {/* Stats Row */}
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mb-2 sm:mb-4">
                                                <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded text-amber-700">
                                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                                    <span className="font-semibold">{meal.average_rating?.toFixed(1) || '4.5'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Flame className="h-3 w-3 text-orange-400" />
                                                    <span>{meal.calories || 350}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Row */}
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="hidden sm:block text-lg font-bold text-gray-900">
                                                ₹{meal.price}
                                            </span>

                                            {getCartQty(meal.id) > 0 ? (
                                                <div className="flex items-center gap-3 bg-green-50 rounded-lg px-2 py-1 border border-green-200 ml-auto sm:ml-0">
                                                    <button
                                                        onClick={() => removeFromCart(meal.id)}
                                                        className="p-1 hover:bg-green-200 rounded-md transition-colors"
                                                    >
                                                        <Minus className="h-3 w-3 text-green-700" />
                                                    </button>
                                                    <span className="font-bold text-green-700 text-sm min-w-[1rem] text-center">
                                                        {getCartQty(meal.id)}
                                                    </span>
                                                    <button
                                                        onClick={() => addToCart(meal)}
                                                        className="p-1 hover:bg-green-200 rounded-md transition-colors"
                                                        disabled={!meal.is_available}
                                                    >
                                                        <Plus className="h-3 w-3 text-green-700" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <Button
                                                    onClick={() => addToCart(meal)}
                                                    className="h-8 bg-white text-green-600 border border-green-200 hover:bg-green-50 hover:border-green-300 shadow-sm rounded-lg text-xs font-bold px-4 ml-auto sm:ml-0"
                                                    size="sm"
                                                    disabled={!meal.is_available}
                                                >
                                                    ADD
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredMeals.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-4 opacity-50">🍳</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No meals found</h3>
                        <p className="text-sm text-gray-500 mb-4">Try changing your filters</p>
                        <Button
                            onClick={() => {
                                setSearchQuery('');
                                setActiveFilter('all');
                                setSelectedCategory(null);
                            }}
                            variant="outline"
                            size="sm"
                        >
                            Clear Filters
                        </Button>
                    </div>
                )}
            </main>

            {/* Floating Cart Bar - Mobile App Style */}
            <AnimatePresence>
                {cartTotalItems > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-20 md:bottom-8 left-4 right-4 z-40 max-w-7xl mx-auto"
                    >
                        <Link href="/checkout">
                            <div className="bg-green-600 text-white p-4 rounded-2xl shadow-xl shadow-green-600/20 flex items-center justify-between cursor-pointer hover:bg-green-700 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium text-green-100 uppercase tracking-wider">Total</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-bold text-lg">₹{cartTotalPrice}</span>
                                        <span className="text-sm text-green-200">/ {cartTotalItems} items</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 font-bold">
                                    View Cart
                                    <div className="bg-white/20 p-1.5 rounded-full">
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
