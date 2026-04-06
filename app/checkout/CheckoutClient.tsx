'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, MapPin, Phone, User, FileText, Loader2, BookmarkPlus, Check, X } from 'lucide-react';
import { placeOrder } from '@/app/actions/orders';
import { logOrderedMeals } from '@/app/actions/food-logging';
import type { Profile } from '@/types/database.types';
import { motion, AnimatePresence } from 'framer-motion';

interface CheckoutClientProps {
    user: any;
    profile: Profile | null;
}

export default function CheckoutClient({ user, profile }: CheckoutClientProps) {
    const router = useRouter();
    const { items, cartTotalPrice, clearCart } = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [pendingUrl, setPendingUrl] = useState('');
    const [pendingItems, setPendingItems] = useState<{ mealId: string; quantity: number }[]>([]);
    const [isLogging, setIsLogging] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        notes: ''
    });

    const [errors, setErrors] = useState({
        name: '',
        phone: '',
        address: ''
    });

    // Auto-fill data
    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                name: profile.name || '',
                phone: profile.phone_number || '',
                address: profile.address || ''
            }));
        } else {
            // Try to load from localStorage for guest users
            const savedDetails = localStorage.getItem('honest_meals_guest_details');
            if (savedDetails) {
                try {
                    const parsed = JSON.parse(savedDetails);
                    setFormData(prev => ({ ...prev, ...parsed }));
                } catch (e) {
                    console.error('Failed to parse guest details', e);
                }
            }
        }
    }, [profile]);

    // Redirect if cart is empty
    useEffect(() => {
        if (items.length === 0) {
            router.push('/meals');
        }
    }, [items, router]);

    const validateForm = () => {
        let isValid = true;
        const newErrors = { name: '', phone: '', address: '' };

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
            isValid = false;
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
            isValid = false;
        } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
            isValid = false;
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Delivery address is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handlePlaceOrder = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            // Save guest details to localStorage if not authenticated
            if (!user) {
                localStorage.setItem('honest_meals_guest_details', JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    address: formData.address
                }));
            }

            // If authenticated, save order to database
            if (user) {
                const result = await placeOrder({
                    items: items.map(item => ({
                        meal_id: item.id,
                        quantity: item.quantity,
                        unit_price: item.price
                    })),
                    delivery_address: formData.address,
                    notes: formData.notes,
                    customer_details: {
                        name: formData.name,
                        phone: formData.phone
                    }
                });

                if (!result.success) {
                    console.error('Failed to save order to database:', result.error);
                    // We continue to WhatsApp even if DB save fails, or maybe show error?
                    // For now, let's continue but log it.
                }
            }

            // Generate WhatsApp Message
            const message = `*New Order from Honest Meals*
---------------------------
*Customer:* ${formData.name}
*Phone:* ${formData.phone}
*Address:* ${formData.address}
---------------------------
*Order Details:*
${items.map((item, index) => `${index + 1}. ${item.name} x ${item.quantity} - ₹${item.price * item.quantity}`).join('\n')}
---------------------------
*Total Amount:* ₹${cartTotalPrice}
---------------------------
${formData.notes ? `*Notes:* ${formData.notes}` : ''}`;

            const encodedMessage = encodeURIComponent(message);
            // Replace with actual business number
            const businessNumber = '7972279059'; 
            const whatsappUrl = `https://wa.me/${businessNumber}?text=${encodedMessage}`;

            // Clear cart
            const itemsToLog = items.map(i => ({ mealId: i.id, quantity: i.quantity }));
            setPendingItems(itemsToLog);
            setPendingUrl(whatsappUrl);
            clearCart();

            if (user) {
                setIsSubmitting(false);
                setShowLogModal(true);
            } else {
                window.location.href = whatsappUrl;
            }

        } catch (error) {
            console.error('Error placing order:', error);
            setIsSubmitting(false);
        }
    };

    if (items.length === 0 && !showLogModal) return null;

    const completeOrder = async (logMeals: boolean) => {
        if (logMeals && pendingItems.length > 0) {
            setIsLogging(true);
            try {
                await logOrderedMeals(pendingItems);
            } catch {
                // silent — don't block redirect
            }
            setIsLogging(false);
        }
        setShowLogModal(false);
        window.location.href = pendingUrl;
    };

    return (
        <>
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-6 hover:bg-gray-100"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Menu
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Order Summary */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
                        <Card className="p-6 bg-white shadow-sm border-gray-100">
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-medium text-gray-900">₹{item.price * item.quantity}</p>
                                    </div>
                                ))}
                                <div className="border-t border-gray-100 pt-4 mt-4">
                                    <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>₹{cartTotalPrice}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Delivery Details Form */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">Delivery Details</h2>
                        <Card className="p-6 bg-white shadow-sm border-gray-100">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                                            placeholder="7972279059"
                                            type="tel"
                                        />
                                    </div>
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Delivery Address
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className={`w-full pl-10 p-2 rounded-md border ${errors.address ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[100px] text-sm`}
                                            placeholder="Flat No, Building, Street, Area..."
                                        />
                                    </div>
                                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes (Optional)
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full pl-10 p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-20 text-sm"
                                            placeholder="Any special instructions..."
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handlePlaceOrder}
                                    disabled={isSubmitting}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold shadow-lg shadow-green-200 mt-4"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Place Order on WhatsApp'
                                    )}
                                </Button>
                                <p className="text-xs text-center text-gray-500 mt-2">
                                    You will be redirected to WhatsApp to send your order.
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>

        {/* Log-to-Tracker Modal */}
        <AnimatePresence>
            {showLogModal && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 max-w-md mx-auto"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                            <div className="bg-gray-950 px-6 pt-6 pb-4">
                                <div className="w-10 h-10 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-3">
                                    <BookmarkPlus className="w-5 h-5 text-orange-400" />
                                </div>
                                <h3 className="text-white font-black text-lg leading-snug">Log to health tracker?</h3>
                                <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                                    Add your ordered meals to today&apos;s food log automatically.
                                </p>
                            </div>
                            <div className="p-4 space-y-2.5">
                                <Button
                                    onClick={() => completeOrder(true)}
                                    disabled={isLogging}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black h-12 rounded-2xl text-sm shadow-lg shadow-orange-200"
                                >
                                    {isLogging ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Check className="w-4 h-4 mr-2" />
                                    )}
                                    Yes, log to tracker
                                </Button>
                                <button
                                    onClick={() => completeOrder(false)}
                                    disabled={isLogging}
                                    className="w-full h-11 rounded-2xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <X className="w-3.5 h-3.5" /> Skip
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
        </>
    );
}
