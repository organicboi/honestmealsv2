'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    ShoppingCart, 
    Heart, 
    Star, 
    Clock, 
    Flame, 
    Plus, 
    Minus, 
    Filter,
    ChevronRight,
    UtensilsCrossed,
    Leaf,
    Beef,
    X,
    MapPin,
    ChevronDown
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import type { MealWithDetails, Profile, MealCategory, DietaryType } from '@/types/database.types';

import { useCart } from '@/context/CartContext';

interface OrderMealsClientProps {
    user: any;
    profile: Profile | null;
    initialMeals: MealWithDetails[];
    categories: MealCategory[];
    dietaryTypes: DietaryType[];
    selectedDiet?: string;
}

export default function OrderMealsClient({ 
    user, 
    profile,
    initialMeals, 
    categories,
    dietaryTypes,
    selectedDiet 
}: OrderMealsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlSearchQuery = searchParams.get('search') || '';
    const { items: cartItems, addToCart: contextAddToCart, removeFromCart: contextRemoveFromCart, cartTotalItems, cartTotalPrice } = useCart();
    
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'veg' | 'non-veg'>('all');

    const filteredMeals = useMemo(() => {
        let meals = initialMeals;

        // Category Filter
        if (activeCategory !== 'all') {
            meals = meals.filter(m => m.category_id === activeCategory);
        }

        // Type Filter
        if (activeFilter === 'veg') {
            meals = meals.filter(m => m.food_type === 'vegetarian');
        } else if (activeFilter === 'non-veg') {
            meals = meals.filter(m => m.food_type === 'non-vegetarian');
        }

        if (urlSearchQuery) {
            const query = urlSearchQuery.toLowerCase();
            meals = meals.filter(meal => 
                meal.name.toLowerCase().includes(query) ||
                meal.description?.toLowerCase().includes(query)
            );
        }

        return meals;
    }, [initialMeals, activeCategory, activeFilter, urlSearchQuery]);

    const handleAddToCart = (meal: MealWithDetails) => {
        contextAddToCart({
            id: meal.id,
            name: meal.name,
            price: meal.price,
            image_url: meal.image_url,
            description: meal.description,
            food_type: meal.food_type
        });
    };

    const handleRemoveFromCart = (mealId: string) => {
        contextRemoveFromCart(mealId);
    };

    const getCartQty = (mealId: string) => {
        return cartItems.find(item => item.id === mealId)?.quantity || 0;
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Hero / Promo Section */}
            <div className="bg-gray-900 text-white py-8 md:py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-bold mb-4">Hungry?</h1>
                            <p className="text-gray-400 text-lg mb-6">Order honest meals with real ingredients.</p>
                            <div className="flex gap-3">
                                <Badge className="bg-green-600 hover:bg-green-700 px-3 py-1 text-sm">50% OFF First Order</Badge>
                                <Badge variant="outline" className="text-white border-white/20 px-3 py-1 text-sm">Free Delivery</Badge>
                            </div>
                        </div>
                        <div className="hidden md:flex justify-end gap-4">
                            {/* Promo Cards */}
                            <div className="w-48 h-32 bg-linear-to-br from-orange-500 to-red-600 rounded-xl p-4 shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300 cursor-pointer group">
                                <p className="font-bold text-lg">Biryani Fest</p>
                                <p className="text-xs opacity-80">Starts @ ₹149</p>
                            </div>
                            <div className="w-48 h-32 bg-linear-to-br from-green-500 to-emerald-700 rounded-xl p-4 shadow-lg transform -rotate-2 hover:rotate-0 transition-transform duration-300 cursor-pointer group">
                                <p className="font-bold text-lg">Healthy Bowls</p>
                                <p className="text-xs opacity-80">Flat 20% Off</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Category & Filter Bar */}
            <div className="sticky top-[65px] z-30 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                        {/* Categories Horizontal Scroll */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide mask-fade-right">
                            <CategoryPill 
                                active={activeCategory === 'all'} 
                                onClick={() => setActiveCategory('all')}
                                label="All"
                            />
                            {categories.map(cat => (
                                <CategoryPill 
                                    key={cat.id}
                                    active={activeCategory === cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    label={cat.name}
                                />
                            ))}
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2 border-l border-gray-200 pl-4 ml-2">
                            <FilterPill 
                                active={activeFilter === 'veg'} 
                                onClick={() => setActiveFilter(activeFilter === 'veg' ? 'all' : 'veg')}
                                label="Pure Veg"
                            />
                            <FilterPill 
                                active={activeFilter === 'non-veg'} 
                                onClick={() => setActiveFilter(activeFilter === 'non-veg' ? 'all' : 'non-veg')}
                                label="Non-Veg"
                            />
                            <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block"></div>
                            <button className="text-sm font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1 px-2">
                                Filters <Filter className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 flex gap-8">
                {/* Main Content */}
                <main className="flex-1">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800">
                            {activeCategory === 'all' ? 'Recommended for you' : 
                             categories.find(c => c.id === activeCategory)?.name}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredMeals.map((meal) => (
                                <MealCard 
                                    key={meal.id} 
                                    meal={meal} 
                                    cartQty={getCartQty(meal.id)}
                                    onAdd={() => handleAddToCart(meal)}
                                    onRemove={() => handleRemoveFromCart(meal.id)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                    
                    {filteredMeals.length === 0 && (
                        <div className="text-center py-20">
                            <div className="bg-gray-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No meals found</h3>
                            <p className="text-gray-500">Try adjusting your search or filters.</p>
                        </div>
                    )}
                </main>

                {/* Desktop Cart Sidebar (Persistent if items exist) */}
                {cartItems.length > 0 && (
                    <aside className="hidden lg:block w-80 shrink-0 sticky top-32 h-[calc(100vh-140px)]">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col h-full overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="font-bold text-lg text-gray-800">Cart</h3>
                                <p className="text-xs text-gray-500">{cartTotalItems} Items</p>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {cartItems.map((item) => {
                                    return (
                                        <div key={item.id} className="flex gap-3 items-start">
                                            <div className="flex items-center gap-1 mt-1">
                                                <div className={`h-3 w-3 border flex items-center justify-center ${item.food_type === 'vegetarian' ? 'border-green-600' : 'border-red-600'}`}>
                                                    <div className={`h-1.5 w-1.5 rounded-full ${item.food_type === 'vegetarian' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</p>
                                                <p className="text-xs text-gray-500">₹{item.price}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center border border-gray-200 rounded-md bg-white shadow-sm">
                                                        <button onClick={() => handleRemoveFromCart(item.id)} className="px-2 py-0.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-l-md">-</button>
                                                        <span className="text-xs font-bold px-1 text-green-700">{item.quantity}</span>
                                                        <button onClick={() => handleAddToCart(item as any)} className="px-2 py-0.5 text-green-600 hover:bg-green-50 rounded-r-md">+</button>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700">₹{item.price * item.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-4 bg-white border-t border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-gray-800">Subtotal</span>
                                    <span className="font-bold text-gray-900">₹{cartTotalPrice.toFixed(2)}</span>
                                </div>
                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6">
                                    Checkout
                                </Button>
                            </div>
                        </div>
                    </aside>
                )}
            </div>

            {/* Cart Floating Bar (Mobile) */}
            <AnimatePresence>
                {cartTotalItems > 0 && (
                    <motion.div 
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-50 lg:hidden"
                    >
                        <div className="flex items-center justify-between max-w-7xl mx-auto">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{cartTotalItems} items | ₹{cartTotalPrice.toFixed(2)}</p>
                                <p className="font-bold text-green-600 text-sm">Extra charges may apply</p>
                            </div>
                            <Button className="bg-green-600 hover:bg-green-700 text-white px-8 rounded-lg font-bold">
                                View Cart
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cart Drawer (Mobile/Tablet Overlay) */}
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="fixed inset-0 bg-black z-50"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
                        >
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                                <h2 className="font-bold text-xl text-gray-800">My Cart</h2>
                                <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            
                            <div className="flex-1 p-5 overflow-y-auto">
                                {cartItems.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 mt-20">
                                        <ShoppingCart className="h-16 w-16 text-gray-300" />
                                        <p className="text-gray-500 font-medium">Your cart is empty</p>
                                        <Button variant="outline" onClick={() => setIsCartOpen(false)}>See Restaurants</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {cartItems.map((item) => {
                                            return (
                                                <div key={item.id} className="flex gap-4">
                                                    <div className="h-20 w-20 bg-gray-100 rounded-lg relative overflow-hidden shrink-0">
                                                        {item.image_url && (
                                                            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="font-bold text-gray-800 line-clamp-1">{item.name}</h4>
                                                            <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className={`h-3 w-3 border flex items-center justify-center ${item.food_type === 'vegetarian' ? 'border-green-600' : 'border-red-600'}`}>
                                                                <div className={`h-1.5 w-1.5 rounded-full ${item.food_type === 'vegetarian' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                                            </div>
                                                            <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center border border-gray-200 rounded-md bg-white shadow-sm">
                                                                <button onClick={() => handleRemoveFromCart(item.id)} className="px-3 py-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-l-md">-</button>
                                                                <span className="text-sm font-bold px-2 text-green-700">{item.quantity}</span>
                                                                <button onClick={() => handleAddToCart(item as any)} className="px-3 py-1 text-green-600 hover:bg-green-50 rounded-r-md">+</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {cartItems.length > 0 && (
                                <div className="p-5 border-t border-gray-100 bg-gray-50">
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Item Total</span>
                                            <span>₹{cartTotalPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Delivery Fee</span>
                                            <span>₹40.00</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200">
                                            <span>To Pay</span>
                                            <span>₹{(cartTotalPrice + 40).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg rounded-xl shadow-lg shadow-green-200">
                                        Proceed to Pay
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function CategoryPill({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button 
            onClick={onClick}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                active 
                ? 'bg-gray-900 text-white border-gray-900' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
        >
            {label}
        </button>
    );
}

function FilterPill({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button 
            onClick={onClick}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                active 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
        >
            {label}
            {active && <span className="ml-1">×</span>}
        </button>
    );
}

function MealCard({ meal, cartQty, onAdd, onRemove }: { meal: MealWithDetails, cartQty: number, onAdd: () => void, onRemove: () => void }) {
    return (
        <motion.div 
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group border border-transparent hover:border-gray-100"
        >
            <div className="relative h-56 overflow-hidden">
                {meal.image_url ? (
                    <Image 
                        src={meal.image_url} 
                        alt={meal.name} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <UtensilsCrossed className="h-12 w-12 text-gray-300" />
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4 pt-12">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`h-4 w-4 border flex items-center justify-center bg-white ${meal.food_type === 'vegetarian' ? 'border-green-600' : 'border-red-600'}`}>
                                    <div className={`h-2 w-2 rounded-full ${meal.food_type === 'vegetarian' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                </div>
                                <span className="text-xs font-bold text-white/90 bg-black/30 px-2 py-0.5 rounded backdrop-blur-sm">
                                    {meal.calories} kcal
                                </span>
                            </div>
                            <h3 className="font-bold text-white text-xl line-clamp-1 drop-shadow-sm">{meal.name}</h3>
                        </div>
                        <div className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                            <span>4.2</span>
                            <Star className="h-3 w-3 fill-current" />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <p className="text-gray-500 text-sm line-clamp-2 h-10">{meal.description}</p>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold text-gray-900">₹{meal.price}</span>
                    
                    {cartQty > 0 ? (
                        <div className="flex items-center bg-white border border-green-200 rounded-lg shadow-sm overflow-hidden">
                            <button 
                                onClick={onRemove}
                                className="px-3 py-1.5 text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-bold text-green-700 text-sm w-6 text-center">{cartQty}</span>
                            <button 
                                onClick={onAdd}
                                className="px-3 py-1.5 text-green-600 hover:bg-green-50 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <Button 
                            onClick={onAdd}
                            variant="outline"
                            className="rounded-lg border-gray-200 text-green-600 hover:text-green-700 hover:border-green-600 hover:bg-green-50 px-6 font-bold"
                        >
                            ADD
                        </Button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
