-- Optimization for Workout Tracking Performance
-- This migration adds critical indexes and optimizes RLS policies

-- ===========================
-- 1. ADD CRITICAL INDEXES
-- ===========================

-- Index for workout_logs queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date 
    ON public.workout_logs(user_id, log_date DESC);

-- Index for workout_exercises (JOIN performance)
CREATE INDEX IF NOT EXISTS idx_workout_exercises_log_id 
    ON public.workout_exercises(workout_log_id);

-- Index for workout_sets (JOIN performance)
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id 
    ON public.workout_sets(workout_exercise_id);

-- Index for custom exercises lookup
CREATE INDEX IF NOT EXISTS idx_user_custom_exercises_user_id 
    ON public.user_custom_exercises(user_id);

-- ===========================
-- 2. OPTIMIZE RLS POLICIES
-- ===========================

-- Drop existing slow policies for workout_exercises
DROP POLICY IF EXISTS "Users can view exercises of their logs" ON public.workout_exercises;
DROP POLICY IF EXISTS "Users can insert exercises to their logs" ON public.workout_exercises;
DROP POLICY IF EXISTS "Users can update exercises of their logs" ON public.workout_exercises;
DROP POLICY IF EXISTS "Users can delete exercises of their logs" ON public.workout_exercises;

-- Create optimized policies using security definer functions
-- This avoids nested subquery evaluation on every row

CREATE OR REPLACE FUNCTION public.user_owns_workout_log(log_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workout_logs 
        WHERE id = log_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate exercise policies with function
CREATE POLICY "Users can view exercises of their logs" 
    ON public.workout_exercises FOR SELECT 
    USING (public.user_owns_workout_log(workout_log_id));

CREATE POLICY "Users can insert exercises to their logs" 
    ON public.workout_exercises FOR INSERT 
    WITH CHECK (public.user_owns_workout_log(workout_log_id));

CREATE POLICY "Users can update exercises of their logs" 
    ON public.workout_exercises FOR UPDATE 
    USING (public.user_owns_workout_log(workout_log_id));

CREATE POLICY "Users can delete exercises of their logs" 
    ON public.workout_exercises FOR DELETE 
    USING (public.user_owns_workout_log(workout_log_id));

-- Drop existing slow policies for workout_sets
DROP POLICY IF EXISTS "Users can view sets of their exercises" ON public.workout_sets;
DROP POLICY IF EXISTS "Users can insert sets to their exercises" ON public.workout_sets;
DROP POLICY IF EXISTS "Users can update sets of their exercises" ON public.workout_sets;
DROP POLICY IF EXISTS "Users can delete sets of their exercises" ON public.workout_sets;

-- Create optimized function for sets
CREATE OR REPLACE FUNCTION public.user_owns_workout_exercise(exercise_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workout_exercises we
        INNER JOIN public.workout_logs wl ON wl.id = we.workout_log_id
        WHERE we.id = exercise_id AND wl.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate set policies with function
CREATE POLICY "Users can view sets of their exercises" 
    ON public.workout_sets FOR SELECT 
    USING (public.user_owns_workout_exercise(workout_exercise_id));

CREATE POLICY "Users can insert sets to their exercises" 
    ON public.workout_sets FOR INSERT 
    WITH CHECK (public.user_owns_workout_exercise(workout_exercise_id));

CREATE POLICY "Users can update sets of their exercises" 
    ON public.workout_sets FOR UPDATE 
    USING (public.user_owns_workout_exercise(workout_exercise_id));

CREATE POLICY "Users can delete sets of their exercises" 
    ON public.workout_sets FOR DELETE 
    USING (public.user_owns_workout_exercise(workout_exercise_id));

-- ===========================
-- 3. ANALYZE TABLES
-- ===========================

ANALYZE public.workout_logs;
ANALYZE public.workout_exercises;
ANALYZE public.workout_sets;
ANALYZE public.user_custom_exercises;

-- ===========================
-- PERFORMANCE NOTES
-- ===========================
-- 
-- These optimizations should significantly improve performance:
-- 1. Indexes allow fast lookups by user_id and date ranges
-- 2. Security definer functions cache the ownership check
-- 3. Batch inserts in application code reduce round trips
-- 4. ANALYZE updates query planner statistics
