'use client';

import { motion } from 'framer-motion';
import { Utensils, Clock, Flame, Beef, Wheat, Droplet, Pill } from 'lucide-react';
import type { DietPlanData } from '@/types/gymna.types';

interface DietPlanTableProps {
    data: DietPlanData;
}

export default function DietPlanTable({ data }: DietPlanTableProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Plan Header */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-3xl p-6 text-white shadow-lg shadow-green-200">
                <div className="flex items-center gap-3 mb-4">
                    <Utensils className="h-8 w-8" />
                    <h2 className="text-2xl font-bold">{data.title}</h2>
                </div>
                <p className="text-green-100 mb-4">{data.goalType}</p>
                
                {/* Daily Totals */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                        <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
                            <Flame className="h-3 w-3" />
                            Calories
                        </div>
                        <div className="text-xl font-bold">{data.totalDailyCalories}</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                        <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
                            <Beef className="h-3 w-3" />
                            Protein
                        </div>
                        <div className="text-xl font-bold">{data.totalDailyProtein}g</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                        <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
                            <Wheat className="h-3 w-3" />
                            Carbs
                        </div>
                        <div className="text-xl font-bold">{data.totalDailyCarbs}g</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                        <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
                            <Droplet className="h-3 w-3" />
                            Fat
                        </div>
                        <div className="text-xl font-bold">{data.totalDailyFat}g</div>
                    </div>
                </div>
            </div>

            {/* Meals */}
            <div className="space-y-4">
                {data.meals.map((meal, index) => (
                    <div key={index} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{meal.mealName}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                    <Clock className="h-4 w-4" />
                                    {meal.time}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-orange-600">{meal.totalCalories}</div>
                                <div className="text-xs text-gray-500">calories</div>
                            </div>
                        </div>

                        {/* Food Items Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-2 px-2 font-bold text-gray-700">Food Item</th>
                                        <th className="text-left py-2 px-2 font-bold text-gray-700">Quantity</th>
                                        <th className="text-right py-2 px-2 font-bold text-gray-700">Cal</th>
                                        <th className="text-right py-2 px-2 font-bold text-gray-700">P</th>
                                        <th className="text-right py-2 px-2 font-bold text-gray-700">C</th>
                                        <th className="text-right py-2 px-2 font-bold text-gray-700">F</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {meal.foods.map((food, foodIndex) => (
                                        <tr key={foodIndex} className="border-b border-gray-50">
                                            <td className="py-3 px-2 text-gray-900">{food.item}</td>
                                            <td className="py-3 px-2 text-gray-600">{food.quantity}</td>
                                            <td className="py-3 px-2 text-right text-gray-900 font-medium">{food.calories}</td>
                                            <td className="py-3 px-2 text-right text-gray-600">{food.protein}g</td>
                                            <td className="py-3 px-2 text-right text-gray-600">{food.carbs}g</td>
                                            <td className="py-3 px-2 text-right text-gray-600">{food.fat}g</td>
                                        </tr>
                                    ))}
                                    {/* Totals Row */}
                                    <tr className="bg-gray-50 font-bold">
                                        <td className="py-3 px-2 text-gray-900" colSpan={2}>Total</td>
                                        <td className="py-3 px-2 text-right text-orange-600">{meal.totalCalories}</td>
                                        <td className="py-3 px-2 text-right text-gray-900">{meal.totalProtein}g</td>
                                        <td className="py-3 px-2 text-right text-gray-900">{meal.totalCarbs}g</td>
                                        <td className="py-3 px-2 text-right text-gray-900">{meal.totalFat}g</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {meal.notes && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-xl text-sm text-blue-900">
                                <span className="font-semibold">Note: </span>{meal.notes}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Hydration */}
            {data.hydration && (
                <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                        <Droplet className="h-6 w-6 text-blue-600" />
                        <h3 className="text-lg font-bold text-gray-900">Hydration</h3>
                    </div>
                    <p className="text-gray-900 font-medium mb-2">
                        Daily Water Intake: <span className="text-blue-600">{data.hydration.dailyWaterIntake}</span>
                    </p>
                    {data.hydration.tips && data.hydration.tips.length > 0 && (
                        <ul className="space-y-1 text-sm text-gray-600">
                            {data.hydration.tips.map((tip, index) => (
                                <li key={index}>• {tip}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Supplements */}
            {data.supplements && data.supplements.length > 0 && (
                <div className="bg-purple-50 rounded-3xl p-6 border border-purple-100">
                    <div className="flex items-center gap-3 mb-4">
                        <Pill className="h-6 w-6 text-purple-600" />
                        <h3 className="text-lg font-bold text-gray-900">Supplements</h3>
                    </div>
                    <div className="space-y-3">
                        {data.supplements.map((supplement, index) => (
                            <div key={index} className="bg-white rounded-xl p-4 border border-purple-100">
                                <div className="font-bold text-gray-900">{supplement.name}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                    <span className="font-medium">Timing:</span> {supplement.timing}
                                </div>
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">Purpose:</span> {supplement.purpose}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Guidelines */}
            {data.guidelines && data.guidelines.length > 0 && (
                <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Important Guidelines</h3>
                    <ul className="space-y-2 text-gray-700">
                        {data.guidelines.map((guideline, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span className="text-orange-600 font-bold mt-0.5">•</span>
                                <span>{guideline}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </motion.div>
    );
}
