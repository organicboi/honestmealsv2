'use client';

import { motion } from 'framer-motion';
import { Dumbbell, Calendar, Clock, Target, TrendingUp, Shield } from 'lucide-react';
import type { WorkoutPlanData } from '@/types/gymna.types';

interface WorkoutPlanTableProps {
    data: WorkoutPlanData;
}

export default function WorkoutPlanTable({ data }: WorkoutPlanTableProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Plan Header */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-200">
                <div className="flex items-center gap-3 mb-4">
                    <Dumbbell className="h-8 w-8" />
                    <h2 className="text-2xl font-bold">{data.title}</h2>
                </div>
                
                {/* Plan Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                        <div className="text-white/80 text-xs mb-1">Goal</div>
                        <div className="text-sm font-bold">{data.goalType}</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                        <div className="text-white/80 text-xs mb-1">Level</div>
                        <div className="text-sm font-bold">{data.experienceLevel}</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                        <div className="text-white/80 text-xs mb-1">Days/Week</div>
                        <div className="text-sm font-bold">{data.daysPerWeek}</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                        <div className="text-white/80 text-xs mb-1">Equipment</div>
                        <div className="text-sm font-bold">{data.equipment}</div>
                    </div>
                </div>
            </div>

            {/* Workout Days */}
            <div className="space-y-4">
                {data.schedule.map((day, index) => (
                    <div key={index} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                    <h3 className="text-xl font-bold text-gray-900">{day.day}</h3>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Target className="h-4 w-4" />
                                        {day.focus}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {day.duration}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Warmup */}
                        {day.warmup && day.warmup.length > 0 && (
                            <div className="mb-4 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                                <div className="font-bold text-gray-900 text-sm mb-2">Warmup</div>
                                <ul className="space-y-1 text-sm text-gray-700">
                                    {day.warmup.map((exercise, i) => (
                                        <li key={i}>• {exercise}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Exercises Table */}
                        <div className="overflow-x-auto mb-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="text-left py-3 px-2 font-bold text-gray-700">Exercise</th>
                                        <th className="text-center py-3 px-2 font-bold text-gray-700">Sets</th>
                                        <th className="text-center py-3 px-2 font-bold text-gray-700">Reps</th>
                                        <th className="text-center py-3 px-2 font-bold text-gray-700">Rest</th>
                                        <th className="text-left py-3 px-2 font-bold text-gray-700">Target</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {day.exercises.map((exercise, exerciseIndex) => (
                                        <tr key={exerciseIndex} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-2">
                                                <div className="font-medium text-gray-900">{exercise.exerciseName}</div>
                                                {exercise.notes && (
                                                    <div className="text-xs text-gray-500 mt-1">{exercise.notes}</div>
                                                )}
                                            </td>
                                            <td className="py-3 px-2 text-center font-bold text-blue-600">{exercise.sets}</td>
                                            <td className="py-3 px-2 text-center text-gray-900">{exercise.reps}</td>
                                            <td className="py-3 px-2 text-center text-gray-600">{exercise.rest}</td>
                                            <td className="py-3 px-2 text-gray-600">{exercise.targetMuscle || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Cooldown */}
                        {day.cooldown && day.cooldown.length > 0 && (
                            <div className="mb-3 p-3 bg-green-50 rounded-xl border border-green-100">
                                <div className="font-bold text-gray-900 text-sm mb-2">Cooldown</div>
                                <ul className="space-y-1 text-sm text-gray-700">
                                    {day.cooldown.map((exercise, i) => (
                                        <li key={i}>• {exercise}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {day.notes && (
                            <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-900">
                                <span className="font-semibold">Note: </span>{day.notes}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Guidelines */}
            {data.guidelines && data.guidelines.length > 0 && (
                <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Training Guidelines</h3>
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

            {/* Progression Tips */}
            {data.progressionTips && data.progressionTips.length > 0 && (
                <div className="bg-green-50 rounded-3xl p-6 border border-green-100">
                    <div className="flex items-center gap-3 mb-3">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                        <h3 className="text-lg font-bold text-gray-900">Progression Tips</h3>
                    </div>
                    <ul className="space-y-2 text-gray-700">
                        {data.progressionTips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span className="text-green-600 font-bold mt-0.5">•</span>
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Injury Prevention */}
            {data.injuryPrevention && data.injuryPrevention.length > 0 && (
                <div className="bg-red-50 rounded-3xl p-6 border border-red-100">
                    <div className="flex items-center gap-3 mb-3">
                        <Shield className="h-6 w-6 text-red-600" />
                        <h3 className="text-lg font-bold text-gray-900">Injury Prevention</h3>
                    </div>
                    <ul className="space-y-2 text-gray-700">
                        {data.injuryPrevention.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span className="text-red-600 font-bold mt-0.5">•</span>
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </motion.div>
    );
}
