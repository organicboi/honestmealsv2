'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, 
    Search, 
    ShoppingCart, 
    Heart, 
    Star, 
    Clock,
    Flame,
    ChevronDown,
    Filter,
    X,
    User,
    Plus,
    Minus,
    Leaf
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import Image from 'next/image';
import type { MealWithDetails, Profile, MealCategory, DietaryType } from '@/types/database.types';

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
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState<'all' | 'vegetarian' | 'non-vegetarian'>(
        selectedDiet === 'veg' ? 'vegetarian' : selectedDiet === 'non-veg' ? 'non-vegetarian' : 'all'
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<Map<string, number>>(new Map());
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

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

    const addToCart = (mealId: string) => {
        const newCart = new Map(cart);
        newCart.set(mealId, (newCart.get(mealId) || 0) + 1);
        setCart(newCart);
    };

    const removeFromCart = (mealId: string) => {
        const newCart = new Map(cart);
        const current = newCart.get(mealId) || 0;
        if (current > 1) {
            newCart.set(mealId, current - 1);
        } else {
            newCart.delete(mealId);
        }
        setCart(newCart);
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

    const totalItems = Array.from(cart.values()).reduce((sum, count) => sum + count, 0);

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-green-50/30">
            {/* Modern Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left Section */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/')}
                                className="hover:bg-gray-100 rounded-full"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                    Honest Meals
                                </h1>
                                <p className="text-xs text-gray-500">Fresh & Healthy</p>
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center gap-3">
                            <Link href="/profile">
                                <div className="w-9 h-9 bg-linear-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow">
                                    <span className="text-white text-sm font-semibold">
                                        {user?.email?.[0].toUpperCase()}
                                    </span>
                                </div>
                            </Link>
                            <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 rounded-full relative"
                            >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Cart
                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                        {totalItems}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Search and Filter Bar */}
                <div className="mb-6 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search for meals, dishes, ingredients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-4 h-12 rounded-2xl border-gray-200 focus:border-green-500 shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2"
                            >
                                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>

                    {/* Quick Filters */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`rounded-full whitespace-nowrap ${showFilters ? 'bg-green-50 border-green-600 text-green-700' : ''}`}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>
                        
                        <Button
                            variant={activeFilter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveFilter('all')}
                            className={`rounded-full whitespace-nowrap ${activeFilter === 'all' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        >
                            All Meals
                        </Button>
                        
                        <Button
                            variant={activeFilter === 'vegetarian' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveFilter('vegetarian')}
                            className={`rounded-full whitespace-nowrap ${activeFilter === 'vegetarian' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        >
                            <Leaf className="h-4 w-4 mr-1" />
                            Vegetarian
                        </Button>
                        
                        <Button
                            variant={activeFilter === 'non-vegetarian' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveFilter('non-vegetarian')}
                            className={`rounded-full whitespace-nowrap ${activeFilter === 'non-vegetarian' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        >
                            🍗 Non-Veg
                        </Button>
                    </div>

                    {/* Category Pills */}
                    {categories.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedCategory(null)}
                                className={`rounded-full whitespace-nowrap ${!selectedCategory ? 'bg-green-50 border-green-600 text-green-700' : ''}`}
                            >
                                All Categories
                            </Button>
                            {categories.map((category) => (
                                <Button
                                    key={category.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`rounded-full whitespace-nowrap ${selectedCategory === category.id ? 'bg-green-50 border-green-600 text-green-700' : ''}`}
                                >
                                    {category.name}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Results Count */}
                <div className="mb-4">
                    <p className="text-sm text-gray-600">
                        Found <span className="font-semibold text-gray-900">{filteredMeals.length}</span> meals
                    </p>
                </div>

                {/* Meal Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredMeals.map((meal, index) => (
                        <motion.div
                            key={meal.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-gray-100 h-full flex flex-col">
                                {/* Image Container */}
                                <div className="relative h-48 bg-linear-to-br from-green-100 to-emerald-100 overflow-hidden">
                                    {meal.image_url ? (
                                        <Image 
                                            src={meal.image_url} 
                                            alt={meal.name}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-7xl">
                                            {meal.food_type === 'vegetarian' ? '🥗' : '🍗'}
                                        </div>
                                    )}
                                    
                                    {/* Badges Overlay */}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        {meal.food_type === 'vegetarian' && (
                                            <Badge variant="success" className="bg-green-600 text-white border-0 shadow-md">
                                                <Leaf className="h-3 w-3 mr-1" />
                                                Veg
                                            </Badge>
                                        )}
                                        {!meal.is_available && (
                                            <Badge variant="destructive" className="shadow-md">
                                                Sold Out
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Favorite Button */}
                                    <button
                                        onClick={() => toggleFavorite(meal.id)}
                                        className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all shadow-md"
                                    >
                                        <Heart 
                                            className={`h-5 w-5 transition-colors ${favorites.has(meal.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                                        />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-4 flex-1 flex flex-col">
                                    {/* Title */}
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                                        {meal.name}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">
                                        {meal.description || 'Delicious and nutritious meal prepared fresh.'}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                            <span className="font-semibold">{meal.average_rating?.toFixed(1) || '4.5'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Flame className="h-4 w-4 text-orange-500" />
                                            <span>{meal.calories || 350} cal</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4 text-blue-500" />
                                            <span>20-30 min</span>
                                        </div>
                                    </div>

                                    {/* Price and Add Button */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-2xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                                ₹{meal.price}
                                            </span>
                                        </div>
                                        
                                        {cart.has(meal.id) ? (
                                            <div className="flex items-center gap-2 bg-green-50 rounded-full px-2 py-1 border border-green-600">
                                                <button
                                                    onClick={() => removeFromCart(meal.id)}
                                                    className="p-1 hover:bg-green-100 rounded-full transition-colors"
                                                >
                                                    <Minus className="h-4 w-4 text-green-700" />
                                                </button>
                                                <span className="font-bold text-green-700 min-w-5 text-center">
                                                    {cart.get(meal.id)}
                                                </span>
                                                <button
                                                    onClick={() => addToCart(meal.id)}
                                                    className="p-1 hover:bg-green-100 rounded-full transition-colors"
                                                    disabled={!meal.is_available}
                                                >
                                                    <Plus className="h-4 w-4 text-green-700" />
                                                </button>
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => addToCart(meal.id)}
                                                className="bg-green-600 hover:bg-green-700 rounded-full px-6"
                                                size="sm"
                                                disabled={!meal.is_available}
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add
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
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <div className="text-6xl mb-4">🍽️</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No meals found</h3>
                        <p className="text-gray-600 mb-6">Try adjusting your filters or search query</p>
                        <Button
                            onClick={() => {
                                setSearchQuery('');
                                setActiveFilter('all');
                                setSelectedCategory(null);
                            }}
                            variant="outline"
                            className="rounded-full"
                        >
                            Clear all filters
                        </Button>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
