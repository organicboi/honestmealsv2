'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, ShoppingCart, Heart, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
    const [cart, setCart] = useState<string[]>([]);

    // Filter meals based on active filter and search
    const filteredMeals = useMemo(() => {
        let meals = initialMeals;

        // Apply food type filter
        if (activeFilter !== 'all') {
            meals = meals.filter(meal => meal.food_type === activeFilter);
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
    }, [initialMeals, activeFilter, searchQuery]);

    const addToCart = (mealId: string) => {
        setCart([...cart, mealId]);
        // TODO: Implement actual cart functionality
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-green-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/')}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                Back
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Our Meals</h1>
                                <p className="text-sm text-gray-600">Fresh, Healthy & Delicious</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/profile">
                                <div className="flex items-center gap-2 cursor-pointer">
                                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-semibold">
                                            {user?.email?.[0].toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                            <Button
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <ShoppingCart className="h-5 w-5 mr-2" />
                                Cart ({cart.length})
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search meals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    {/* Food Type Filter */}
                    <div className="flex gap-2">
                        <Button
                            variant={activeFilter === 'all' ? 'default' : 'outline'}
                            onClick={() => setActiveFilter('all')}
                            className={activeFilter === 'all' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            All
                        </Button>
                        <Button
                            variant={activeFilter === 'vegetarian' ? 'default' : 'outline'}
                            onClick={() => setActiveFilter('vegetarian')}
                            className={activeFilter === 'vegetarian' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            🥬 Veg
                        </Button>
                        <Button
                            variant={activeFilter === 'non-vegetarian' ? 'default' : 'outline'}
                            onClick={() => setActiveFilter('non-vegetarian')}
                            className={activeFilter === 'non-vegetarian' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            🍗 Non-Veg
                        </Button>
                    </div>
                </div>

                {/* Meal Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMeals.map((meal) => (
                        <motion.div
                            key={meal.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                        >
                            {/* Meal Image */}
                            <div className="h-48 bg-linear-to-br from-green-400 to-green-600 flex items-center justify-center relative">
                                {meal.image_url ? (
                                    <Image 
                                        src={meal.image_url} 
                                        alt={meal.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <span className="text-6xl">{meal.food_type === 'vegetarian' ? '🥗' : '🍗'}</span>
                                )}
                                <button className="absolute top-4 right-4 bg-white p-2 rounded-full hover:bg-gray-100">
                                    <Heart className="h-5 w-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Meal Info */}
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-xl font-semibold text-gray-900">{meal.name}</h3>
                                    {meal.food_type === 'vegetarian' && (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">VEG</span>
                                    )}
                                </div>

                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                    {meal.description}
                                </p>

                                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span>{meal.average_rating?.toFixed(1) || '4.5'}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{meal.calories || 350} cal</span>
                                    <span>•</span>
                                    <span>{meal.protein || 25}g protein</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-green-600">
                                        ₹{meal.price}
                                    </span>
                                    <Button
                                        onClick={() => addToCart(meal.id)}
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={!meal.is_available}
                                    >
                                        {meal.is_available ? 'Add to Cart' : 'Unavailable'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredMeals.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-gray-500 text-lg">No meals found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
