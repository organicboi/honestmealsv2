'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string | null;
    description?: string | null;
    food_type?: 'vegetarian' | 'non-vegetarian';
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: Omit<CartItem, 'quantity'>) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    cartTotalItems: number;
    cartTotalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    // Load cart from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('honest_meals_cart');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error('Failed to parse cart from local storage', e);
            }
        }
    }, []);

    // Save cart to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('honest_meals_cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (newItem: Omit<CartItem, 'quantity'>) => {
        setItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === newItem.id);
            if (existingItem) {
                return prevItems.map(item => 
                    item.id === newItem.id 
                        ? { ...item, quantity: item.quantity + 1 } 
                        : item
                );
            } else {
                return [...prevItems, { ...newItem, quantity: 1 }];
            }
        });
    };

    const removeFromCart = (itemId: string) => {
        setItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === itemId);
            if (existingItem && existingItem.quantity > 1) {
                return prevItems.map(item => 
                    item.id === itemId 
                        ? { ...item, quantity: item.quantity - 1 } 
                        : item
                );
            } else {
                return prevItems.filter(item => item.id !== itemId);
            }
        });
    };

    const clearCart = () => {
        setItems([]);
    };

    const cartTotalItems = items.reduce((total, item) => total + item.quantity, 0);
    const cartTotalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ 
            items, 
            addToCart, 
            removeFromCart, 
            clearCart, 
            cartTotalItems, 
            cartTotalPrice 
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
