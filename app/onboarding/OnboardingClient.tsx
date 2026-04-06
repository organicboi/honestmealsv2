'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    User, Scale, Target, Dumbbell, ChevronRight, ChevronLeft,
    Check, Loader2, Sparkles, Utensils, Activity, Zap, Heart
} from 'lucide-react';
import { saveOnboardingProfile, type OnboardingData } from '@/app/actions/onboarding';
import { toast } from 'sonner';

// ─── Step definitions ──────────────────────────────────────────────────────

const STEPS = [
    { id: 1, label: 'About You',    icon: User },
    { id: 2, label: 'Body & Goals', icon: Target },
    { id: 3, label: 'Lifestyle',    icon: Dumbbell },
];

// ─── Reusable chip-select ──────────────────────────────────────────────────

function ChipSelect({
    options,
    value,
    onChange,
    multi = false,
}: {
    options: { value: string; label: string; emoji?: string }[];
    value: string | string[];
    onChange: (v: string | string[]) => void;
    multi?: boolean;
}) {
    const selected = Array.isArray(value) ? value : [value];

    const toggle = (v: string) => {
        if (multi) {
            const arr = selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v];
            onChange(arr);
        } else {
            onChange(v);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {options.map(opt => {
                const active = selected.includes(opt.value);
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggle(opt.value)}
                        className={`
                            flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all
                            ${active
                                ? 'border-orange-500 bg-orange-50 text-orange-900'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
                            }
                        `}
                    >
                        {opt.emoji && <span>{opt.emoji}</span>}
                        {opt.label}
                        {active && <Check className="h-3.5 w-3.5 text-orange-500" />}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Number input ──────────────────────────────────────────────────────────

function NumInput({
    label, unit, value, onChange, min, max, placeholder,
}: {
    label: string; unit: string; value: string;
    onChange: (v: string) => void; min?: number; max?: number; placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    min={min}
                    max={max}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-base font-medium transition-colors"
                />
                <span className="shrink-0 text-sm font-semibold text-gray-500 w-10">{unit}</span>
            </div>
        </div>
    );
}

// ─── Main wizard ───────────────────────────────────────────────────────────

export default function OnboardingClient({ userName }: { userName?: string }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);

    // Step 1
    const [name,   setName]   = useState(userName ?? '');
    const [gender, setGender] = useState('');
    const [age,    setAge]    = useState('');

    // Step 2
    const [weight,       setWeight]      = useState('');
    const [height,       setHeight]      = useState('');
    const [goalWeight,   setGoalWeight]  = useState('');
    const [goalType,     setGoalType]    = useState('');
    const [foodType,     setFoodType]    = useState('no_preference');
    const [restrictions, setRestrictions] = useState<string[]>([]);
    const [cuisine,      setCuisine]     = useState('Mixed');
    const [mealsPerDay,  setMealsPerDay] = useState('3');

    // Step 3
    const [activityLevel,      setActivityLevel]      = useState('');
    const [workoutExp,         setWorkoutExp]          = useState('');
    const [equipment,          setEquipment]           = useState('');
    const [daysPerWeek,        setDaysPerWeek]         = useState('4');
    const [sessionDuration,    setSessionDuration]     = useState('60 minutes');
    const [focusAreas,         setFocusAreas]          = useState<string[]>([]);
    const [injuries,           setInjuries]            = useState('');

    // ── Validation ────────────────────────────────────────────────────────

    const canProceed = () => {
        if (step === 1) return name.trim() && gender && age && Number(age) > 10 && Number(age) < 100;
        if (step === 2) return weight && height && goalType && Number(weight) > 30 && Number(height) > 100;
        if (step === 3) return activityLevel && workoutExp && equipment;
        return false;
    };

    // ── Submit ─────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        setSaving(true);
        const data: OnboardingData = {
            name:                     name.trim(),
            gender:                   gender as OnboardingData['gender'],
            age:                      Number(age),
            weight:                   Number(weight),
            height:                   Number(height),
            goal_weight:              goalWeight ? Number(goalWeight) : null,
            goal_type:                goalType,
            food_type:                foodType,
            dietary_restrictions:     restrictions,
            preferred_cuisine:        cuisine,
            meals_per_day:            Number(mealsPerDay),
            activity_level:           activityLevel,
            workout_experience:       workoutExp,
            workout_equipment:        equipment,
            workout_days_per_week:    Number(daysPerWeek),
            workout_session_duration: sessionDuration,
            workout_focus_areas:      focusAreas,
            injuries_limitations:     injuries.trim() || undefined,
        };

        const result = await saveOnboardingProfile(data);
        setSaving(false);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success('Profile saved! Welcome to Honest Meals 🎉');
            router.push('/meals');
        }
    };

    const progress = (step / STEPS.length) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-lg">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
                        <Sparkles className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Set up your health profile</h1>
                    <p className="text-sm text-gray-500 mt-1">This personalizes everything — AI plans, calorie goals, water targets & more.</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-6">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const done = step > s.id;
                        const active = step === s.id;
                        return (
                            <div key={s.id} className="flex items-center gap-2 flex-1">
                                <div className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all
                                    ${active  ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : ''}
                                    ${done   ? 'bg-green-500 text-white' : ''}
                                    ${!active && !done ? 'bg-gray-100 text-gray-400' : ''}
                                `}>
                                    {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                                    <span className="hidden sm:inline">{s.label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 rounded-full ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.22 }}
                            className="p-6 space-y-5"
                        >

                            {/* ── STEP 1: About You ── */}
                            {step === 1 && (
                                <>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <User className="h-5 w-5 text-orange-500" /> About You
                                        </h2>
                                        <p className="text-sm text-gray-500">Tell us the basics so we can personalize your experience.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Your name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="e.g. Akshay"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-base transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                                        <ChipSelect
                                            options={[
                                                { value: 'male',   label: 'Male',   emoji: '👨' },
                                                { value: 'female', label: 'Female', emoji: '👩' },
                                                { value: 'other',  label: 'Other',  emoji: '🧑' },
                                            ]}
                                            value={gender}
                                            onChange={v => setGender(v as string)}
                                        />
                                    </div>

                                    <NumInput label="Age" unit="yrs" value={age} onChange={setAge} min={10} max={100} placeholder="25" />
                                </>
                            )}

                            {/* ── STEP 2: Body & Goals ── */}
                            {step === 2 && (
                                <>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <Target className="h-5 w-5 text-orange-500" /> Body & Goals
                                        </h2>
                                        <p className="text-sm text-gray-500">Used to calculate your calorie, protein & water targets.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <NumInput label="Current weight" unit="kg" value={weight} onChange={setWeight} min={30} max={300} placeholder="70" />
                                        <NumInput label="Height" unit="cm" value={height} onChange={setHeight} min={100} max={250} placeholder="175" />
                                    </div>

                                    <NumInput label="Goal weight (optional)" unit="kg" value={goalWeight} onChange={setGoalWeight} min={30} max={300} placeholder="65" />

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Primary goal</label>
                                        <ChipSelect
                                            options={[
                                                { value: 'lose_weight',    label: 'Lose weight',    emoji: '🔥' },
                                                { value: 'build_muscle',   label: 'Build muscle',   emoji: '💪' },
                                                { value: 'gain_weight',    label: 'Gain weight',    emoji: '📈' },
                                                { value: 'maintain_weight',label: 'Stay in shape',  emoji: '⚖️' },
                                                { value: 'manage_health',  label: 'Manage health',  emoji: '🫀' },
                                            ]}
                                            value={goalType}
                                            onChange={v => setGoalType(v as string)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Diet preference</label>
                                        <ChipSelect
                                            options={[
                                                { value: 'veg',          label: 'Vegetarian', emoji: '🥗' },
                                                { value: 'non_veg',      label: 'Non-Veg',    emoji: '🍗' },
                                                { value: 'vegan',        label: 'Vegan',      emoji: '🌱' },
                                                { value: 'no_preference',label: 'No preference', emoji: '🍽️' },
                                            ]}
                                            value={foodType}
                                            onChange={v => setFoodType(v as string)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Food restrictions (select all that apply)</label>
                                        <ChipSelect
                                            multi
                                            options={[
                                                { value: 'None',             label: 'None' },
                                                { value: 'Lactose',          label: 'Lactose-free' },
                                                { value: 'Gluten Free',      label: 'Gluten-free' },
                                                { value: 'Nut Allergy',      label: 'Nut allergy' },
                                                { value: 'Egg Allergy',      label: 'Egg allergy' },
                                                { value: 'Soy Allergy',      label: 'Soy allergy' },
                                            ]}
                                            value={restrictions}
                                            onChange={v => setRestrictions(v as string[])}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred cuisine</label>
                                            <ChipSelect
                                                options={[
                                                    { value: 'Indian',          label: 'Indian' },
                                                    { value: 'Western',         label: 'Western' },
                                                    { value: 'Mediterranean',   label: 'Mediterranean' },
                                                    { value: 'Asian',           label: 'Asian' },
                                                    { value: 'Mixed',           label: 'Mixed' },
                                                ]}
                                                value={cuisine}
                                                onChange={v => setCuisine(v as string)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Meals per day</label>
                                            <ChipSelect
                                                options={[
                                                    { value: '2', label: '2' },
                                                    { value: '3', label: '3' },
                                                    { value: '4', label: '4' },
                                                    { value: '5', label: '5' },
                                                    { value: '6', label: '6' },
                                                ]}
                                                value={mealsPerDay}
                                                onChange={v => setMealsPerDay(v as string)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ── STEP 3: Lifestyle ── */}
                            {step === 3 && (
                                <>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <Dumbbell className="h-5 w-5 text-orange-500" /> Lifestyle
                                        </h2>
                                        <p className="text-sm text-gray-500">Powers your workout plans and activity-adjusted calorie targets.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Activity level</label>
                                        <ChipSelect
                                            options={[
                                                { value: 'sedentary',         label: 'Sedentary',         emoji: '🛋️' },
                                                { value: 'lightly_active',    label: 'Lightly active',    emoji: '🚶' },
                                                { value: 'moderately_active', label: 'Moderately active', emoji: '🏃' },
                                                { value: 'very_active',       label: 'Very active',       emoji: '⚡' },
                                            ]}
                                            value={activityLevel}
                                            onChange={v => setActivityLevel(v as string)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Training experience</label>
                                        <ChipSelect
                                            options={[
                                                { value: 'beginner',     label: 'Beginner (< 6 mo)',    emoji: '🌱' },
                                                { value: 'intermediate', label: 'Intermediate (6 mo–2 yr)', emoji: '💪' },
                                                { value: 'advanced',     label: 'Advanced (2+ yr)',     emoji: '🏆' },
                                            ]}
                                            value={workoutExp}
                                            onChange={v => setWorkoutExp(v as string)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Equipment access</label>
                                        <ChipSelect
                                            options={[
                                                { value: 'Full Gym',         label: 'Full gym',          emoji: '🏋️' },
                                                { value: 'Dumbbells Only',   label: 'Dumbbells only',    emoji: '🏃' },
                                                { value: 'Bodyweight Only',  label: 'Bodyweight',        emoji: '🤸' },
                                                { value: 'Home Gym',         label: 'Home gym',          emoji: '🏠' },
                                                { value: 'Resistance Bands', label: 'Resistance bands',  emoji: '🔗' },
                                            ]}
                                            value={equipment}
                                            onChange={v => setEquipment(v as string)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Training days/week</label>
                                            <ChipSelect
                                                options={[
                                                    { value: '2', label: '2 days' },
                                                    { value: '3', label: '3 days' },
                                                    { value: '4', label: '4 days' },
                                                    { value: '5', label: '5 days' },
                                                    { value: '6', label: '6 days' },
                                                ]}
                                                value={daysPerWeek}
                                                onChange={v => setDaysPerWeek(v as string)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Session length</label>
                                            <ChipSelect
                                                options={[
                                                    { value: '30 minutes', label: '30 min' },
                                                    { value: '45 minutes', label: '45 min' },
                                                    { value: '60 minutes', label: '60 min' },
                                                    { value: '90 minutes', label: '90 min' },
                                                ]}
                                                value={sessionDuration}
                                                onChange={v => setSessionDuration(v as string)}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Focus areas (select all that apply)</label>
                                        <ChipSelect
                                            multi
                                            options={[
                                                { value: 'Upper Body', label: 'Upper body', emoji: '💪' },
                                                { value: 'Lower Body', label: 'Lower body', emoji: '🦵' },
                                                { value: 'Core',       label: 'Core',       emoji: '🎯' },
                                                { value: 'Cardio',     label: 'Cardio',     emoji: '🏃' },
                                                { value: 'Full Body',  label: 'Full body',  emoji: '⚡' },
                                            ]}
                                            value={focusAreas}
                                            onChange={v => setFocusAreas(v as string[])}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Any injuries or physical limitations? (optional)</label>
                                        <input
                                            type="text"
                                            value={injuries}
                                            onChange={e => setInjuries(e.target.value)}
                                            placeholder="e.g. lower back pain, knee issues"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-base transition-colors"
                                        />
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="px-6 pb-6 flex gap-3">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={() => setStep(s => s - 1)}
                                disabled={saving}
                                className="flex items-center gap-1.5 px-5 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" /> Back
                            </button>
                        )}

                        <button
                            type="button"
                            disabled={!canProceed() || saving}
                            onClick={step < 3 ? () => setStep(s => s + 1) : handleSubmit}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm shadow-md shadow-orange-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {saving ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                            ) : step < 3 ? (
                                <>Continue <ChevronRight className="h-4 w-4" /></>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Complete setup
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-4">
                    You can update these anytime in your profile settings.
                </p>
            </div>
        </div>
    );
}
