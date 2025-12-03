'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Zap, Target, Trophy, Calendar, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkoutClientProps {
    user: any;
}

export default function WorkoutClient({ user }: WorkoutClientProps) {
    return (
        <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-orange-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">Workout Plans</h1>
                    <p className="text-sm text-gray-600">Stay fit, stay strong</p>
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
                            <Zap className="h-8 w-8 text-yellow-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">245</p>
                        <p className="text-sm text-gray-600">Active Minutes</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl p-4 shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Target className="h-8 w-8 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">12/15</p>
                        <p className="text-sm text-gray-600">Workouts</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl p-4 shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Trophy className="h-8 w-8 text-orange-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">8</p>
                        <p className="text-sm text-gray-600">Streak Days</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl p-4 shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="h-8 w-8 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">42m</p>
                        <p className="text-sm text-gray-600">Avg Duration</p>
                    </motion.div>
                </div>

                {/* Coming Soon Section */}
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <Dumbbell className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Workout Plans Coming Soon</h2>
                    <p className="text-gray-600 mb-6">
                        Get ready for personalized workout plans, exercise tracking, and fitness goals. 
                        We're building something amazing for your fitness journey!
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <div className="flex items-center gap-2 text-gray-700">
                            <Target className="h-5 w-5 text-orange-600" />
                            <span>Custom Plans</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="h-5 w-5 text-orange-600" />
                            <span>Workout Calendar</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <TrendingUp className="h-5 w-5 text-orange-600" />
                            <span>Progress Tracking</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
