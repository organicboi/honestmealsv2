'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Dumbbell, Zap, Target, Trophy, Calendar, Clock, TrendingUp, 
    Activity, Flame, Sparkles, Music, Coffee, X, Plus, Save, Trash2, 
    ChevronRight, ChevronLeft, AlertCircle, Filter,
    Shield, Anchor, Footprints, ArrowUp, ArrowDown, BicepsFlexed, 
    LayoutGrid, HeartPulse, Flower2, PersonStanding, Swords
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from "sonner";
import { 
    getWorkoutLogs, saveWorkoutLog, deleteWorkoutLog, 
    getCustomExercises, saveCustomExercise, 
    type WorkoutLog 
} from '@/app/actions/workout';

// --- Constants & Data ---

const workoutCategories = [
  // Single Muscle
  { id: 'chest', label: 'Chest Day', icon: 'chest.png', type: 'strength' },
  { id: 'back', label: 'Back Day', icon: 'back.png', type: 'strength' },
  { id: 'legs', label: 'Leg Day', icon: 'legs.png', type: 'strength' },
  { id: 'shoulders', label: 'Shoulder Day', icon: 'shoulders.png', type: 'strength' },
  { id: 'arms', label: 'Arm Day (Bi/Tri)', icon: 'arms.png', type: 'strength' },
  { id: 'abs', label: 'Abs & Core', icon: 'abs.png', type: 'strength' },
  
  // Split Combos
  { id: 'chest_tri', label: 'Chest + Triceps', icon: 'chest.png', type: 'strength' },
  { id: 'back_bi', label: 'Back + Biceps', icon: 'back.png', type: 'strength' },
  { id: 'legs_shoulders', label: 'Legs + Shoulders', icon: 'legs.png', type: 'strength' },
  
  // Functional/Splits
  { id: 'push', label: 'Push Day', icon: 'push.png', type: 'strength' },
  { id: 'pull', label: 'Pull Day', icon: 'pull.png', type: 'strength' },
  { id: 'upper', label: 'Upper Body', icon: 'upper.png', type: 'strength' },
  { id: 'lower', label: 'Lower Body', icon: 'lower.png', type: 'strength' },
  { id: 'full_body', label: 'Full Body', icon: 'upper.png', type: 'strength' },

  // Cardio & Other
  { id: 'cardio', label: 'Cardio (Steady)', icon: 'cardio.png', type: 'cardio' },
  { id: 'hiit', label: 'HIIT', icon: 'hiit.png', type: 'cardio' },
  { id: 'yoga', label: 'Yoga', icon: 'cardio.png', type: 'flexibility' },
  { id: 'pilates', label: 'Pilates', icon: 'cardio.png', type: 'flexibility' },
  { id: 'crossfit', label: 'CrossFit', icon: 'crossfit.png', type: 'strength' },
  { id: 'dance', label: 'Dance / Zumba', icon: 'dance.png', type: 'cardio' },
  { id: 'calisthenics', label: 'Calisthenics', icon: 'calisthenics.png', type: 'strength' },
  { id: 'rest', label: 'Rest Day', icon: 'Coffee', type: 'rest' },
  { id: 'custom', label: 'Custom / Other', icon: 'Dumbbell', type: 'other' },
];

const defaultExerciseDatabase: Record<string, string[]> = {
  chest: ['Bench Press', 'Incline Dumbbell Press', 'Cable Flys', 'Push Ups', 'Dips', 'Chest Press Machine', 'Pec Deck'],
  back: ['Lat Pulldowns', 'Pull Ups', 'Deadlifts', 'Barbell Rows', 'Seated Cable Row', 'T-Bar Row', 'Face Pulls', 'Single Arm Dumbbell Row'],
  legs: ['Squats', 'Leg Press', 'Lunges', 'Romanian Deadlifts', 'Leg Extensions', 'Hamstring Curls', 'Calf Raises', 'Hip Thrusts', 'Bulgarian Split Squats'],
  shoulders: ['Overhead Press', 'Lateral Raises', 'Front Raises', 'Arnold Press', 'Rear Delt Flys', 'Upright Rows', 'Shrugs'],
  biceps: ['Barbell Curls', 'Hammer Curls', 'Preacher Curls', 'Concentration Curls', 'Cable Bicep Curls'],
  triceps: ['Tricep Pushdowns', 'Skull Crushers', 'Overhead Extensions', 'Close Grip Bench Press', 'Bench Dips'],
  abs: ['Plank', 'Crunches', 'Leg Raises', 'Russian Twists', 'Ab Wheel Rollout', 'Hanging Leg Raises'],
  cardio: ['Treadmill Run', 'Cycling', 'Elliptical', 'Rowing Machine', 'Jump Rope', 'Stair Master', 'Swimming'],
  yoga: ['Sun Salutation', 'Warrior Flow', 'Vinyasa', 'Hatha', 'Restorative', 'Yin Yoga'],
  hiit: ['Burpees', 'Box Jumps', 'Mountain Climbers', 'Kettlebell Swings', 'Battle Ropes', 'Sprints'],
  crossfit: ['Thrusters', 'Snatches', 'Clean & Jerk', 'Wall Balls', 'Double Unders', 'Muscle Ups'],
  calisthenics: ['Muscle Ups', 'Pistol Squats', 'Handstand Pushups', 'Front Lever', 'Human Flag'],
  rest: ['Stretching', 'Foam Rolling', 'Light Walk', 'Nap', 'Meditation'],
  custom: []
};

// Helper to get exercises based on category ID
const getExercisesForCategory = (categoryId: string, customExercises: string[] = []): string[] => {
    let exercises: string[] = [];
    
    if (defaultExerciseDatabase[categoryId]) {
        exercises = [...defaultExerciseDatabase[categoryId]];
    } else {
        // Combo Logic
        if (categoryId === 'chest_tri') exercises = [...defaultExerciseDatabase.chest, ...defaultExerciseDatabase.triceps];
        else if (categoryId === 'back_bi') exercises = [...defaultExerciseDatabase.back, ...defaultExerciseDatabase.biceps];
        else if (categoryId === 'legs_shoulders') exercises = [...defaultExerciseDatabase.legs, ...defaultExerciseDatabase.shoulders];
        else if (categoryId === 'push') exercises = [...defaultExerciseDatabase.chest, ...defaultExerciseDatabase.shoulders, ...defaultExerciseDatabase.triceps];
        else if (categoryId === 'pull') exercises = [...defaultExerciseDatabase.back, ...defaultExerciseDatabase.biceps];
        else if (categoryId === 'upper') exercises = [...defaultExerciseDatabase.chest, ...defaultExerciseDatabase.back, ...defaultExerciseDatabase.shoulders, ...defaultExerciseDatabase.biceps, ...defaultExerciseDatabase.triceps];
        else if (categoryId === 'lower') exercises = [...defaultExerciseDatabase.legs, ...defaultExerciseDatabase.abs];
        else if (categoryId === 'full_body') exercises = [...defaultExerciseDatabase.legs, ...defaultExerciseDatabase.chest, ...defaultExerciseDatabase.back, ...defaultExerciseDatabase.shoulders];
        else if (categoryId === 'arms') exercises = [...defaultExerciseDatabase.biceps, ...defaultExerciseDatabase.triceps];
    }

    // Add custom exercises if category is custom or just append to list if needed
    // For now, we only show custom exercises in the 'custom' category or append them generally?
    // The user requirement implies "Custom" category might have its own list, 
    // but usually custom exercises can be anything. 
    // Let's append the user's custom exercises to the 'custom' category list.
    if (categoryId === 'custom') {
        return [...exercises, ...customExercises];
    }

    return exercises;
};

// --- Types ---

interface ExerciseSet {
    reps: string;
    weight: string;
}

interface LoggedExercise {
    id: string;
    name: string;
    sets: ExerciseSet[];
}

interface DayLog {
    id?: string; // Database ID
    date: string; // YYYY-MM-DD
    category: string; // id from workoutCategories
    customCategoryName?: string;
    duration?: string;
    intensity?: number;
    exercises: LoggedExercise[];
    notes: string;
}

interface WorkoutClientProps {
    user: any;
}

// --- Component ---

export default function WorkoutClient({ user }: WorkoutClientProps) {
    // State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [logs, setLogs] = useState<Record<string, DayLog>>({}); // Key is YYYY-MM-DD
    const [loading, setLoading] = useState(true);
    const [customExercises, setCustomExercises] = useState<string[]>([]);
    
    // Modal State
    const [selectedDate, setSelectedDate] = useState<string | null>(null); // YYYY-MM-DD
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLog, setCurrentLog] = useState<DayLog>({
        date: '',
        category: '',
        exercises: [],
        notes: ''
    });
    
    // Custom Exercise Input State
    const [newCustomExerciseName, setNewCustomExerciseName] = useState('');
    const [isAddingCustomExercise, setIsAddingCustomExercise] = useState(false);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            // Get start and end of current month view
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);

            // Format for DB query
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const [fetchedLogs, fetchedCustomExercises] = await Promise.all([
                getWorkoutLogs(startStr, endStr),
                getCustomExercises()
            ]);

            if (fetchedLogs) {
                const logsMap: Record<string, DayLog> = {};
                fetchedLogs.forEach((log: any) => {
                    logsMap[log.log_date] = {
                        id: log.id,
                        date: log.log_date,
                        category: log.category_id,
                        customCategoryName: log.custom_category_name,
                        duration: log.duration_minutes?.toString(),
                        intensity: log.intensity_level,
                        notes: log.notes || '',
                        exercises: log.exercises.map((ex: any) => ({
                            id: ex.id || Math.random().toString(),
                            name: ex.exercise_name,
                            sets: ex.sets.map((s: any) => ({
                                reps: s.reps?.toString() || '',
                                weight: s.weight_kg?.toString() || ''
                            }))
                        }))
                    };
                });
                setLogs(logsMap);
            }

            if (fetchedCustomExercises) {
                setCustomExercises(fetchedCustomExercises);
            }

        } catch (error) {
            console.error("Error fetching workout data:", error);
            toast.error("Failed to load workout history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentDate, user.id]);

    // Calendar Helpers
    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const days = [];
        const startPadding = firstDay.getDay(); // 0 = Sunday
        
        // Previous month padding
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startPadding - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDay - i, type: 'prev', date: new Date(year, month - 1, prevMonthLastDay - i) });
        }
        
        // Current month days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ day: i, type: 'current', date: new Date(year, month, i) });
        }
        
        // Next month padding (to fill 6 rows = 42 cells)
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({ day: i, type: 'next', date: new Date(year, month + 1, i) });
        }
        
        return days;
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handlePrevYear = () => {
        setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
    };

    const handleNextYear = () => {
        setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
    };

    const isFutureDate = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date > today;
    };

    const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

    // Modal & Interaction
    const handleDayClick = (date: Date) => {
        if (isFutureDate(date)) return;

        const dateKey = formatDateKey(date);
        setSelectedDate(dateKey);
        
        if (logs[dateKey]) {
            setCurrentLog(logs[dateKey]);
        } else {
            setCurrentLog({
                date: dateKey,
                category: '',
                exercises: [],
                notes: ''
            });
        }
        setIsModalOpen(true);
    };

    // Save Log
    const handleSave = async () => {
        if (!selectedDate || !currentLog.category) return;

        try {
            await saveWorkoutLog({
                id: currentLog.id,
                date: selectedDate,
                category_id: currentLog.category,
                custom_category_name: currentLog.customCategoryName,
                duration: currentLog.duration ? parseInt(currentLog.duration) : undefined,
                intensity: currentLog.intensity,
                notes: currentLog.notes,
                exercises: currentLog.exercises.map(ex => ({
                    name: ex.name,
                    sets: ex.sets.map(s => ({
                        reps: s.reps ? parseInt(s.reps) : 0,
                        weight: s.weight ? parseFloat(s.weight) : 0
                    }))
                }))
            });

            toast.success("Workout saved successfully!");
            fetchData(); // Refresh data
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving workout:", error);
            toast.error("An error occurred while saving");
        }
    };

    // Delete Log
    const handleDelete = async () => {
        if (!currentLog.id) return;
        
        // Use a custom toast with action for confirmation or just a simple confirm for now
        // Since we want better UI/UX, let's stick to window.confirm for safety or implement a dialog later.
        // For now, keeping confirm but using toast for result.
        if (confirm("Are you sure you want to delete this workout log?")) {
            try {
                await deleteWorkoutLog(currentLog.id);
                toast.success("Workout deleted");
                fetchData();
                setIsModalOpen(false);
            } catch (error) {
                console.error("Error deleting workout:", error);
                toast.error("An error occurred while deleting");
            }
        }
    };

    // Form Handlers
    const addExercise = (exerciseName: string) => {
        setCurrentLog(prev => ({
            ...prev,
            exercises: [
                ...prev.exercises,
                { id: Math.random().toString(36).substr(2, 9), name: exerciseName, sets: [{ reps: '', weight: '' }] }
            ]
        }));
    };

    const handleAddCustomExercise = async () => {
        if (newCustomExerciseName.trim()) {
            const name = newCustomExerciseName.trim();
            
            // Optimistically add to list
            setCustomExercises(prev => [...prev, name]);
            
            // Save to DB
            await saveCustomExercise(name);
            
            // Add to current log
            addExercise(name);
            
            setNewCustomExerciseName('');
            setIsAddingCustomExercise(false);
        }
    };

    const removeExercise = (exerciseId: string) => {
        setCurrentLog(prev => ({
            ...prev,
            exercises: prev.exercises.filter(e => e.id !== exerciseId)
        }));
    };

    const addSet = (exerciseId: string) => {
        setCurrentLog(prev => ({
            ...prev,
            exercises: prev.exercises.map(e => 
                e.id === exerciseId 
                    ? { ...e, sets: [...e.sets, { reps: '', weight: '' }] }
                    : e
            )
        }));
    };

    const updateSet = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: string) => {
        setCurrentLog(prev => ({
            ...prev,
            exercises: prev.exercises.map(e => 
                e.id === exerciseId 
                    ? { 
                        ...e, 
                        sets: e.sets.map((s, i) => i === setIndex ? { ...s, [field]: value } : s) 
                      }
                    : e
            )
        }));
    };

    // Icon Renderer
    const getIcon = (iconName: string) => {
        // Handle PNG images
        if (iconName.endsWith('.png')) {
            return (
                <img 
                    src={`/assets/images/gym-icons/${iconName}`} 
                    alt="workout icon" 
                    className="h-6 w-6 object-contain"
                />
            );
        }
        
        // Fallback to Lucide icons for rest/custom
        switch (iconName) {
            case 'Dumbbell': return <Dumbbell className="h-6 w-6" />;
            case 'Coffee': return <Coffee className="h-6 w-6" />;
            default: return <Dumbbell className="h-6 w-6" />;
        }
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-orange-100 pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Workout Tracker</h1>
                    <p className="text-gray-600">Track your monthly fitness journey</p>
                </div>

                {/* Quick Stats (Monthly) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl p-4 shadow-lg border border-orange-100"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Zap className="h-8 w-8 text-yellow-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {Object.values(logs).reduce((acc, log) => acc + (log.duration ? parseInt(log.duration) : 0), 0)}
                        </p>
                        <p className="text-sm text-gray-600">Monthly Minutes</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl p-4 shadow-lg border border-green-100"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Target className="h-8 w-8 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{Object.keys(logs).length}</p>
                        <p className="text-sm text-gray-600">Workouts This Month</p>
                    </motion.div>

                    {/* Placeholder for Streak - would need more complex logic across months */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl p-4 shadow-lg border border-orange-100"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Trophy className="h-8 w-8 text-orange-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {/* Simple streak calculation for current month view */}
                            {(() => {
                                let streak = 0;
                                const today = new Date();
                                const todayKey = formatDateKey(today);
                                // This is a very basic streak check within loaded logs
                                // Real streak needs global history
                                return "Active"; 
                            })()}
                        </p>
                        <p className="text-sm text-gray-600">Status</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl p-4 shadow-lg border border-blue-100"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="h-8 w-8 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {Object.keys(logs).length > 0 
                                ? Math.round(Object.values(logs).reduce((acc, log) => acc + (log.duration ? parseInt(log.duration) : 0), 0) / Object.keys(logs).length)
                                : 0}m
                        </p>
                        <p className="text-sm text-gray-600">Avg Duration</p>
                    </motion.div>
                </div>

                {/* Filter & Navigation Section */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        {/* Month Navigation */}
                        <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
                            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 hover:bg-white hover:shadow-sm rounded-lg">
                                <ChevronLeft className="h-4 w-4 text-gray-600" />
                            </Button>
                            <div className="px-3 font-bold text-gray-900 min-w-[90px] text-center text-sm">
                                {monthNames[currentDate.getMonth()]}
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleNextMonth} disabled={isFutureDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="h-8 w-8 hover:bg-white hover:shadow-sm rounded-lg">
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                            </Button>
                        </div>

                        {/* Year Navigation */}
                        <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
                            <Button variant="ghost" size="icon" onClick={handlePrevYear} className="h-8 w-8 hover:bg-white hover:shadow-sm rounded-lg">
                                <ChevronLeft className="h-4 w-4 text-gray-600" />
                            </Button>
                            <div className="px-3 font-bold text-gray-900 min-w-[50px] text-center text-sm">
                                {currentDate.getFullYear()}
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleNextYear} disabled={isFutureDate(new Date(currentDate.getFullYear() + 1, 0, 1))} className="h-8 w-8 hover:bg-white hover:shadow-sm rounded-lg">
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Monthly Calendar Grid */}
                <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 border border-gray-100">
                    {/* Days Header */}
                    <div className="grid grid-cols-7 gap-3 mb-4 text-center">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-3">
                        {getDaysInMonth().map((dateObj, index) => {
                            const dateKey = formatDateKey(dateObj.date);
                            const log = logs[dateKey];
                            const category = log ? workoutCategories.find(c => c.id === log.category) : null;
                            const isFuture = isFutureDate(dateObj.date);
                            const isCurrentMonth = dateObj.type === 'current';
                            const isToday = dateKey === formatDateKey(new Date());

                            return (
                                <motion.button
                                    key={`${dateKey}-${index}`}
                                    whileHover={!isFuture ? { scale: 1.05 } : {}}
                                    whileTap={!isFuture ? { scale: 0.95 } : {}}
                                    onClick={() => handleDayClick(dateObj.date)}
                                    disabled={isFuture}
                                    className={`
                                        aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all relative
                                        ${!isCurrentMonth ? 'opacity-40 bg-gray-50' : ''}
                                        ${isFuture ? 'cursor-not-allowed opacity-30 bg-gray-100' : 'cursor-pointer hover:shadow-md hover:bg-white'}
                                        ${log 
                                            ? 'bg-linear-to-br from-orange-100 to-orange-50 border-2 border-orange-200 shadow-md shadow-orange-100' 
                                            : 'bg-gray-50 border-2 border-transparent hover:border-orange-200'
                                        }
                                        ${isToday ? 'ring-2 ring-orange-400 ring-offset-2' : ''}
                                    `}
                                >
                                    <span className={`text-xs font-bold mb-1 ${log ? 'text-orange-800' : 'text-gray-500'}`}>
                                        {dateObj.day}
                                    </span>
                                    
                                    {log && category ? (
                                        <div className="flex flex-col items-center w-full">
                                            <div className="text-orange-600 mb-1">
                                                {getIcon(category.icon)}
                                            </div>
                                            <span className="text-[10px] font-bold text-orange-800 truncate w-full text-center hidden sm:block">
                                                {category.label.split(' ')[0]}
                                            </span>
                                        </div>
                                    ) : (
                                        !isFuture && (
                                            <div className="w-1 h-1 rounded-full bg-gray-200 mt-2" />
                                        )
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: '100%' }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 500 }}
                            className="fixed inset-0 z-[60] bg-white flex flex-col md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:h-[85vh] md:rounded-3xl md:shadow-2xl md:overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 backdrop-blur-md sticky top-0 z-10">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Log Workout'}
                                    </h3>
                                    <p className="text-xs text-gray-500">Record your workout details</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {currentLog.id && (
                                        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-red-500 hover:bg-red-50 rounded-full">
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full bg-gray-100 hover:bg-gray-200">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Modal Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 md:pb-4">
                                
                                {/* Step 1: Category */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">1. Select Workout Type</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {workoutCategories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setCurrentLog(prev => ({ ...prev, category: cat.id, exercises: [] }))}
                                                className={`
                                                    p-3 rounded-xl text-sm font-medium text-left flex items-center gap-2 transition-all border
                                                    ${currentLog.category === cat.id 
                                                        ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-200' 
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                                                    }
                                                `}
                                            >
                                                {getIcon(cat.icon)}
                                                <span className="truncate">{cat.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {currentLog.category === 'custom' && (
                                        <div className="mt-2">
                                            <Input 
                                                placeholder="Enter Workout Name (e.g., Murph, 5k Run)" 
                                                value={currentLog.customCategoryName || ''}
                                                onChange={(e) => setCurrentLog(prev => ({ ...prev, customCategoryName: e.target.value }))}
                                                className="bg-white"
                                            />
                                        </div>
                                    )}
                                </div>

                                {currentLog.category && (
                                    <>
                                        {/* Step 2: Add Exercises */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">2. Add Exercises</label>
                                            <div className="flex flex-wrap gap-2">
                                                {getExercisesForCategory(currentLog.category, customExercises).map(ex => (
                                                    <button
                                                        key={ex}
                                                        onClick={() => addExercise(ex)}
                                                        className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm hover:bg-orange-100 hover:text-orange-700 transition-colors flex items-center gap-1"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                        {ex}
                                                    </button>
                                                ))}
                                                
                                                {/* Custom Exercise Button */}
                                                {isAddingCustomExercise ? (
                                                    <div className="flex items-center gap-2">
                                                        <Input 
                                                            value={newCustomExerciseName}
                                                            onChange={(e) => setNewCustomExerciseName(e.target.value)}
                                                            placeholder="Exercise Name"
                                                            className="h-8 w-32 text-sm"
                                                            autoFocus
                                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomExercise()}
                                                        />
                                                        <Button size="sm" onClick={handleAddCustomExercise} className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700">
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setIsAddingCustomExercise(false)} className="h-8 w-8 p-0">
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setIsAddingCustomExercise(true)}
                                                        className="px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-500 text-sm hover:border-orange-300 hover:text-orange-600 transition-colors flex items-center gap-1"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                        Custom
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Step 3: Log Details */}
                                        {currentLog.exercises.length > 0 && (
                                            <div className="space-y-4">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">3. Log Sets & Reps</label>
                                                {currentLog.exercises.map((exercise, exIndex) => (
                                                    <Card key={exercise.id} className="p-4 border-gray-200 shadow-sm">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="font-bold text-gray-900">{exercise.name}</h4>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                onClick={() => removeExercise(exercise.id)}
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 rounded-full"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        
                                                        <div className="space-y-2">
                                                            <div className="grid grid-cols-6 gap-2 text-xs font-medium text-gray-500 mb-1 px-1">
                                                                <div className="col-span-1">Set</div>
                                                                <div className="col-span-2">kg</div>
                                                                <div className="col-span-2">Reps</div>
                                                            </div>
                                                            {exercise.sets.map((set, setIndex) => (
                                                                <div key={setIndex} className="grid grid-cols-6 gap-2 items-center">
                                                                    <div className="col-span-1 flex justify-center">
                                                                        <span className="bg-gray-100 text-gray-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                                                            {setIndex + 1}
                                                                        </span>
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <Input 
                                                                            type="number" 
                                                                            placeholder="0" 
                                                                            className="h-8 text-center"
                                                                            value={set.weight}
                                                                            onChange={(e) => updateSet(exercise.id, setIndex, 'weight', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <Input 
                                                                            type="number" 
                                                                            placeholder="0" 
                                                                            className="h-8 text-center"
                                                                            value={set.reps}
                                                                            onChange={(e) => updateSet(exercise.id, setIndex, 'reps', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                onClick={() => addSet(exercise.id)}
                                                                className="w-full mt-2 h-8 text-xs border-dashed border-gray-300 text-gray-500 hover:text-orange-600 hover:border-orange-300"
                                                            >
                                                                <Plus className="h-3 w-3 mr-1" /> Add Set
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}

                                        {/* Step 4: Notes & Details */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">4. Details & Notes</label>
                                            
                                            <div className="grid grid-cols-2 gap-4 mb-2">
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">Duration (min)</label>
                                                    <Input 
                                                        type="number" 
                                                        placeholder="45" 
                                                        value={currentLog.duration || ''}
                                                        onChange={(e) => setCurrentLog(prev => ({ ...prev, duration: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">Intensity (1-10)</label>
                                                    <Input 
                                                        type="number" 
                                                        min="1" 
                                                        max="10" 
                                                        placeholder="7" 
                                                        value={currentLog.intensity || ''}
                                                        onChange={(e) => setCurrentLog(prev => ({ ...prev, intensity: parseInt(e.target.value) || undefined }))}
                                                    />
                                                </div>
                                            </div>

                                            <textarea
                                                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[80px]"
                                                placeholder="How did it feel? Any pain or PRs?"
                                                value={currentLog.notes}
                                                onChange={(e) => setCurrentLog(prev => ({ ...prev, notes: e.target.value }))}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                                <Button 
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-orange-200"
                                    onClick={handleSave}
                                    disabled={!currentLog.category}
                                >
                                    <Save className="h-5 w-5 mr-2" />
                                    Save Workout
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
