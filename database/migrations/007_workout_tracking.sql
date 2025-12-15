-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Workout Logs Table
-- Stores the high-level details of a workout session
CREATE TABLE public.workout_logs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    log_date date NOT NULL, -- The date of the workout (can be different from created_at)
    
    -- Category Info
    category_id text NOT NULL, -- e.g., 'chest', 'legs', 'custom'
    custom_category_name text, -- Populated if category_id is 'custom'
    
    -- Metrics
    duration_minutes integer, -- How long the workout lasted
    intensity_level integer CHECK (intensity_level BETWEEN 1 AND 5), -- 1 (Easy) to 5 (Extreme)
    calories_burned integer, -- Optional estimation
    
    -- Meta
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT workout_logs_pkey PRIMARY KEY (id),
    CONSTRAINT workout_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Ensure one log per day? Or allow multiple? 
    -- Let's allow multiple, but UI currently handles one per day. 
    -- We can add a unique constraint if we want to strictly enforce one per day per user.
    CONSTRAINT unique_user_date_log UNIQUE (user_id, log_date)
);

-- 2. Workout Exercises Table
-- Stores the list of exercises performed in a specific workout log
CREATE TABLE public.workout_exercises (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    workout_log_id uuid NOT NULL,
    
    exercise_name text NOT NULL,
    is_custom boolean DEFAULT false, -- To track if it was a user-added exercise
    order_index integer NOT NULL DEFAULT 0, -- To maintain the order of exercises
    
    created_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT workout_exercises_pkey PRIMARY KEY (id),
    CONSTRAINT workout_exercises_workout_log_id_fkey FOREIGN KEY (workout_log_id) REFERENCES public.workout_logs(id) ON DELETE CASCADE
);

-- 3. Workout Sets Table
-- Stores the specific sets, reps, and weight for each exercise
CREATE TABLE public.workout_sets (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    workout_exercise_id uuid NOT NULL,
    
    set_number integer NOT NULL,
    weight_kg numeric, -- Allow decimals
    reps integer,
    rpe integer CHECK (rpe BETWEEN 1 AND 10), -- Rate of Perceived Exertion (Optional advanced feature)
    
    created_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT workout_sets_pkey PRIMARY KEY (id),
    CONSTRAINT workout_sets_workout_exercise_id_fkey FOREIGN KEY (workout_exercise_id) REFERENCES public.workout_exercises(id) ON DELETE CASCADE
);

-- 4. User Custom Exercises (Optional but recommended)
-- Saves custom exercises so the user doesn't have to type them every time
CREATE TABLE public.user_custom_exercises (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    default_category_id text, -- Optional: link to a category like 'chest'
    
    created_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT user_custom_exercises_pkey PRIMARY KEY (id),
    CONSTRAINT user_custom_exercises_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_exercise_name UNIQUE (user_id, name)
);

-- Row Level Security (RLS) Setup

-- Enable RLS
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_exercises ENABLE ROW LEVEL SECURITY;

-- Policies for workout_logs
CREATE POLICY "Users can view their own workout logs" 
    ON public.workout_logs FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout logs" 
    ON public.workout_logs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs" 
    ON public.workout_logs FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs" 
    ON public.workout_logs FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies for workout_exercises
-- (Access is controlled via the parent workout_log)
CREATE POLICY "Users can view exercises of their logs" 
    ON public.workout_exercises FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.workout_logs 
        WHERE workout_logs.id = workout_exercises.workout_log_id 
        AND workout_logs.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert exercises to their logs" 
    ON public.workout_exercises FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.workout_logs 
        WHERE workout_logs.id = workout_exercises.workout_log_id 
        AND workout_logs.user_id = auth.uid()
    ));

CREATE POLICY "Users can update exercises of their logs" 
    ON public.workout_exercises FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.workout_logs 
        WHERE workout_logs.id = workout_exercises.workout_log_id 
        AND workout_logs.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete exercises of their logs" 
    ON public.workout_exercises FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM public.workout_logs 
        WHERE workout_logs.id = workout_exercises.workout_log_id 
        AND workout_logs.user_id = auth.uid()
    ));

-- Policies for workout_sets
-- (Access is controlled via the grandparent workout_log)
CREATE POLICY "Users can view sets of their exercises" 
    ON public.workout_sets FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.workout_exercises
        JOIN public.workout_logs ON workout_logs.id = workout_exercises.workout_log_id
        WHERE workout_exercises.id = workout_sets.workout_exercise_id 
        AND workout_logs.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert sets to their exercises" 
    ON public.workout_sets FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.workout_exercises
        JOIN public.workout_logs ON workout_logs.id = workout_exercises.workout_log_id
        WHERE workout_exercises.id = workout_sets.workout_exercise_id 
        AND workout_logs.user_id = auth.uid()
    ));

CREATE POLICY "Users can update sets of their exercises" 
    ON public.workout_sets FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.workout_exercises
        JOIN public.workout_logs ON workout_logs.id = workout_exercises.workout_log_id
        WHERE workout_exercises.id = workout_sets.workout_exercise_id 
        AND workout_logs.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete sets of their exercises" 
    ON public.workout_sets FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM public.workout_exercises
        JOIN public.workout_logs ON workout_logs.id = workout_exercises.workout_log_id
        WHERE workout_exercises.id = workout_sets.workout_exercise_id 
        AND workout_logs.user_id = auth.uid()
    ));

-- Policies for user_custom_exercises
CREATE POLICY "Users can manage their custom exercises" 
    ON public.user_custom_exercises FOR ALL 
    USING (auth.uid() = user_id);
