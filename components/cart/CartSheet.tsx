'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface CartSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartSheet({ isOpen, onClose }: CartSheetProps) {
    const { items, addToCart, removeFromCart, cartTotalPrice, cartTotalItems } = useCart();
    const router = useRouter();

    const handleCheckout = () => {
        onClose();
        router.push('/checkout');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-xl">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5 text-green-600" />
                                <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
                                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {cartTotalItems} items
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                                        <ShoppingBag className="h-10 w-10 text-green-200" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Your cart is empty</h3>
                                        <p className="text-gray-500 text-sm">Add some delicious meals to get started!</p>
                                    </div>
                                    <Button
                                        onClick={onClose}
                                        variant="outline"
                                        className="rounded-full border-green-600 text-green-600 hover:bg-green-50"
                                    >
                                        Browse Meals
                                    </Button>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={item.id} className="flex gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                        {/* Image */}
                                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                            {item.image_url ? (
                                                <Image
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl">
                                                    {item.food_type === 'vegetarian' ? '🥗' : '🍗'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                                                <p className="text-sm text-gray-500">₹{item.price}</p>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="p-1 hover:bg-white rounded-md shadow-sm transition-all"
                                                    >
                                                        <Minus className="h-3 w-3 text-gray-600" />
                                                    </button>
                                                    <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => addToCart(item)}
                                                        className="p-1 hover:bg-white rounded-md shadow-sm transition-all"
                                                    >
                                                        <Plus className="h-3 w-3 text-gray-600" />
                                                    </button>
                                                </div>
                                                <span className="font-bold text-gray-900">
                                                    ₹{item.price * item.quantity}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-4 bg-white border-t border-gray-100 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal</span>
                                        <span>₹{cartTotalPrice}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>₹{cartTotalPrice}</span>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleCheckout}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-6 text-lg font-semibold shadow-lg shadow-green-200"
                                >
                                    Proceed to Checkout
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
