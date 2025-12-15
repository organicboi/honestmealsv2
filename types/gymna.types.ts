// Gymna AI Types for Dialogue-Based Plan Generation

// ==================== Dialogue System Types ====================

export type PlanType = 'diet' | 'workout';

export interface DialogueQuestion {
    id: string;
    question: string;
    type: 'text' | 'select' | 'number' | 'multiselect';
    options?: string[];
    placeholder?: string;
    validation?: {
        required?: boolean;
        min?: number;
        max?: number;
        pattern?: RegExp;
    };
}

export interface DialogueResponse {
    questionId: string;
    answer: string | string[] | number;
}

export interface DialogueState {
    planType: PlanType;
    currentStep: number;
    responses: DialogueResponse[];
    isComplete: boolean;
}

// ==================== Diet Plan Types ====================

export interface DietMeal {
    mealName: string;
    time: string;
    foods: {
        item: string;
        quantity: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    }[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    notes?: string;
}

export interface DietPlanData {
    title: string;
    goalType: string;
    totalDailyCalories: number;
    totalDailyProtein: number;
    totalDailyCarbs: number;
    totalDailyFat: number;
    preference: 'veg' | 'non-veg' | 'vegan';
    meals: DietMeal[];
    guidelines?: string[];
    hydration?: {
        dailyWaterIntake: string;
        tips?: string[];
    };
    supplements?: {
        name: string;
        timing: string;
        purpose: string;
    }[];
}

// ==================== Workout Plan Types ====================

export interface WorkoutExercise {
    exerciseName: string;
    sets: number;
    reps: string;
    rest: string;
    notes?: string;
    targetMuscle?: string;
}

export interface WorkoutDay {
    day: string;
    focus: string;
    duration: string;
    warmup?: string[];
    exercises: WorkoutExercise[];
    cooldown?: string[];
    notes?: string;
}

export interface WorkoutPlanData {
    title: string;
    goalType: string;
    experienceLevel: string;
    daysPerWeek: number;
    equipment: string;
    schedule: WorkoutDay[];
    guidelines?: string[];
    progressionTips?: string[];
    injuryPrevention?: string[];
}

// ==================== AI Response Types ====================

export interface AIResponse {
    success: boolean;
    rawResponse: string;
    planType: PlanType;
    data?: DietPlanData | WorkoutPlanData;
    error?: string;
}

export interface ParsedPlanResponse {
    planType: PlanType;
    planTitle: string;
    rawJson: any;
    parsedData: DietPlanData | WorkoutPlanData;
    metadata: {
        generatedAt: string;
        questionResponses: DialogueResponse[];
    };
}

// ==================== Database Types ====================

export interface GymnaPlanData {
    id: string;
    chat_id: string;
    message_id: string;
    user_id: string;
    plan_type: PlanType;
    plan_title: string;
    raw_json: any;
    parsed_data: DietPlanData | WorkoutPlanData;
    metadata: any;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ==================== Dialogue Configuration ====================

export const DIET_PLAN_QUESTIONS: DialogueQuestion[] = [
    {
        id: 'preference',
        question: 'What is your dietary preference?',
        type: 'select',
        options: ['Vegetarian', 'Non-Vegetarian', 'Vegan'],
        validation: { required: true }
    },
    {
        id: 'goal',
        question: 'What is your primary goal?',
        type: 'select',
        options: ['Lose Weight', 'Gain Muscle', 'Maintain Weight', 'General Health'],
        validation: { required: true }
    },
    {
        id: 'weight',
        question: 'What is your current weight (in kg)?',
        type: 'number',
        placeholder: 'e.g., 70',
        validation: { required: true, min: 30, max: 300 }
    },
    {
        id: 'height',
        question: 'What is your height (in cm)?',
        type: 'number',
        placeholder: 'e.g., 175',
        validation: { required: true, min: 100, max: 250 }
    },
    {
        id: 'activityLevel',
        question: 'What is your activity level?',
        type: 'select',
        options: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active'],
        validation: { required: true }
    },
    {
        id: 'allergies',
        question: 'Do you have any food allergies or restrictions?',
        type: 'text',
        placeholder: 'e.g., Lactose intolerant, No nuts',
        validation: { required: false }
    },
    {
        id: 'cuisine',
        question: 'Preferred cuisine or region?',
        type: 'select',
        options: ['Indian', 'Western', 'Mediterranean', 'Asian', 'Mixed'],
        validation: { required: true }
    },
    {
        id: 'mealsPerDay',
        question: 'How many meals per day do you prefer?',
        type: 'select',
        options: ['3 Meals', '4 Meals', '5 Meals', '6 Meals'],
        validation: { required: true }
    }
];

export const WORKOUT_PLAN_QUESTIONS: DialogueQuestion[] = [
    {
        id: 'goal',
        question: 'What is your fitness goal?',
        type: 'select',
        options: ['Build Strength', 'Gain Muscle (Hypertrophy)', 'Increase Endurance', 'Weight Loss', 'General Fitness'],
        validation: { required: true }
    },
    {
        id: 'experience',
        question: 'What is your training experience level?',
        type: 'select',
        options: ['Beginner (0-6 months)', 'Intermediate (6 months - 2 years)', 'Advanced (2+ years)'],
        validation: { required: true }
    },
    {
        id: 'equipment',
        question: 'What equipment do you have access to?',
        type: 'select',
        options: ['Full Gym', 'Dumbbells Only', 'Resistance Bands', 'Bodyweight Only', 'Home Gym'],
        validation: { required: true }
    },
    {
        id: 'daysPerWeek',
        question: 'How many days per week can you train?',
        type: 'select',
        options: ['3 Days', '4 Days', '5 Days', '6 Days'],
        validation: { required: true }
    },
    {
        id: 'sessionDuration',
        question: 'How long can each workout session be?',
        type: 'select',
        options: ['30 minutes', '45 minutes', '60 minutes', '90 minutes'],
        validation: { required: true }
    },
    {
        id: 'injuries',
        question: 'Do you have any injuries or limitations?',
        type: 'text',
        placeholder: 'e.g., Lower back pain, Knee issues',
        validation: { required: false }
    },
    {
        id: 'focusAreas',
        question: 'Which areas do you want to focus on?',
        type: 'multiselect',
        options: ['Upper Body', 'Lower Body', 'Core', 'Cardio', 'Full Body'],
        validation: { required: true }
    }
];
