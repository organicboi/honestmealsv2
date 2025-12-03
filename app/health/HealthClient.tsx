'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Heart, Flame, Droplets, Moon, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HealthClientProps {
    user: any;
}

export default function HealthClient({ user }: HealthClientProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'nutrition' | 'hydration' | 'sleep'>('overview');

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">Health Tracking</h1>
                    <p className="text-sm text-gray-600">Monitor your wellness journey</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl p-4 shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Flame className="h-8 w-8 text-orange-500" />
                            <span className="text-xs text-gray-500">Today</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">1,847</p>
                        <p className="text-sm text-gray-600">Calories</p>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full" style={{ width: '73%' }}></div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl p-4 shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Droplets className="h-8 w-8 text-blue-500" />
                            <span className="text-xs text-gray-500">8 glasses</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">6/8</p>
                        <p className="text-sm text-gray-600">Water</p>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl p-4 shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Moon className="h-8 w-8 text-purple-500" />
                            <span className="text-xs text-gray-500">Goal: 8h</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">7.5h</p>
                        <p className="text-sm text-gray-600">Sleep</p>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '93%' }}></div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl p-4 shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Heart className="h-8 w-8 text-red-500" />
                            <span className="text-xs text-gray-500">BPM</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">72</p>
                        <p className="text-sm text-gray-600">Heart Rate</p>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                    </motion.div>
                </div>

                {/* Coming Soon Section */}
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <Activity className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Health Tracking Coming Soon</h2>
                    <p className="text-gray-600 mb-6">
                        We're building an amazing health tracking experience for you. Track calories, water intake, 
                        sleep patterns, and more!
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <div className="flex items-center gap-2 text-gray-700">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <span>Progress Analytics</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="h-5 w-5 text-green-600" />
                            <span>Daily Logs</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <Heart className="h-5 w-5 text-green-600" />
                            <span>Health Metrics</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
