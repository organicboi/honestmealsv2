'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import {
    Flame, Droplets, Dumbbell, ShoppingBag,
    ChevronRight, Plus,
    Activity, Target, Scale, Sparkles,
} from 'lucide-react';
import type { DashboardData, CuratedPrompt } from '@/app/actions/dashboard';

// ─── Stagger variants ────────────────────────────────────────────────────────
const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0,  transition: { type: 'spring', damping: 22, stiffness: 300 } },
};

// ─── Ring progress ──────────────────────────────────────────────────────────
function RingProgress({
    value, max, color, size = 72, strokeWidth = 7,
}: { value: number; max: number; color: string; size?: number; strokeWidth?: number }) {
    const radius = (size - strokeWidth) / 2;
    const circ   = 2 * Math.PI * radius;
    const pct    = Math.min(value / Math.max(max, 1), 1);
    const dash   = circ * pct;
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke="#f3f4f6" strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
        </svg>
    );
}

// ─── Mini weight sparkline ──────────────────────────────────────────────────
function WeightSparkline({ logs }: { logs: { weight: number; log_date: string }[] }) {
    if (logs.length < 2) return null;
    const weights = logs.map(l => l.weight);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const range = maxW - minW || 1;
    const w = 200, h = 48;
    const pts = weights.map((wt, i) => {
        const x = (i / (weights.length - 1)) * w;
        const y = h - ((wt - minW) / range) * (h - 8) - 4;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
            <polyline points={pts} fill="none" stroke="#f97316" strokeWidth="2.5"
                strokeLinejoin="round" strokeLinecap="round" />
            {/* Shade under line */}
            <polygon
                points={`0,${h} ${pts} ${w},${h}`}
                fill="url(#sparkGrad)" opacity="0.15"
            />
            <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
            </defs>
        </svg>
    );
}

// ─── Greeting helper ────────────────────────────────────────────────────────
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

const GOAL_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
    lose_weight:     { label: 'Losing fat', emoji: '🔥', color: '#ef4444' },
    build_muscle:    { label: 'Building muscle', emoji: '💪', color: '#8b5cf6' },
    gain_weight:     { label: 'Gaining weight', emoji: '📈', color: '#3b82f6' },
    maintain_weight: { label: 'Staying fit', emoji: '⚖️', color: '#10b981' },
    manage_health:   { label: 'Improving health', emoji: '🫀', color: '#f59e0b' },
};

// ─── Main component ─────────────────────────────────────────────────────────

interface DashboardClientProps {
    data: DashboardData;
    prompts: CuratedPrompt[];
}

export default function DashboardClient({ data, prompts }: DashboardClientProps) {
    const router = useRouter();
    const { profile, today, streak, weight, recentOrders } = data;

    const greeting  = getGreeting();
    const firstName = (profile.name ?? 'there').split(' ')[0];
    const goal      = GOAL_LABELS[profile.goal_type ?? ''] ?? GOAL_LABELS.manage_health;

    // Weight progress % toward goal
    const weightProgressPct = (() => {
        if (!weight.start || !weight.goal || !weight.current) return null;
        const total   = Math.abs(weight.start - weight.goal);
        const covered = Math.abs(weight.start - weight.current);
        return Math.min(Math.round((covered / total) * 100), 100);
    })();

    const handlePrompt = (prompt: CuratedPrompt) => {
        router.push(`/honestask?prompt=${encodeURIComponent(prompt.text)}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-28">
            <motion.div
                className="max-w-md mx-auto px-4 pt-6 space-y-4"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {/* ── HERO GREETING ─────────────────────────────── */}
                <motion.div variants={item}>
                    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 via-orange-400 to-amber-400 p-5 text-white shadow-lg shadow-orange-200">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                            <div className="w-full h-full rounded-full border-20 border-white -translate-y-8 translate-x-8" />
                        </div>

                        <div className="relative z-10">
                            <p className="text-sm text-orange-100 font-medium">{greeting}</p>
                            <h1 className="text-2xl font-bold mt-0.5">{firstName} 👋</h1>

                            {/* Goal badge */}
                            <div className="flex items-center gap-2 mt-3">
                                <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold">
                                    <span>{goal.emoji}</span>
                                    <span>{goal.label}</span>
                                </span>
                                {streak.current > 0 && (
                                    <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold">
                                        <Flame className="h-3 w-3" />
                                        <span>{streak.current} day streak</span>
                                    </span>
                                )}
                            </div>

                            {/* Weight to goal */}
                            {weightProgressPct !== null && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-xs text-orange-100 mb-1.5">
                                        <span>Progress to goal</span>
                                        <span className="font-bold text-white">{weightProgressPct}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/25 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-white rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${weightProgressPct}%` }}
                                            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ── TODAY'S PROGRESS ──────────────────────────── */}
                <motion.div variants={item}>
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            Today's Progress
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            {/* Calories */}
                            <div className="flex flex-col items-center gap-1">
                                <div className="relative">
                                    <RingProgress
                                        value={today.calories.current}
                                        max={today.calories.goal}
                                        color="#f97316"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Flame className="h-4 w-4 text-orange-500" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-900 leading-tight">
                                        {today.calories.current.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        / {today.calories.goal.toLocaleString()} cal
                                    </p>
                                </div>
                            </div>
                            {/* Protein */}
                            <div className="flex flex-col items-center gap-1">
                                <div className="relative">
                                    <RingProgress
                                        value={today.protein.current}
                                        max={today.protein.goal}
                                        color="#8b5cf6"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Dumbbell className="h-4 w-4 text-purple-500" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-900 leading-tight">
                                        {today.protein.current}g
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        / {today.protein.goal}g protein
                                    </p>
                                </div>
                            </div>
                            {/* Water */}
                            <div className="flex flex-col items-center gap-1">
                                <div className="relative">
                                    <RingProgress
                                        value={today.water.current}
                                        max={today.water.goal}
                                        color="#3b82f6"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Droplets className="h-4 w-4 text-blue-500" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-900 leading-tight">
                                        {(today.water.current / 1000).toFixed(1)}L
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        / {(today.water.goal / 1000).toFixed(1)}L water
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Quick link to detailed health page */}
                        <Link href="/health"
                            className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-gray-50 text-xs text-orange-500 font-medium">
                            View detailed breakdown <ChevronRight className="h-3 w-3" />
                        </Link>
                    </div>
                </motion.div>

                {/* ── CURATED AI PROMPTS ────────────────────────── */}
                <motion.div variants={item}>
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-linear-to-br from-orange-500 to-amber-400 flex items-center justify-center">
                                    <Sparkles className="h-3.5 w-3.5 text-white" />
                                </div>
                                <p className="text-sm font-bold text-gray-900">Ask AI</p>
                            </div>
                            <Link href="/honestask"
                                className="text-xs text-orange-500 font-medium flex items-center gap-0.5">
                                Open chat <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">
                            Personalised for your {goal.label.toLowerCase()} goal
                        </p>
                        <div className="space-y-2">
                            {prompts.slice(0, 5).map((prompt, idx) => (
                                <motion.button
                                    key={prompt.id}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + idx * 0.05 }}
                                    onClick={() => handlePrompt(prompt)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-gray-50 hover:bg-orange-50 active:bg-orange-100 text-left transition-colors group"
                                >
                                    <span className="text-lg shrink-0">{prompt.emoji}</span>
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-snug flex-1 line-clamp-2">
                                        {prompt.text}
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-orange-400 shrink-0 transition-colors" />
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* ── QUICK ACTIONS ─────────────────────────────── */}
                <motion.div variants={item}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                        Quick Actions
                    </p>
                    <div className="grid grid-cols-4 gap-2.5">
                        {[
                            { label: 'Order',   emoji: '📦',  href: '/meals',           bg: 'from-orange-400 to-orange-500' },
                            { label: 'Log Food',emoji: '🍽️',  href: '/health/log-food',  bg: 'from-green-400 to-green-500' },
                            { label: 'Water',   emoji: '💧',  href: '/health',           bg: 'from-blue-400 to-blue-500' },
                            { label: 'Workout', emoji: '🏋️', href: '/workout',           bg: 'from-purple-400 to-purple-500' },
                        ].map(action => (
                            <Link key={action.label} href={action.href}>
                                <motion.div
                                    whileTap={{ scale: 0.94 }}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-linear-to-br ${action.bg} text-white shadow-sm`}
                                >
                                    <span className="text-xl">{action.emoji}</span>
                                    <span className="text-[10px] font-semibold leading-tight text-center">
                                        {action.label}
                                    </span>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* ── WEIGHT PROGRESS ───────────────────────────── */}
                {(weight.current || weight.logs.length > 0) && (
                    <motion.div variants={item}>
                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <Scale className="h-4 w-4 text-gray-400" />
                                    <p className="text-sm font-bold text-gray-900">Weight</p>
                                </div>
                                <Link href="/health/progress"
                                    className="text-xs text-orange-500 font-medium flex items-center gap-0.5">
                                    History <ChevronRight className="h-3 w-3" />
                                </Link>
                            </div>
                            {/* Stats row */}
                            <div className="flex items-end gap-4 mb-3 mt-2">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {weight.current ?? '—'}
                                        <span className="text-sm font-normal text-gray-400 ml-1">kg</span>
                                    </p>
                                    <p className="text-xs text-gray-400">Current</p>
                                </div>
                                {weight.goal && (
                                    <>
                                        <div className="text-gray-200 text-lg pb-4">→</div>
                                        <div>
                                            <p className="text-lg font-bold text-orange-500">
                                                {weight.goal}
                                                <span className="text-xs font-normal text-gray-400 ml-1">kg</span>
                                            </p>
                                            <p className="text-xs text-gray-400">Goal</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <p className="text-sm font-bold text-gray-700">
                                                {(Math.abs((weight.current ?? weight.goal) - weight.goal)).toFixed(1)} kg
                                            </p>
                                            <p className="text-xs text-gray-400">to go</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            {/* Sparkline */}
                            {weight.logs.length >= 2 && (
                                <WeightSparkline logs={weight.logs} />
                            )}
                            {weight.logs.length < 2 && (
                                <Link href="/health"
                                    className="flex items-center justify-center gap-2 py-2 rounded-2xl bg-orange-50 text-orange-600 text-xs font-semibold">
                                    <Plus className="h-3.5 w-3.5" />
                                    Log your weight
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ── STATS ROW (streak + BMR) ──────────────────── */}
                <motion.div variants={item}>
                    <div className="grid grid-cols-2 gap-2.5">
                        {/* Streak */}
                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-1">
                                <Flame className="h-4 w-4 text-orange-500" />
                                <p className="text-xs font-semibold text-gray-500">Streak</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 mt-0.5">
                                {streak.current}
                                <span className="text-sm font-normal text-gray-400 ml-1">days</span>
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                Best: {streak.longest} days
                            </p>
                        </div>
                        {/* TDEE / Calorie target */}
                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-1">
                                <Target className="h-4 w-4 text-orange-500" />
                                <p className="text-xs font-semibold text-gray-500">Daily Goal</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 mt-0.5">
                                {(profile.daily_calorie_goal ?? 2000).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                TDEE: {Math.round(profile.tdee ?? 0).toLocaleString()} cal
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* ── RECENT ORDERS ─────────────────────────────── */}
                {recentOrders.length > 0 && (
                    <motion.div variants={item}>
                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="h-4 w-4 text-gray-400" />
                                    <p className="text-sm font-bold text-gray-900">Recent Orders</p>
                                </div>
                                <Link href="/ordermeals"
                                    className="text-xs text-orange-500 font-medium flex items-center gap-0.5">
                                    View all <ChevronRight className="h-3 w-3" />
                                </Link>
                            </div>
                            <div className="space-y-2">
                                {recentOrders.map(order => (
                                    <div key={order.id}
                                        className="flex items-center justify-between py-1.5">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 capitalize">
                                                {order.status}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(order.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">
                                            ₹{order.total_amount}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── PROFILE NUDGE (if missing data) ──────────── */}
                {(!profile.weight || !profile.height || !profile.age) && (
                    <motion.div variants={item}>
                        <Link href="/profile">
                            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                                    <Activity className="h-5 w-5 text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-amber-900">Complete your profile</p>
                                    <p className="text-xs text-amber-600 mt-0.5">
                                        Add height, weight & age for accurate calorie targets
                                    </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-amber-400 shrink-0" />
                            </div>
                        </Link>
                    </motion.div>
                )}

            </motion.div>
        </div>
    );
}
