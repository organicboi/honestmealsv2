'use client';

import { useState } from 'react';
import { ChevronLeft, Flame, Dumbbell, TrendingUp, ShoppingBag, FileText, ClipboardList, Target, Scale, Activity } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { addTrainerNote, deleteTrainerNote, setClientGoal } from '@/app/actions/trainer';
import { toast } from 'sonner';

const TABS = [
    { key: 'overview',   label: 'Overview',  icon: <Activity size={15} /> },
    { key: 'nutrition',  label: 'Nutrition', icon: <Flame size={15} /> },
    { key: 'workouts',   label: 'Workouts',  icon: <Dumbbell size={15} /> },
    { key: 'progress',   label: 'Progress',  icon: <TrendingUp size={15} /> },
    { key: 'orders',     label: 'Orders',    icon: <ShoppingBag size={15} /> },
    { key: 'notes',      label: 'Notes',     icon: <FileText size={15} /> },
    { key: 'plans',      label: 'Plans',     icon: <ClipboardList size={15} /> },
    { key: 'goals',      label: 'Goals',     icon: <Target size={15} /> },
];

const GOAL_LABELS: Record<string, string> = {
    lose_weight: '🔥 Lose fat', build_muscle: '💪 Build muscle',
    gain_weight: '📈 Gain weight', maintain_weight: '⚖️ Maintain', manage_health: '🫀 Healthier',
};
const NOTE_TYPES = ['general', 'nutrition', 'workout', 'progress', 'goal'];
const NOTE_TYPE_COLORS: Record<string, string> = {
    general: 'bg-gray-100 text-gray-600', nutrition: 'bg-green-100 text-green-700',
    workout: 'bg-blue-100 text-blue-700', progress: 'bg-purple-100 text-purple-700',
    goal: 'bg-orange-100 text-orange-700',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ClientDetailClient({ clientId, profile, nutrition, workouts, progress, orders, notes, plans, goals }: any) {
    const [activeTab, setActiveTab] = useState('overview');
    const [noteText, setNoteText] = useState('');
    const [noteType, setNoteType] = useState('general');
    const [savingNote, setSavingNote] = useState(false);
    const [localNotes, setLocalNotes] = useState(notes?.notes ?? []);
    const [showAddGoal, setShowAddGoal] = useState(false);

    const initials = (profile?.name ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        setSavingNote(true);
        const res = await addTrainerNote(clientId, noteText, noteType);
        setSavingNote(false);
        if (res?.error) { toast.error(res.error); return; }
        setLocalNotes([res.note, ...localNotes]);
        setNoteText('');
        toast.success('Note added');
    };

    const handleDeleteNote = async (noteId: string) => {
        await deleteTrainerNote(noteId);
        setLocalNotes(localNotes.filter((n: { id: string }) => n.id !== noteId));
        toast.success('Note deleted');
    };

    return (
        <div className="space-y-6">
            {/* Back + Header */}
            <div>
                <Link href="/trainer/clients" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-4 transition-colors">
                    <ChevronLeft size={16} /> All Clients
                </Link>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
                        <span className="font-black text-orange-600 text-xl">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-black text-gray-900">{profile?.name ?? 'Unnamed'}</h1>
                        <p className="text-sm text-gray-400">{profile?.email}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {profile?.goal_type && (
                                <span className="text-xs bg-orange-50 text-orange-700 font-semibold px-2.5 py-1 rounded-full">
                                    {GOAL_LABELS[profile.goal_type] ?? profile.goal_type}
                                </span>
                            )}
                            {profile?.weight && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                                    <Scale size={11} className="inline mr-1" />{profile.weight} kg
                                </span>
                            )}
                            {profile?.workout_experience && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full capitalize">{profile.workout_experience}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                            activeTab === t.key
                                ? 'bg-orange-500 text-white'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
                        }`}>
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

                    {/* ── OVERVIEW ── */}
                    {activeTab === 'overview' && (
                        <div className="space-y-5">
                            {/* Vitals */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'Age',         value: profile?.age ? `${profile.age} yrs` : '—' },
                                    { label: 'Weight',      value: profile?.weight ? `${profile.weight} kg` : '—' },
                                    { label: 'Height',      value: profile?.height ? `${profile.height} cm` : '—' },
                                    { label: 'Goal Weight', value: profile?.goal_weight ? `${profile.goal_weight} kg` : '—' },
                                    { label: 'Daily Cals',  value: profile?.daily_calorie_goal ? `${profile.daily_calorie_goal} kcal` : '—' },
                                    { label: 'Protein',     value: profile?.daily_protein_goal ? `${profile.daily_protein_goal}g` : '—' },
                                    { label: 'Workout/wk',  value: profile?.workout_days_per_week ? `${profile.workout_days_per_week} days` : '—' },
                                    { label: 'Equipment',   value: profile?.workout_equipment ?? '—' },
                                ].map(v => (
                                    <div key={v.label} className="bg-white rounded-xl border border-gray-100 p-3.5">
                                        <p className="text-xs text-gray-400 mb-1">{v.label}</p>
                                        <p className="font-bold text-gray-900 text-sm">{v.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Health conditions & restrictions */}
                            {(profile?.health_conditions?.length > 0 || profile?.dietary_restrictions?.length > 0 || profile?.injuries_limitations) && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                                    <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Trainer Attention</p>
                                    {profile?.health_conditions?.length > 0 && (
                                        <p className="text-sm text-amber-800"><span className="font-semibold">Health conditions:</span> {profile.health_conditions.join(', ')}</p>
                                    )}
                                    {profile?.dietary_restrictions?.length > 0 && (
                                        <p className="text-sm text-amber-800"><span className="font-semibold">Dietary restrictions:</span> {profile.dietary_restrictions.join(', ')}</p>
                                    )}
                                    {profile?.injuries_limitations && (
                                        <p className="text-sm text-amber-800"><span className="font-semibold">Injuries:</span> {profile.injuries_limitations}</p>
                                    )}
                                </div>
                            )}

                            {/* Recent weight trend */}
                            {progress?.weightLogs?.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                                    <p className="font-bold text-gray-900 mb-3 text-sm">Weight Trend (last {Math.min(progress.weightLogs.length, 10)} entries)</p>
                                    <div className="space-y-1.5">
                                        {progress.weightLogs.slice(-10).reverse().map((w: { log_date: string; weight: number }, i: number) => (
                                            <div key={i} className="flex justify-between text-xs">
                                                <span className="text-gray-400">{new Date(w.log_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                <span className="font-semibold text-gray-800">{w.weight} kg</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── NUTRITION ── */}
                    {activeTab === 'nutrition' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'Calorie Goal',  value: profile?.daily_calorie_goal ? `${profile.daily_calorie_goal} kcal` : '—', color: 'text-orange-600' },
                                    { label: 'Protein Goal',  value: profile?.daily_protein_goal ? `${profile.daily_protein_goal}g` : '—', color: 'text-blue-600' },
                                    { label: 'Goal Type',     value: profile?.goal_type ? GOAL_LABELS[profile.goal_type] ?? profile.goal_type : '—', color: 'text-green-600' },
                                    { label: 'Food Type',     value: profile?.food_type ?? '—', color: 'text-purple-600' },
                                ].map(v => (
                                    <div key={v.label} className="bg-white rounded-xl border border-gray-100 p-4">
                                        <p className="text-xs text-gray-400 mb-1">{v.label}</p>
                                        <p className={`font-bold text-sm ${v.color}`}>{v.value}</p>
                                    </div>
                                ))}
                            </div>

                            {nutrition?.daily?.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                    <p className="px-5 py-3 font-bold text-gray-900 text-sm border-b border-gray-100">Daily Nutrition (last 30 days)</p>
                                    <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                                        {[...nutrition.daily].reverse().map((d: { log_date: string; total_calories: number; total_protein: number; total_carbs: number; total_fat: number; goals_met: boolean }) => (
                                            <div key={d.log_date} className="flex items-center justify-between px-5 py-3 text-sm">
                                                <span className="text-gray-500 w-24 shrink-0">{new Date(d.log_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                <span className="text-orange-600 font-semibold w-24 text-right">{d.total_calories} kcal</span>
                                                <span className="text-blue-600 w-16 text-right">{d.total_protein}g P</span>
                                                <span className="text-green-600 w-16 text-right">{d.total_carbs}g C</span>
                                                <span className="text-purple-600 w-16 text-right">{d.total_fat}g F</span>
                                                <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${d.goals_met ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                    {d.goals_met ? '✓' : '✗'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(!nutrition?.daily?.length) && (
                                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-400">
                                    <Flame className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    <p>No nutrition logs yet</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── WORKOUTS ── */}
                    {activeTab === 'workouts' && (
                        <div className="space-y-3">
                            {workouts?.workouts?.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-400">
                                    <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    <p>No workout logs yet</p>
                                </div>
                            )}
                            {workouts?.workouts?.map((w: {
                                id: string; log_date: string; duration_minutes: number; intensity_level: number; calories_burned: number; notes: string;
                                workout_categories?: { name: string } | null;
                                workout_exercises?: Array<{ exercise_name: string; order_index: number; workout_sets?: Array<{ set_number: number; weight_kg: number; reps: number; rpe: number }> }>;
                            }) => (
                                <div key={w.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{w.workout_categories?.name ?? 'Workout'}</p>
                                            <p className="text-xs text-gray-400">{new Date(w.log_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                                        </div>
                                        <div className="flex gap-3 text-xs text-right">
                                            <div><p className="font-bold text-gray-800">{w.duration_minutes}m</p><p className="text-gray-400">Duration</p></div>
                                            <div><p className="font-bold text-gray-800">{w.intensity_level}/5</p><p className="text-gray-400">Intensity</p></div>
                                            {w.calories_burned && <div><p className="font-bold text-orange-600">{w.calories_burned}</p><p className="text-gray-400">kcal</p></div>}
                                        </div>
                                    </div>
                                    {w.workout_exercises && w.workout_exercises.length > 0 && (
                                        <div className="px-5 py-3 space-y-2">
                                            {w.workout_exercises.map((ex) => (
                                                <div key={ex.exercise_name}>
                                                    <p className="text-xs font-semibold text-gray-700">{ex.exercise_name}</p>
                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                        {ex.workout_sets?.map((s) => (
                                                            <span key={s.set_number} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                                                {s.weight_kg}kg × {s.reps}{s.rpe ? ` @RPE${s.rpe}` : ''}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── PROGRESS ── */}
                    {activeTab === 'progress' && (
                        <div className="space-y-5">
                            {/* Latest measurements */}
                            {progress?.measurements?.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                                    <p className="font-bold text-gray-900 mb-4 text-sm">Latest Body Measurements</p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {[
                                            { key: 'weight_kg',    label: 'Weight',     unit: 'kg' },
                                            { key: 'body_fat_pct', label: 'Body Fat',   unit: '%' },
                                            { key: 'muscle_mass_kg', label: 'Muscle',   unit: 'kg' },
                                            { key: 'bmi',          label: 'BMI',        unit: '' },
                                            { key: 'waist_cm',     label: 'Waist',      unit: 'cm' },
                                            { key: 'chest_cm',     label: 'Chest',      unit: 'cm' },
                                            { key: 'arms_cm',      label: 'Arms',       unit: 'cm' },
                                            { key: 'hips_cm',      label: 'Hips',       unit: 'cm' },
                                        ].map(m => {
                                            const latest = progress.measurements[0];
                                            const val = latest?.[m.key];
                                            return (
                                                <div key={m.key} className="bg-gray-50 rounded-xl p-3">
                                                    <p className="text-xs text-gray-400">{m.label}</p>
                                                    <p className="font-bold text-gray-900 mt-0.5">{val != null ? `${val}${m.unit}` : '—'}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3">
                                        Measured {new Date(progress.measurements[0].measured_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            )}

                            {/* Weight history */}
                            {progress?.weightLogs?.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                                    <p className="font-bold text-gray-900 mb-3 text-sm">Weight History ({progress.weightLogs.length} entries)</p>
                                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                                        {[...progress.weightLogs].reverse().map((w: { log_date: string; weight: number }, i: number, arr: { weight: number }[]) => {
                                            const prev = arr[i + 1];
                                            const diff = prev ? w.weight - prev.weight : 0;
                                            return (
                                                <div key={w.log_date} className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
                                                    <span className="text-gray-400 text-xs">{new Date(w.log_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-900">{w.weight} kg</span>
                                                        {diff !== 0 && (
                                                            <span className={`text-xs ${diff < 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                                {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Progress photos */}
                            {progress?.photos?.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                                    <p className="font-bold text-gray-900 mb-3 text-sm">Progress Photos</p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {progress.photos.map((p: { id: string; image_url: string; photo_type: string; taken_at: string }) => (
                                            <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden group bg-gray-100">
                                                <img src={p.image_url} alt={p.photo_type} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                    <span className="text-white text-xs font-medium">
                                                        {new Date(p.taken_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!progress?.weightLogs?.length && !progress?.measurements?.length && !progress?.photos?.length && (
                                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-400">
                                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    <p>No progress data yet</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── ORDERS ── */}
                    {activeTab === 'orders' && (
                        <div className="space-y-3">
                            {orders?.orders?.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-400">
                                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    <p>No orders yet</p>
                                </div>
                            )}
                            {orders?.orders?.map((o: {
                                id: string; order_date: string; total_amount: number; status: string; payment_status: string;
                                trainer_commission_amount?: number; trainer_commission_rate?: number;
                                order_items?: Array<{ quantity: number; total_price: number; meals?: { name: string } | null }>;
                            }) => (
                                <div key={o.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">
                                                {new Date(o.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                            <p className="text-xs text-gray-400 capitalize">{o.status} · {o.payment_status}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">₹{o.total_amount}</p>
                                            {o.trainer_commission_amount && (
                                                <p className="text-xs text-green-600 font-semibold">
                                                    You earn: ₹{o.trainer_commission_amount} ({o.trainer_commission_rate}%)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {o.order_items?.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-xs text-gray-600">
                                                <span>{item.meals?.name ?? 'Custom meal'} × {item.quantity}</span>
                                                <span>₹{item.total_price}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── NOTES ── */}
                    {activeTab === 'notes' && (
                        <div className="space-y-4">
                            {/* Add note */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                                <p className="font-bold text-gray-900 text-sm mb-3">Add Note</p>
                                <div className="flex gap-2 mb-3 flex-wrap">
                                    {NOTE_TYPES.map(t => (
                                        <button key={t} onClick={() => setNoteType(t)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${noteType === t ? NOTE_TYPE_COLORS[t] + ' ring-2 ring-current' : 'bg-gray-100 text-gray-500'}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                                <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                                    rows={3} placeholder="Write a note about this client…"
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 text-sm resize-none" />
                                <button onClick={handleAddNote} disabled={savingNote || !noteText.trim()}
                                    className="mt-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-bold disabled:opacity-50">
                                    {savingNote ? 'Saving…' : 'Add Note'}
                                </button>
                            </div>

                            {/* Notes list */}
                            {localNotes.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 bg-white rounded-2xl border border-gray-100">
                                    <FileText className="h-7 w-7 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No notes yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {localNotes.map((n: { id: string; note: string; note_type: string; created_at: string }) => (
                                        <div key={n.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-2 capitalize ${NOTE_TYPE_COLORS[n.note_type]}`}>
                                                        {n.note_type}
                                                    </span>
                                                    <p className="text-sm text-gray-800 leading-relaxed">{n.note}</p>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <button onClick={() => handleDeleteNote(n.id)}
                                                    className="text-gray-300 hover:text-red-400 transition-colors text-xs shrink-0">✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── PLANS ── */}
                    {activeTab === 'plans' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <Link href={`/trainer/plans?newFor=${clientId}`}
                                    className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors">
                                    + Assign Plan
                                </Link>
                            </div>
                            {plans?.plans?.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-400">
                                    <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    <p>No plans assigned yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {plans?.plans?.map((p: { id: string; plan_type: string; title: string; description?: string; is_active: boolean; starts_at?: string; ends_at?: string }) => (
                                        <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${p.plan_type === 'meal' ? 'bg-green-100 text-green-700' : p.plan_type === 'workout' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                            {p.plan_type}
                                                        </span>
                                                        {p.is_active && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Active</span>}
                                                    </div>
                                                    <p className="font-bold text-gray-900 text-sm">{p.title}</p>
                                                    {p.description && <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>}
                                                    {(p.starts_at || p.ends_at) && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {p.starts_at && `From ${new Date(p.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                                                            {p.ends_at && ` to ${new Date(p.ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── GOALS ── */}
                    {activeTab === 'goals' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button onClick={() => setShowAddGoal(true)}
                                    className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors">
                                    + Set Goal
                                </button>
                            </div>

                            {showAddGoal && (
                                <AddGoalForm clientId={clientId} onDone={() => setShowAddGoal(false)} />
                            )}

                            {goals?.goals?.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-400">
                                    <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    <p>No goals set yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {goals?.goals?.map((g: {
                                        id: string; title: string; goal_type: string; target_value?: number;
                                        current_value?: number; target_unit?: string; deadline?: string;
                                        status: string; notes?: string;
                                    }) => {
                                        const pct = g.target_value && g.current_value
                                            ? Math.min(100, Math.round((g.current_value / g.target_value) * 100))
                                            : null;
                                        return (
                                            <div key={g.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{g.title}</p>
                                                        <p className="text-xs text-gray-400 capitalize">{g.goal_type.replace('_', ' ')}</p>
                                                    </div>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${g.status === 'active' ? 'bg-green-100 text-green-700' : g.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {g.status}
                                                    </span>
                                                </div>
                                                {g.target_value && (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-xs text-gray-600">
                                                            <span>Current: {g.current_value ?? '—'}{g.target_unit}</span>
                                                            <span>Target: {g.target_value}{g.target_unit}</span>
                                                        </div>
                                                        {pct !== null && (
                                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {g.deadline && (
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        Deadline: {new Date(g.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// ── Add Goal inline form ──────────────────────────────────────────────────────
function AddGoalForm({ clientId, onDone }: { clientId: string; onDone: () => void }) {
    const [form, setForm] = useState({ title: '', goal_type: 'weight', target_value: '', current_value: '', target_unit: '', deadline: '', notes: '' });
    const [saving, setSaving] = useState(false);

    const GOAL_TYPES = ['weight', 'body_fat', 'muscle_mass', 'calories', 'protein', 'workout_frequency', 'custom'];
    const UNIT_SUGGESTIONS: Record<string, string> = { weight: 'kg', body_fat: '%', muscle_mass: 'kg', calories: 'kcal', protein: 'g', workout_frequency: 'days/week' };

    const handleSave = async () => {
        if (!form.title.trim()) { toast.error('Goal title is required'); return; }
        setSaving(true);
        const res = await setClientGoal(clientId, {
            title: form.title, goal_type: form.goal_type,
            target_value: form.target_value ? +form.target_value : undefined,
            current_value: form.current_value ? +form.current_value : undefined,
            target_unit: form.target_unit || UNIT_SUGGESTIONS[form.goal_type] || '',
            deadline: form.deadline || undefined,
            notes: form.notes || undefined,
        });
        setSaving(false);
        if (res?.error) { toast.error(res.error); } else { toast.success('Goal set!'); onDone(); }
    };

    return (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50 border border-orange-200 rounded-2xl p-5 space-y-3">
            <p className="font-bold text-gray-800 text-sm">Set a Goal</p>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Goal title" className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-orange-400" />
            <div className="flex gap-2 flex-wrap">
                {GOAL_TYPES.map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, goal_type: t, target_unit: UNIT_SUGGESTIONS[t] ?? '' }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-colors ${form.goal_type === t ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                        {t.replace('_', ' ')}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-gray-500 mb-1 block">Current value</label>
                    <input type="number" value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))}
                        placeholder="0" className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Target value</label>
                    <input type="number" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))}
                        placeholder="0" className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Unit</label>
                    <input value={form.target_unit} onChange={e => setForm(f => ({ ...f, target_unit: e.target.value }))}
                        placeholder={UNIT_SUGGESTIONS[form.goal_type] ?? ''}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Deadline</label>
                    <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none" /></div>
            </div>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Additional notes (optional)"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm resize-none focus:outline-none" />
            <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                    className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-bold disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save Goal'}
                </button>
                <button onClick={onDone} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">Cancel</button>
            </div>
        </motion.div>
    );
}
