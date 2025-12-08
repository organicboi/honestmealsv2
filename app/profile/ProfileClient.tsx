'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Mail, Phone, MapPin, Calendar, 
    Activity, Target, Utensils, Flame, Clock,
    LogOut, ArrowLeft, Save, ChevronRight,
    ShoppingBag, Heart, Star, Award,
    Settings, Shield, HelpCircle, Bell
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { signout } from '@/app/actions/auth';
import { updateProfileAction } from '@/app/actions/profile';
import type { ProfileWithStats, GoalType, FoodType, ActivityLevel } from '@/types/database.types';

interface ProfileClientProps {
    user: any;
    profile: ProfileWithStats | null;
}

type ViewState = 'main' | 'personal' | 'health' | 'preferences';

export default function ProfileClient({ user, profile }: ProfileClientProps) {
    const router = useRouter();
    const [currentView, setCurrentView] = useState<ViewState>('main');
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: profile?.name || '',
        phone_number: profile?.phone_number || '',
        address: profile?.address || '',
        age: profile?.age || '',
        weight: profile?.weight || '',
        height: profile?.height || '',
        goal_type: profile?.goal_type || 'maintain_weight',
        activity_level: profile?.activity_level || 'moderately_active',
        food_type: profile?.food_type || 'no_preference',
        spice_level: profile?.spice_level || 3,
        delivery_time: profile?.delivery_time || 'morning',
        meals_per_day: profile?.meals_per_day || 3
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                phone_number: profile.phone_number || '',
                address: profile.address || '',
                age: profile.age || '',
                weight: profile.weight || '',
                height: profile.height || '',
                goal_type: profile.goal_type || 'maintain_weight',
                activity_level: profile.activity_level || 'moderately_active',
                food_type: profile.food_type || 'no_preference',
                spice_level: profile.spice_level || 3,
                delivery_time: profile.delivery_time || 'morning',
                meals_per_day: profile.meals_per_day || 3
            });
        }
    }, [profile]);

    const handleSignOut = async () => {
        await signout();
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updateProfileAction({
                name: formData.name,
                phone_number: formData.phone_number,
                address: formData.address,
                age: Number(formData.age) || null,
                weight: Number(formData.weight) || null,
                height: Number(formData.height) || null,
                goal_type: formData.goal_type as GoalType,
                activity_level: formData.activity_level as ActivityLevel,
                food_type: formData.food_type as FoodType,
                spice_level: Number(formData.spice_level),
                delivery_time: formData.delivery_time as any,
                meals_per_day: Number(formData.meals_per_day)
            });

            if (result.success) {
                setCurrentView('main');
                // Ideally show a toast here
            } else {
                console.error(result.error);
            }
        } catch (error) {
            console.error('Failed to save profile', error);
        } finally {
            setIsSaving(false);
        }
    };

    const stats = [
        { label: 'Orders', value: profile?.orders?.length || 0, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Favorites', value: profile?.favorites?.length || 0, icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Points', value: profile?.total_rewards_earned || 0, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    const menuItems = [
        {
            id: 'personal',
            title: 'Personal Information',
            subtitle: 'Name, phone, address',
            icon: User,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            id: 'health',
            title: 'Health & Goals',
            subtitle: 'Body stats, activity level',
            icon: Activity,
            color: 'text-red-600',
            bg: 'bg-red-100'
        },
        {
            id: 'preferences',
            title: 'Food Preferences',
            subtitle: 'Diet type, spice level',
            icon: Utensils,
            color: 'text-orange-600',
            bg: 'bg-orange-100'
        }
    ];

    const renderHeader = (title: string, showBack = true) => (
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {showBack && (
                    <button 
                        onClick={() => setCurrentView('main')}
                        className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                )}
                <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            </div>
            {currentView !== 'main' && (
                <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 h-8 text-xs font-bold"
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
            )}
        </div>
    );

    if (currentView === 'personal') {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                {renderHeader('Personal Info')}
                <div className="p-4 space-y-6 max-w-2xl mx-auto">
                    <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                            <Input
                                value={formData.phone_number}
                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                placeholder="Enter your phone number"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                            <Input
                                value={user.email}
                                disabled
                                className="bg-gray-100 border-gray-200 text-gray-500"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Delivery Address</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full min-h-[120px] rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all resize-none"
                                placeholder="Enter your full delivery address"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (currentView === 'health') {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                {renderHeader('Health & Goals')}
                <div className="p-4 space-y-6 max-w-2xl mx-auto">
                    <div className="bg-white p-4 rounded-2xl shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Body Stats</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-500">Age</label>
                                <Input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    className="bg-gray-50 border-gray-200 text-center"
                                    placeholder="-"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-500">Weight (kg)</label>
                                <Input
                                    type="number"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    className="bg-gray-50 border-gray-200 text-center"
                                    placeholder="-"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-500">Height (cm)</label>
                                <Input
                                    type="number"
                                    value={formData.height}
                                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                    className="bg-gray-50 border-gray-200 text-center"
                                    placeholder="-"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900">Goals & Activity</h3>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fitness Goal</label>
                            <select
                                value={formData.goal_type}
                                onChange={(e) => setFormData({ ...formData, goal_type: e.target.value as GoalType })}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="lose_weight">Lose Weight</option>
                                <option value="gain_weight">Gain Weight</option>
                                <option value="maintain_weight">Maintain Weight</option>
                                <option value="build_muscle">Build Muscle</option>
                                <option value="manage_health">Manage Health</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Activity Level</label>
                            <select
                                value={formData.activity_level}
                                onChange={(e) => setFormData({ ...formData, activity_level: e.target.value as ActivityLevel })}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="sedentary">Sedentary (Little or no exercise)</option>
                                <option value="lightly_active">Lightly Active (1-3 days/week)</option>
                                <option value="moderately_active">Moderately Active (3-5 days/week)</option>
                                <option value="very_active">Very Active (6-7 days/week)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (currentView === 'preferences') {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                {renderHeader('Food Preferences')}
                <div className="p-4 space-y-6 max-w-2xl mx-auto">
                    <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dietary Preference</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['no_preference', 'veg', 'non_veg', 'vegan'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFormData({ ...formData, food_type: type as FoodType })}
                                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                                            formData.food_type === type
                                                ? 'border-green-500 bg-green-50 text-green-700'
                                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Spice Level</label>
                                <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                                    {formData.spice_level}/5
                                </span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={formData.spice_level}
                                onChange={(e) => setFormData({ ...formData, spice_level: Number(e.target.value) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                            />
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Mild</span>
                                <span>Medium</span>
                                <span>Hot</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preferred Delivery Time</label>
                            <select
                                value={formData.delivery_time}
                                onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value as any })}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="morning">Morning (8am - 11am)</option>
                                <option value="afternoon">Afternoon (12pm - 3pm)</option>
                                <option value="evening">Evening (6pm - 9pm)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Meals Per Day</label>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {[1, 2, 3, 4, 5, 6].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => setFormData({ ...formData, meals_per_day: num })}
                                        className={`w-10 h-10 shrink-0 rounded-full border flex items-center justify-center text-sm font-bold transition-all ${
                                            formData.meals_per_day === num
                                                ? 'border-green-500 bg-green-600 text-white'
                                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main View
    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
            {/* Profile Header */}
            <div className="bg-white pb-6 pt-8 px-4 rounded-b-3xl shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-linear-to-br from-green-400 to-emerald-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                            {profile?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-gray-900 truncate">
                            {profile?.name || 'Welcome!'}
                        </h1>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-0">
                                Free Member
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {stats.map((stat, index) => (
                        <div key={index} className={`${stat.bg} p-3 rounded-2xl flex flex-col items-center justify-center text-center`}>
                            <stat.icon className={`h-5 w-5 ${stat.color} mb-1`} />
                            <span className="text-lg font-bold text-gray-900">{stat.value}</span>
                            <span className="text-xs text-gray-500">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Menu List */}
            <div className="p-4 max-w-2xl mx-auto space-y-6">
                <div className="space-y-2">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider px-2">Account Settings</h2>
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        {menuItems.map((item, index) => (
                            <button
                                key={item.id}
                                onClick={() => setCurrentView(item.id as ViewState)}
                                className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left ${
                                    index !== menuItems.length - 1 ? 'border-b border-gray-50' : ''
                                }`}
                            >
                                <div className={`p-2 rounded-full ${item.bg}`}>
                                    <item.icon className={`h-5 w-5 ${item.color}`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                                    <p className="text-xs text-gray-500">{item.subtitle}</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-300" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider px-2">Support & More</h2>
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50">
                            <div className="p-2 rounded-full bg-purple-50">
                                <Bell className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-300" />
                        </button>
                        <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50">
                            <div className="p-2 rounded-full bg-gray-100">
                                <HelpCircle className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-sm">Help & Support</h3>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-300" />
                        </button>
                        <button 
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors text-left group"
                        >
                            <div className="p-2 rounded-full bg-red-50 group-hover:bg-red-100 transition-colors">
                                <LogOut className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-600 text-sm">Log Out</h3>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="text-center text-xs text-gray-400 py-4">
                    Version 2.0.1 • Honest Meals
                </div>
            </div>
        </div>
    );
}
