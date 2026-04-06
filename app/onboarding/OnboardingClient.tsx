'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Check, Loader2, Sparkles, ArrowRight,
    Flame, Dumbbell, Droplets, Award, Clipboard, Users,
} from 'lucide-react';
import { saveOnboardingProfile, saveTrainerOnboardingProfile, type OnboardingData, type TrainerOnboardingData } from '@/app/actions/onboarding';
import { toast } from 'sonner';

// ─── State type ────────────────────────────────────────────────────────────────
interface Answers {
    goal_type: string;
    name: string;
    food_type: string;
    weight: string;
    height: string;
    goal_weight: string;
    gender: string;
    age: string;
    activity_level: string;
    workout_experience: string;
    workout_equipment: string;
}

// ─── BMR / TDEE helpers ────────────────────────────────────────────────────────
const ACT_MULT: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
};
function computeStats(a: Answers) {
    const w = +a.weight, h = +a.height, age = +a.age;
    if (!w || !h || !age || !a.gender) return null;
    const bmr = a.gender === 'male'
        ? 10 * w + 6.25 * h - 5 * age + 5
        : 10 * w + 6.25 * h - 5 * age - 161;
    const tdee = bmr * (ACT_MULT[a.activity_level] ?? 1.55);
    let cal = tdee;
    if (a.goal_type === 'lose_weight')  cal = tdee * 0.80;
    if (a.goal_type === 'build_muscle') cal = tdee * 1.10;
    if (a.goal_type === 'gain_weight')  cal = tdee * 1.15;
    const protein = Math.round(w * (['build_muscle', 'gain_weight'].includes(a.goal_type) ? 1.8 : 1.2));
    const water   = Math.round(w * 35 / 100) / 10;
    return { calories: Math.round(cal), protein, water };
}

// ─── Option data ───────────────────────────────────────────────────────────────
interface Opt { value: string; label: string; emoji: string; desc: string }

const GOALS: Opt[] = [
    { value: 'lose_weight',     label: 'Lose fat',       emoji: '🔥', desc: 'Burn fat & get leaner' },
    { value: 'build_muscle',    label: 'Build muscle',   emoji: '💪', desc: 'Get stronger & bigger' },
    { value: 'gain_weight',     label: 'Gain weight',    emoji: '📈', desc: 'Healthy weight gain' },
    { value: 'maintain_weight', label: 'Stay fit',       emoji: '⚖️', desc: 'Maintain current shape' },
    { value: 'manage_health',   label: 'Get healthier',  emoji: '🫀', desc: 'Improve overall wellness' },
];
const FOODS: Opt[] = [
    { value: 'veg',           label: 'Vegetarian',      emoji: '🥗', desc: 'No meat or fish' },
    { value: 'non_veg',       label: 'Non-Vegetarian',  emoji: '🍗', desc: 'Includes meat & fish' },
    { value: 'vegan',         label: 'Vegan',           emoji: '🌱', desc: 'Plant-based only' },
    { value: 'no_preference', label: 'No preference',   emoji: '🍽️', desc: 'I eat everything' },
];
const ACTIVITIES: Opt[] = [
    { value: 'sedentary',         label: 'Mostly seated',   emoji: '🛋️', desc: 'Desk job, minimal movement' },
    { value: 'lightly_active',    label: 'Lightly active',  emoji: '🚶', desc: 'Light walks, some standing' },
    { value: 'moderately_active', label: 'Fairly active',   emoji: '🏃', desc: 'Regular gym or sports' },
    { value: 'very_active',       label: 'Very active',     emoji: '⚡', desc: 'Daily intense training' },
];
const EXPERIENCES: Opt[] = [
    { value: 'beginner',     label: 'Just starting',    emoji: '🌱', desc: 'Less than 6 months' },
    { value: 'intermediate', label: 'Getting there',    emoji: '💪', desc: '6 months – 2 years' },
    { value: 'advanced',     label: 'Seasoned athlete', emoji: '🏆', desc: '2+ years of training' },
];
const EQUIPMENT: Opt[] = [
    { value: 'Full Gym',         label: 'Full gym',    emoji: '🏋️', desc: 'All machines & weights' },
    { value: 'Home Gym',         label: 'Home gym',    emoji: '🏠', desc: 'Some gear at home' },
    { value: 'Dumbbells Only',   label: 'Dumbbells',   emoji: '🏋️', desc: 'Dumbbells & barbells' },
    { value: 'Bodyweight Only',  label: 'Bodyweight',  emoji: '🤸', desc: 'No equipment needed' },
    { value: 'Resistance Bands', label: 'Bands',       emoji: '🔗', desc: 'Resistance bands only' },
];
const GOAL_ACK: Record<string, string> = {
    lose_weight:     "Let's burn some fat! 🔥",
    build_muscle:    "Let's get you strong! 💪",
    gain_weight:     "Solid plan! 📈",
    maintain_weight: "Smart choice! ⚖️",
    manage_health:   "Wise decision! 🫀",
};

// ─── Option card ───────────────────────────────────────────────────────────────
function OptionCard({ opt, selected, onClick }: { opt: Opt; selected: boolean; onClick: () => void }) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            whileTap={{ scale: 0.975 }}
            className={`
                w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 text-left
                transition-colors duration-150 select-none
                ${selected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-100 bg-white active:bg-orange-50/30'
                }
            `}
        >
            <span className="text-2xl w-9 text-center shrink-0 leading-none">{opt.emoji}</span>
            <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm leading-tight ${selected ? 'text-orange-900' : 'text-gray-900'}`}>
                    {opt.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-tight">{opt.desc}</p>
            </div>
            <div className={`
                w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-150
                ${selected ? 'bg-orange-500 border-orange-500' : 'border-gray-200'}
            `}>
                {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </div>
        </motion.button>
    );
}

// ─── Animated counter ──────────────────────────────────────────────────────────
function CountUp({ to }: { to: number }) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        let frame = 0;
        const total = 50;
        const id = setInterval(() => {
            frame++;
            setVal(Math.round((frame / total) * to));
            if (frame >= total) clearInterval(id);
        }, 20);
        return () => clearInterval(id);
    }, [to]);
    return <>{val}</>;
}

// ─── Wizard ────────────────────────────────────────────────────────────────────
// Screens: 0=welcome 1=goal 2=name 3=food 4=stats 5=age 6=activity 7=exp 8=equip 9=results
const TOTAL_Q = 8;

export default function OnboardingClient({
    userName,
    userType = 'personal',
}: {
    userName?: string;
    userType?: 'personal' | 'client' | 'trainer';
}) {
    // ── Trainer onboarding renders its own wizard ──
    if (userType === 'trainer') {
        return <TrainerOnboardingWizard userName={userName} />;
    }

    const router = useRouter();
    const [screen, setScreen] = useState(0);
    const [dir, setDir]       = useState(1);
    const [saving, setSaving] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [a, setA_raw] = useState<Answers>({
        goal_type: '', name: userName ?? '', food_type: '',
        weight: '', height: '', goal_weight: '', gender: '', age: '',
        activity_level: '', workout_experience: '', workout_equipment: '',
    });

    const setA = (k: keyof Answers, v: string) => setA_raw(prev => ({ ...prev, [k]: v }));

    const goTo = (n: number) => {
        setDir(n > screen ? 1 : -1);
        setScreen(n);
    };

    // Tap a single-select option → update state + advance after 350 ms
    const pick = (k: keyof Answers, v: string) => {
        setA(k, v);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => goTo(screen + 1), 350);
    };

    const canNext = () => {
        if (screen === 2) return a.name.trim().length >= 2;
        if (screen === 4) return +a.weight > 30 && +a.height > 100;
        if (screen === 5) return !!a.gender && +a.age > 10 && +a.age < 100;
        return true;
    };

    const progress = screen >= 1 && screen <= 8 ? (screen - 1) / TOTAL_Q : screen === 9 ? 1 : 0;
    const name1    = a.name.split(' ')[0] || '';
    const stats    = computeStats(a);

    const handleFinish = async () => {
        setSaving(true);
        const data: OnboardingData = {
            name:                     a.name.trim() || 'You',
            gender:                   (a.gender || 'other') as OnboardingData['gender'],
            age:                      +a.age     || 25,
            weight:                   +a.weight  || 70,
            height:                   +a.height  || 170,
            goal_weight:              +a.goal_weight > 30 ? +a.goal_weight : null,
            goal_type:                a.goal_type    || 'manage_health',
            food_type:                a.food_type    || 'no_preference',
            dietary_restrictions:     [],
            preferred_cuisine:        'Indian',
            meals_per_day:            3,
            activity_level:           a.activity_level    || 'moderately_active',
            workout_experience:       a.workout_experience || 'beginner',
            workout_equipment:        a.workout_equipment  || 'Full Gym',
            workout_days_per_week:    4,
            workout_session_duration: '60 minutes',
            workout_focus_areas:      [],
        };
        const result = await saveOnboardingProfile(data);
        if (result?.error) {
            toast.error(result.error);
            setSaving(false);
        } else {
            router.push('/dashboard');
        }
    };

    const variants = {
        enter:  (d: number) => ({ x: d > 0 ? 64 : -64, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit:   (d: number) => ({ x: d > 0 ? -64 : 64, opacity: 0 }),
    };
    const T = { duration: 0.22, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] };

    // Shared CTA button
    function CTABtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
        return (
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-red-500 text-white font-bold text-base shadow-md shadow-orange-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
                Continue <ArrowRight className="h-5 w-5" />
            </button>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">

            {/* ── Fixed nav bar (screens 1-8) ── */}
            {screen >= 1 && screen <= 8 && (
                <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 bg-white/90 backdrop-blur-sm border-b border-gray-100 h-12">
                    <button
                        onClick={() => goTo(screen - 1)}
                        className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-linear-to-r from-orange-500 to-red-400 rounded-full"
                            animate={{ width: `${progress * 100}%` }}
                            transition={{ duration: 0.35 }}
                        />
                    </div>
                    <span className="text-xs font-bold text-gray-400 shrink-0 w-10 text-right">
                        {Math.min(screen, 8)}/{TOTAL_Q}
                    </span>
                    {(screen === 7 || screen === 8) && (
                        <button
                            onClick={() => goTo(screen + 1)}
                            className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors shrink-0 ml-1"
                        >
                            Skip
                        </button>
                    )}
                </div>
            )}

            {/* ── Screen content ── */}
            <div className={`flex-1 flex flex-col max-w-md mx-auto w-full px-5 ${screen >= 1 && screen <= 8 ? 'pt-16' : ''}`}>
                <AnimatePresence mode="wait" custom={dir}>
                    <motion.div
                        key={screen}
                        custom={dir}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={T}
                        className="flex-1 flex flex-col"
                    >

                        {/* ══ 0: WELCOME ════════════════════════════════════════════════════════ */}
                        {screen === 0 && (
                            <div className="flex-1 flex flex-col">
                                {/* Hero gradient */}
                                <div className="bg-linear-to-br from-orange-500 to-red-600 px-6 pt-16 pb-10 flex flex-col items-center text-center">
                                    <motion.div
                                        initial={{ scale: 0.6, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                        className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-2xl"
                                    >
                                        <Sparkles className="h-10 w-10 text-white" />
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                    >
                                        <h1 className="text-4xl font-black text-white leading-tight mb-2">
                                            Honest Meals
                                        </h1>
                                        <p className="text-white/75 text-base">
                                            Your personal health &amp; fitness companion
                                        </p>
                                    </motion.div>
                                </div>

                                {/* Feature list + CTA */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="flex-1 bg-white px-6 pt-8 pb-10 flex flex-col"
                                >
                                    <h2 className="text-xl font-black text-gray-900 mb-1">Let&apos;s set up your profile</h2>
                                    <p className="text-sm text-gray-400 mb-7">
                                        Takes less than a minute. We&apos;ll personalise everything for you.
                                    </p>

                                    <div className="space-y-4 mb-8">
                                        {[
                                            { emoji: '🤖', title: 'AI diet & workout plans',     sub: 'Tailored to your exact body & goals' },
                                            { emoji: '🍽️', title: 'Macro-labelled healthy meals', sub: 'Order food that fits your goals' },
                                            { emoji: '📊', title: 'Calories, macros & progress',  sub: 'Auto-tracked, one dashboard' },
                                        ].map(f => (
                                            <div key={f.title} className="flex items-start gap-3.5">
                                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 text-lg">
                                                    {f.emoji}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900">{f.title}</p>
                                                    <p className="text-xs text-gray-400">{f.sub}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => goTo(1)}
                                        className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-red-500 text-white font-bold text-base shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform mt-auto"
                                    >
                                        Get started <ArrowRight className="h-5 w-5" />
                                    </button>
                                </motion.div>
                            </div>
                        )}

                        {/* ══ 1: GOAL ═══════════════════════════════════════════════════════════ */}
                        {screen === 1 && (
                            <div className="flex-1 flex flex-col justify-center py-8">
                                <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">Your goal</p>
                                <h2 className="text-3xl font-black text-gray-900 leading-[1.1] mb-7">
                                    What&apos;s your<br />main goal?
                                </h2>
                                <div className="space-y-2">
                                    {GOALS.map(opt => (
                                        <OptionCard
                                            key={opt.value}
                                            opt={opt}
                                            selected={a.goal_type === opt.value}
                                            onClick={() => pick('goal_type', opt.value)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ══ 2: NAME ═══════════════════════════════════════════════════════════ */}
                        {screen === 2 && (
                            <div className="flex-1 flex flex-col justify-center py-8">
                                <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">
                                    {GOAL_ACK[a.goal_type] || 'Nice choice!'}
                                </p>
                                <h2 className="text-3xl font-black text-gray-900 leading-[1.1] mb-7">
                                    What should<br />we call you?
                                </h2>
                                <input
                                    type="text"
                                    value={a.name}
                                    onChange={e => setA('name', e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && canNext() && goTo(3)}
                                    placeholder="Your first name"
                                    autoFocus
                                    className="h-16 px-5 rounded-2xl border-2 border-gray-100 bg-white focus:border-orange-500 focus:outline-none text-2xl font-black text-gray-900 placeholder:text-gray-200 placeholder:font-normal transition-colors mb-6"
                                />
                                <CTABtn onClick={() => canNext() && goTo(3)} disabled={!canNext()} />
                            </div>
                        )}

                        {/* ══ 3: FOOD ═══════════════════════════════════════════════════════════ */}
                        {screen === 3 && (
                            <div className="flex-1 flex flex-col justify-center py-8">
                                <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">
                                    {name1 ? `Hey ${name1}!` : 'Eating style'}
                                </p>
                                <h2 className="text-3xl font-black text-gray-900 leading-[1.1] mb-7">
                                    How do you<br />like to eat?
                                </h2>
                                <div className="space-y-2">
                                    {FOODS.map(opt => (
                                        <OptionCard
                                            key={opt.value}
                                            opt={opt}
                                            selected={a.food_type === opt.value}
                                            onClick={() => pick('food_type', opt.value)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ══ 4: BODY STATS ═════════════════════════════════════════════════════ */}
                        {screen === 4 && (
                            <div className="flex-1 flex flex-col justify-center py-8">
                                <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">Body stats</p>
                                <h2 className="text-3xl font-black text-gray-900 leading-[1.1] mb-2">
                                    Your current<br />measurements
                                </h2>
                                <p className="text-sm text-gray-400 mb-7">
                                    Used to calculate your exact calorie, protein &amp; water targets.
                                </p>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {([
                                        { label: 'Weight', key: 'weight' as const, unit: 'kg',  ph: '70',  min: 30,  max: 300 },
                                        { label: 'Height', key: 'height' as const, unit: 'cm',  ph: '170', min: 100, max: 250 },
                                    ] as const).map(f => (
                                        <div key={f.key}>
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">{f.label}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={a[f.key]}
                                                    onChange={e => setA(f.key, e.target.value)}
                                                    placeholder={f.ph}
                                                    min={f.min}
                                                    max={f.max}
                                                    className="w-full h-16 px-4 pr-11 rounded-2xl border-2 border-gray-100 bg-white focus:border-orange-500 focus:outline-none text-3xl font-black text-gray-900 placeholder:text-gray-200 transition-colors"
                                                />
                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-300">{f.unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Goal weight — only relevant for lose/gain goals */}
                                {['lose_weight', 'gain_weight', 'build_muscle'].includes(a.goal_type) && (
                                    <div className="mb-6">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                                            Target Weight <span className="text-gray-300 font-normal normal-case">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={a.goal_weight}
                                                onChange={e => setA('goal_weight', e.target.value)}
                                                placeholder="e.g. 70"
                                                min={30}
                                                max={300}
                                                className="w-full h-14 px-4 pr-11 rounded-2xl border-2 border-gray-100 bg-white focus:border-orange-500 focus:outline-none text-2xl font-black text-gray-900 placeholder:text-gray-200 transition-colors"
                                            />
                                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-300">kg</span>
                                        </div>
                                    </div>
                                )}
                                <CTABtn onClick={() => canNext() && goTo(5)} disabled={!canNext()} />
                            </div>
                        )}

                        {/* ══ 5: AGE & GENDER ═══════════════════════════════════════════════════ */}
                        {screen === 5 && (
                            <div className="flex-1 flex flex-col justify-center py-8">
                                <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">About you</p>
                                <h2 className="text-3xl font-black text-gray-900 leading-[1.1] mb-7">
                                    A little bit<br />more about you
                                </h2>
                                <div className="mb-5">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Age</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={a.age}
                                            onChange={e => setA('age', e.target.value)}
                                            placeholder="25"
                                            min={10}
                                            max={100}
                                            className="w-full h-16 px-4 pr-16 rounded-2xl border-2 border-gray-100 bg-white focus:border-orange-500 focus:outline-none text-3xl font-black text-gray-900 placeholder:text-gray-200 transition-colors"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-300">yrs</span>
                                    </div>
                                </div>
                                <div className="mb-7">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Gender</label>
                                    <div className="grid grid-cols-3 gap-2.5">
                                        {[
                                            { value: 'male',   label: 'Male',   emoji: '👨' },
                                            { value: 'female', label: 'Female', emoji: '👩' },
                                            { value: 'other',  label: 'Other',  emoji: '🧑' },
                                        ].map(g => (
                                            <button
                                                key={g.value}
                                                type="button"
                                                onClick={() => setA('gender', g.value)}
                                                className={`
                                                    flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-colors
                                                    ${a.gender === g.value
                                                        ? 'border-orange-500 bg-orange-50'
                                                        : 'border-gray-100 bg-white active:bg-orange-50/30'
                                                    }
                                                `}
                                            >
                                                <span className="text-2xl leading-none">{g.emoji}</span>
                                                <span className={`text-xs font-bold ${a.gender === g.value ? 'text-orange-900' : 'text-gray-700'}`}>{g.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <CTABtn onClick={() => canNext() && goTo(6)} disabled={!canNext()} />
                            </div>
                        )}

                        {/* ══ 6: ACTIVITY ═══════════════════════════════════════════════════════ */}
                        {screen === 6 && (
                            <div className="flex-1 flex flex-col justify-center py-8">
                                <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">Daily lifestyle</p>
                                <h2 className="text-3xl font-black text-gray-900 leading-[1.1] mb-7">
                                    How active is<br />your lifestyle?
                                </h2>
                                <div className="space-y-2">
                                    {ACTIVITIES.map(opt => (
                                        <OptionCard
                                            key={opt.value}
                                            opt={opt}
                                            selected={a.activity_level === opt.value}
                                            onClick={() => pick('activity_level', opt.value)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ══ 7: TRAINING EXPERIENCE (optional) ════════════════════════════════ */}
                        {screen === 7 && (
                            <div className="flex-1 flex flex-col justify-center py-8">
                                <div className="flex items-center gap-2 mb-2">
                                    <p className="text-xs font-black text-orange-500 uppercase tracking-widest">Workout</p>
                                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-400">Optional</span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 leading-[1.1] mb-7">
                                    Your training<br />experience?
                                </h2>
                                <div className="space-y-2">
                                    {EXPERIENCES.map(opt => (
                                        <OptionCard
                                            key={opt.value}
                                            opt={opt}
                                            selected={a.workout_experience === opt.value}
                                            onClick={() => pick('workout_experience', opt.value)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ══ 8: EQUIPMENT (optional) ═══════════════════════════════════════════ */}
                        {screen === 8 && (
                            <div className="flex-1 flex flex-col justify-center py-8">
                                <div className="flex items-center gap-2 mb-2">
                                    <p className="text-xs font-black text-orange-500 uppercase tracking-widest">Equipment</p>
                                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-400">Optional</span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 leading-[1.1] mb-7">
                                    Where do<br />you train?
                                </h2>
                                <div className="space-y-2">
                                    {EQUIPMENT.map(opt => (
                                        <OptionCard
                                            key={opt.value}
                                            opt={opt}
                                            selected={a.workout_equipment === opt.value}
                                            onClick={() => pick('workout_equipment', opt.value)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ══ 9: RESULTS ════════════════════════════════════════════════════════ */}
                        {screen === 9 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 px-2">
                                <motion.div
                                    initial={{ scale: 0.4, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                                    className="w-20 h-20 rounded-full bg-linear-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-xl shadow-orange-200 mb-6"
                                >
                                    <Check className="h-10 w-10 text-white" strokeWidth={3} />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.18 }}
                                >
                                    <h2 className="text-3xl font-black text-gray-900 mb-2">
                                        {name1 ? `${name1}, you're all set! 🎉` : "You're all set! 🎉"}
                                    </h2>
                                    <p className="text-gray-400 text-sm mb-8">Your personalised daily targets</p>
                                </motion.div>

                                {stats ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 18 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.32 }}
                                        className="w-full grid grid-cols-3 gap-3 mb-8"
                                    >
                                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                                            <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                                            <p className="text-2xl font-black text-gray-900"><CountUp to={stats.calories} /></p>
                                            <p className="text-xs text-gray-400 font-medium mt-0.5">kcal / day</p>
                                        </div>
                                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                                            <Dumbbell className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                                            <p className="text-2xl font-black text-gray-900"><CountUp to={stats.protein} />g</p>
                                            <p className="text-xs text-gray-400 font-medium mt-0.5">protein / day</p>
                                        </div>
                                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                                            <Droplets className="h-6 w-6 text-cyan-500 mx-auto mb-2" />
                                            <p className="text-2xl font-black text-gray-900">{stats.water}L</p>
                                            <p className="text-xs text-gray-400 font-medium mt-0.5">water / day</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="w-full bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-8">
                                        <p className="text-sm text-gray-400">Your targets will be calculated from your saved data.</p>
                                    </div>
                                )}

                                <motion.div
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.48 }}
                                    className="w-full"
                                >
                                    <button
                                        onClick={handleFinish}
                                        disabled={saving}
                                        className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-orange-500 to-red-500 text-white font-bold text-base shadow-lg shadow-orange-200 disabled:opacity-60 active:scale-[0.98] transition-all"
                                    >
                                        {saving
                                            ? <><Loader2 className="h-5 w-5 animate-spin" /> Setting things up&hellip;</>
                                            : <>Let&apos;s go! 💪</>
                                        }
                                    </button>
                                    <p className="text-xs text-gray-400 mt-3">
                                        You can update everything anytime in your profile.
                                    </p>
                                </motion.div>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAINER ONBOARDING WIZARD
// ─────────────────────────────────────────────────────────────────────────────

const SPECIALTIES = [
    'Weight Loss', 'Muscle Building', 'Sports Performance',
    'Bodybuilding', 'CrossFit', 'Yoga & Mobility',
    'Rehabilitation', 'Nutrition Coaching', 'Senior Fitness', 'Youth Training',
];

interface TrainerAnswers {
    name: string;
    phone: string;
    specialties: string[];
    experience_years: string;
    certification: string;
    bio: string;
    commission_rate: string;
    trainer_invite_code?: string;
}

function TrainerOnboardingWizard({ userName }: { userName?: string }) {
    const router = useRouter();
    const [screen, setScreen] = useState(0);
    const [dir, setDir] = useState(1);
    const [saving, setSaving] = useState(false);
    const [inviteCode, setInviteCode] = useState('');

    const [a, setA] = useState<TrainerAnswers>({
        name: userName ?? '',
        phone: '',
        specialties: [],
        experience_years: '',
        certification: '',
        bio: '',
        commission_rate: '10',
    });

    const set = <K extends keyof TrainerAnswers>(k: K, v: TrainerAnswers[K]) =>
        setA(prev => ({ ...prev, [k]: v }));

    const toggleSpecialty = (s: string) =>
        set('specialties', a.specialties.includes(s)
            ? a.specialties.filter(x => x !== s)
            : [...a.specialties, s]);

    const goTo = (n: number) => { setDir(n > screen ? 1 : -1); setScreen(n); };

    const canNext = () => {
        if (screen === 0) return a.name.trim().length >= 2;
        if (screen === 1) return a.specialties.length > 0;
        if (screen === 2) return +a.experience_years > 0;
        return true;
    };

    const handleFinish = async () => {
        setSaving(true);
        const data: TrainerOnboardingData = {
            name:             a.name.trim() || 'Trainer',
            phone:            a.phone.trim(),
            specialties:      a.specialties,
            experience_years: +a.experience_years || 1,
            certification:    a.certification.trim(),
            bio:              a.bio.trim(),
            commission_rate:  +a.commission_rate || 10,
        };
        const result = await saveTrainerOnboardingProfile(data);
        if (result?.error) {
            toast.error(result.error);
            setSaving(false);
        } else {
            setInviteCode(result.invite_code ?? '');
            goTo(4); // show invite code screen
        }
    };

    const TOTAL_T = 3;
    const progress = screen >= 1 && screen <= TOTAL_T ? (screen - 1) / TOTAL_T : screen >= 4 ? 1 : 0;

    const variants = {
        enter:  (d: number) => ({ x: d > 0 ? 64 : -64, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit:   (d: number) => ({ x: d > 0 ? -64 : 64, opacity: 0 }),
    };
    const T = { duration: 0.22, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] };

    function CTABtn({ onClick, disabled, label = 'Continue' }: { onClick: () => void; disabled?: boolean; label?: string }) {
        return (
            <button type="button" onClick={onClick} disabled={disabled}
                className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-base shadow-md shadow-orange-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all">
                {label} <ArrowRight className="h-5 w-5" />
            </button>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">

            {screen >= 1 && screen <= TOTAL_T && (
                <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 bg-white/90 backdrop-blur-sm border-b border-gray-100 h-12">
                    <button onClick={() => goTo(screen - 1)}
                        className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-gradient-to-r from-orange-500 to-red-400 rounded-full"
                            animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.35 }} />
                    </div>
                    <span className="text-xs font-bold text-gray-400 shrink-0 w-10 text-right">
                        {screen}/{TOTAL_T}
                    </span>
                </div>
            )}

            <div className={`flex-1 flex flex-col max-w-md mx-auto w-full px-5 ${screen >= 1 && screen <= TOTAL_T ? 'pt-16' : ''}`}>
                <AnimatePresence mode="wait" custom={dir}>
                    <motion.div key={screen} custom={dir} variants={variants}
                        initial="enter" animate="center" exit="exit" transition={T}
                        className="flex-1 flex flex-col">

                        {/* ── 0: Welcome for trainers ── */}
                        {screen === 0 && (
                            <div className="flex-1 flex flex-col">
                                <div className="bg-gradient-to-br from-orange-500 to-red-600 px-6 pt-16 pb-10 flex flex-col items-center text-center">
                                    <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                        className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-2xl">
                                        <Dumbbell className="h-10 w-10 text-white" />
                                    </motion.div>
                                    <h1 className="text-4xl font-black text-white mb-2">Trainer Portal</h1>
                                    <p className="text-white/75 text-base">Manage clients, track progress & earn commissions</p>
                                </div>
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="flex-1 bg-white px-6 pt-8 pb-10 flex flex-col">
                                    <h2 className="text-xl font-black text-gray-900 mb-1">Let&apos;s set up your trainer profile</h2>
                                    <p className="text-sm text-gray-400 mb-7">Takes 2 minutes. We&apos;ll create your invite code so clients can find you.</p>
                                    <div className="space-y-4 mb-8">
                                        {[
                                            { emoji: '👥', title: 'Client dashboard', sub: 'Track macros, workouts & progress for every client' },
                                            { emoji: '💰', title: 'Commission tracking', sub: 'Earn on every meal your clients order' },
                                            { emoji: '📋', title: 'Assign plans & goals', sub: 'Create custom meal & workout plans' },
                                        ].map(f => (
                                            <div key={f.title} className="flex items-start gap-3.5">
                                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 text-lg">{f.emoji}</div>
                                                <div><p className="font-bold text-sm text-gray-900">{f.title}</p><p className="text-xs text-gray-400 mt-0.5">{f.sub}</p></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Your name</label>
                                        <input type="text" value={a.name} onChange={e => set('name', e.target.value)}
                                            placeholder="Full name" autoFocus
                                            className="w-full h-14 px-4 rounded-2xl border-2 border-gray-100 bg-white focus:border-orange-500 focus:outline-none text-lg font-bold text-gray-900 transition-colors" />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone (optional)</label>
                                        <input type="tel" value={a.phone} onChange={e => set('phone', e.target.value)}
                                            placeholder="+91 98765 43210"
                                            className="w-full h-12 px-4 rounded-2xl border-2 border-gray-100 bg-white focus:border-orange-500 focus:outline-none text-base text-gray-900 transition-colors" />
                                    </div>
                                    <CTABtn onClick={() => canNext() && goTo(1)} disabled={!canNext()} label="Get started" />
                                </motion.div>
                            </div>
                        )}

                        {/* ── 1: Specialties ── */}
                        {screen === 1 && (
                            <div className="flex-1 flex flex-col justify-start py-8">
                                <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">Your expertise</p>
                                <h2 className="text-3xl font-black text-gray-900 leading-[1.1] mb-2">What do you specialise in?</h2>
                                <p className="text-sm text-gray-400 mb-6">Select all that apply</p>
                                <div className="grid grid-cols-2 gap-2 mb-8">
                                    {SPECIALTIES.map(s => {
                                        const sel = a.specialties.includes(s);
                                        return (
                                            <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                                                className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-left text-sm font-semibold transition-colors ${sel ? 'border-orange-500 bg-orange-50 text-orange-900' : 'border-gray-100 bg-white text-gray-700'}`}>
                                                <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${sel ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                                                    {sel && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                                                </div>
                                                {s}
                                            </button>
                                        );
                                    })}
                                </div>
                                <CTABtn onClick={() => canNext() && goTo(2)} disabled={!canNext()} />
                            </div>
                        )}

                        {/* ── 2: Experience & Certification ── */}
                        {screen === 2 && (
                            <div className="flex-1 flex flex-col justify-center py-8">
                                <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">Your credentials</p>
                                <h2 className="text-3xl font-black text-gray-900 leading-[1.1] mb-7">Experience & certifications</h2>
                                <div className="space-y-5 mb-8">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Award className="inline h-4 w-4 mr-1 text-orange-500" />Years of experience
                                        </label>
                                        <input type="number" min={0} max={50} value={a.experience_years}
                                            onChange={e => set('experience_years', e.target.value)}
                                            placeholder="e.g. 3"
                                            className="w-full h-14 px-4 rounded-2xl border-2 border-gray-100 bg-white focus:border-orange-500 focus:outline-none text-2xl font-black text-gray-900 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Clipboard className="inline h-4 w-4 mr-1 text-orange-500" />Certifications (optional)
                                        </label>
                                        <input type="text" value={a.certification}
                                            onChange={e => set('certification', e.target.value)}
                                            placeholder="e.g. NASM-CPT, ACE, ISSA…"
                                            className="w-full h-12 px-4 rounded-2xl border-2 border-gray-100 bg-white focus:border-orange-500 focus:outline-none text-base text-gray-900 transition-colors" />
                                    </div>
                                </div>
                                <CTABtn onClick={() => canNext() && goTo(3)} disabled={!canNext()} />
                            </div>
                        )}

                        {/* ── 3: Bio & Commission ── */}
                        {screen === 3 && (
                            <div className="flex-1 flex flex-col justify-center py-8">
                                <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">Almost done</p>
                                <h2 className="text-3xl font-black text-gray-900 leading-[1.1] mb-7">About you & earnings</h2>
                                <div className="space-y-5 mb-8">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Bio (optional)</label>
                                        <textarea value={a.bio} onChange={e => set('bio', e.target.value)}
                                            rows={3} placeholder="Tell clients a bit about your training philosophy…"
                                            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-white focus:border-orange-500 focus:outline-none text-sm text-gray-900 resize-none transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Commission rate: <span className="text-orange-600 font-black">{a.commission_rate}%</span>
                                        </label>
                                        <p className="text-xs text-gray-400 mb-3">You earn this % on every meal order placed by your clients</p>
                                        <input type="range" min={5} max={25} step={0.5}
                                            value={a.commission_rate}
                                            onChange={e => set('commission_rate', e.target.value)}
                                            className="w-full accent-orange-500" />
                                        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5%</span><span>25%</span></div>
                                    </div>
                                </div>
                                <CTABtn onClick={handleFinish} disabled={saving} label={saving ? 'Saving…' : 'Finish setup'} />
                            </div>
                        )}

                        {/* ── 4: Invite code reveal ── */}
                        {screen === 4 && (
                            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                    className="w-24 h-24 rounded-3xl bg-orange-100 flex items-center justify-center mb-6">
                                    <Users className="h-12 w-12 text-orange-500" />
                                </motion.div>
                                <h2 className="text-3xl font-black text-gray-900 mb-2">You&apos;re all set! 🎉</h2>
                                <p className="text-gray-400 text-sm mb-8">Share your invite code with clients so they can join your roster.</p>
                                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl px-8 py-6 mb-6">
                                    <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Your Trainer Invite Code</p>
                                    <p className="text-4xl font-black text-orange-700 tracking-[0.2em]">{inviteCode}</p>
                                </div>
                                <p className="text-xs text-gray-400 mb-8">You can always find this code in your trainer settings.</p>
                                <button type="button" onClick={() => router.push('/trainer')}
                                    className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-base shadow-md shadow-orange-200 active:scale-[0.98] transition-all">
                                    Go to Trainer Dashboard <ArrowRight className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

