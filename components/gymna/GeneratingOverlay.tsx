'use client';

import { motion } from 'framer-motion';
import { Loader2, Bot, Sparkles } from 'lucide-react';

interface GeneratingOverlayProps {
    planType: 'diet' | 'workout';
}

export default function GeneratingOverlay({ planType }: GeneratingOverlayProps) {
    const messages = [
        'Analyzing your requirements...',
        'Consulting nutritional databases...',
        'Calculating optimal macros...',
        'Crafting your personalized plan...',
        'Almost ready...'
    ];

    const workoutMessages = [
        'Analyzing your fitness goals...',
        'Designing workout structure...',
        'Selecting optimal exercises...',
        'Calculating sets and reps...',
        'Almost ready...'
    ];

    const displayMessages = planType === 'diet' ? messages : workoutMessages;

    return (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            >
                {/* Icon with animation */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-6"
                >
                    <Bot className="h-10 w-10 text-white" />
                </motion.div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Generating Your {planType === 'diet' ? 'Diet' : 'Workout'} Plan
                </h2>
                
                {/* Subtitle */}
                <p className="text-gray-600 mb-6">
                    Please wait while Gymna creates your personalized plan. This may take a moment...
                </p>

                {/* Spinner */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                    <Sparkles className="h-6 w-6 text-orange-400 animate-pulse" />
                </div>

                {/* Rotating messages */}
                <div className="h-6">
                    {displayMessages.map((message, index) => (
                        <motion.p
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                y: [10, 0, 0, -10]
                            }}
                            transition={{
                                duration: 3,
                                delay: index * 3,
                                repeat: Math.floor(20 / displayMessages.length),
                                ease: "easeInOut"
                            }}
                            className="text-sm text-gray-500 font-medium absolute left-0 right-0"
                        >
                            {message}
                        </motion.p>
                    ))}
                </div>

                {/* Progress bar */}
                <div className="mt-8">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{
                                duration: 20,
                                ease: "easeInOut"
                            }}
                            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                        />
                    </div>
                </div>

                {/* Warning message */}
                <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-xs text-orange-900">
                        ⚠️ Please do not close or refresh this page. Your credit has been deducted and will be refunded only if generation fails.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
