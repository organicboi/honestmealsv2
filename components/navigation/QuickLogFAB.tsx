'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Droplets, Utensils, Dumbbell, Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useNavVisibility } from '@/context/NavVisibilityContext';
import { logWater } from '@/app/actions/health';
import { toast } from 'sonner';

// Routes where the FAB should NOT appear
const HIDE_ON = ['/honestask', '/onboarding', '/sign-in', '/sign-up', '/checkout', '/admin', '/auth', '/forgot-password', '/unauthorized'];

type FABState = 'closed' | 'open' | 'water';

export default function QuickLogFAB() {
    const pathname   = usePathname();
    const router     = useRouter();
    const { navVisible } = useNavVisibility();
    const [state,   setState]   = useState<FABState>('closed');
    const [logging, setLogging] = useState(false);

    // Hide on specific routes
    if (HIDE_ON.some(r => pathname?.startsWith(r))) return null;

    const close = () => setState('closed');

    const handleWaterLog = async (ml: number) => {
        setLogging(true);
        try {
            await logWater(ml);
            toast.success(`💧 +${ml < 1000 ? ml + 'ml' : '1L'} logged`);
            close();
        } catch {
            toast.error('Failed to log water');
        } finally {
            setLogging(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {state !== 'closed' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
                        onClick={close}
                    />
                )}
            </AnimatePresence>

            {/* Quick-action sheet */}
            <AnimatePresence mode="wait">
                {state === 'open' && (
                    <motion.div
                        key="open"
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                        className={`fixed left-4 right-4 z-50 max-w-md mx-auto transition-all duration-300 ${navVisible ? 'bottom-24' : 'bottom-20'}`}
                    >
                        <div className="bg-white rounded-3xl p-4 shadow-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Quick Log</p>
                            <div className="grid grid-cols-3 gap-2">
                                {/* Water */}
                                <button
                                    onClick={() => setState('water')}
                                    className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-blue-50 border border-blue-100 active:scale-95 transition-transform"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm shadow-blue-200">
                                        <Droplets className="w-5 h-5 text-white fill-white" />
                                    </div>
                                    <span className="text-xs font-bold text-blue-800">Water</span>
                                </button>
                                {/* Meal */}
                                <button
                                    onClick={() => { close(); router.push('/health/log-food'); }}
                                    className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-orange-50 border border-orange-100 active:scale-95 transition-transform"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm shadow-orange-200">
                                        <Utensils className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-orange-800">Meal</span>
                                </button>
                                {/* Workout */}
                                <button
                                    onClick={() => { close(); router.push('/workout'); }}
                                    className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-purple-50 border border-purple-100 active:scale-95 transition-transform"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-purple-600 flex items-center justify-center shadow-sm shadow-purple-200">
                                        <Dumbbell className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-purple-800">Workout</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Water quick-log sub-sheet */}
                {state === 'water' && (
                    <motion.div
                        key="water"
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                        className={`fixed left-4 right-4 z-50 max-w-md mx-auto transition-all duration-300 ${navVisible ? 'bottom-24' : 'bottom-20'}`}
                    >
                        <div className="bg-white rounded-3xl p-4 shadow-2xl border border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Droplets className="w-4 h-4 text-blue-500 fill-blue-500" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Log Water</p>
                                </div>
                                <button onClick={() => setState('open')} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {[250, 500, 750, 1000].map(ml => (
                                    <button
                                        key={ml}
                                        onClick={() => handleWaterLog(ml)}
                                        disabled={logging}
                                        className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-blue-50 border border-blue-100 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {logging ? (
                                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                        ) : (
                                            <Droplets className="w-4 h-4 text-blue-500 fill-blue-500" />
                                        )}
                                        <span className="text-xs font-black text-blue-700 leading-none">
                                            {ml < 1000 ? `${ml}ml` : '1L'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* The FAB button itself */}
            <motion.button
                animate={{ rotate: state !== 'closed' ? 45 : 0 }}
                transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setState(s => s === 'closed' ? 'open' : 'closed')}
                className={`
                    fixed right-4 z-50 w-14 h-14 rounded-2xl
                    bg-linear-to-br from-orange-500 to-red-500
                    text-white flex items-center justify-center
                    shadow-xl shadow-orange-400/40
                    transition-[bottom] duration-300
                    ${navVisible ? 'bottom-20' : 'bottom-4'}
                `}
                aria-label="Quick log"
            >
                <Plus className="w-7 h-7" strokeWidth={2.5} />
            </motion.button>
        </>
    );
}
