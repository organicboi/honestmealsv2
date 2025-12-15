'use client';

import { useState, useEffect } from 'react';
import { X, Share, Plus, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function AddToHomeScreen() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed or dismissed
        const dismissed = localStorage.getItem('a2hs_dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

        // Don't show if dismissed within last 7 days
        if (daysSinceDismissed < 7) return;

        // Check if running as standalone PWA
        const standalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        if (standalone) return;

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // Listen for beforeinstallprompt (Chrome, Edge, etc.)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Show prompt after 20 seconds
        const timer = setTimeout(() => {
            // Only show if we have install prompt OR it's iOS
            if (deferredPrompt || isIOSDevice) {
                setShowPrompt(true);
            }
        }, 20000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            clearTimeout(timer);
        };
    }, [deferredPrompt]);

    // Re-check after deferredPrompt is set
    useEffect(() => {
        if (deferredPrompt && !isStandalone) {
            const dismissed = localStorage.getItem('a2hs_dismissed');
            const dismissedTime = dismissed ? parseInt(dismissed) : 0;
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

            if (daysSinceDismissed >= 7) {
                const timer = setTimeout(() => {
                    setShowPrompt(true);
                }, 20000);
                return () => clearTimeout(timer);
            }
        }
    }, [deferredPrompt, isStandalone]);

    const handleInstall = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setShowPrompt(false);
                setDeferredPrompt(null);
            }
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('a2hs_dismissed', Date.now().toString());
    };

    if (!showPrompt || isStandalone) return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                >
                    <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <Download className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Install HonestMeals</h3>
                                    <p className="text-sm text-gray-500">Add to your home screen</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {isIOS ? (
                            // iOS instructions
                            <div className="bg-gray-50 rounded-xl p-3 mb-3">
                                <p className="text-sm text-gray-600 mb-2">To install this app:</p>
                                <ol className="text-sm text-gray-600 space-y-1">
                                    <li className="flex items-center gap-2">
                                        <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
                                        Tap <Share className="w-4 h-4 inline text-blue-500" /> Share button
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
                                        Tap <Plus className="w-4 h-4 inline" /> Add to Home Screen
                                    </li>
                                </ol>
                            </div>
                        ) : (
                            // Chrome/Android install button
                            <p className="text-sm text-gray-600 mb-3">
                                Get quick access to meals, track your health, and never miss a workout!
                            </p>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={handleDismiss}
                                className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Not now
                            </button>
                            {!isIOS && deferredPrompt && (
                                <button
                                    onClick={handleInstall}
                                    className="flex-1 py-2.5 px-4 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
                                >
                                    Install App
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
