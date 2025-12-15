-- ===============================================
-- COMPREHENSIVE PERFORMANCE OPTIMIZATION
-- For all tables and queries in the Honest Meals app
-- ===============================================

-- ===========================
-- 0. ENABLE REQUIRED EXTENSIONS
-- ===========================

-- Enable trigram extension for fuzzy search (MUST be before GIN index)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===========================
-- 1. CRITICAL INDEXES
-- ===========================

-- Health Dashboard Queries (getHealthDashboardData)
CREATE INDEX IF NOT EXISTS idx_food_logs_user_consumed 
    ON public.food_logs(user_id, consumed_at DESC);

CREATE INDEX IF NOT EXISTS idx_water_logs_user_logged 
    ON public.water_logs(user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_goals_user_active 
    ON public.daily_goals(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_streaks_customer_type 
    ON public.user_streaks(customer_id, streak_type);

CREATE INDEX IF NOT EXISTS idx_nutrition_goals_customer_active 
    ON public.nutrition_goals(customer_id, is_active) WHERE is_active = true;

-- Weight & Progress Queries
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date 
    ON public.weight_logs(user_id, log_date DESC);

CREATE INDEX IF NOT EXISTS idx_progress_photos_user_taken 
    ON public.progress_photos(user_id, taken_at DESC);

-- Gymna AI Queries
CREATE INDEX IF NOT EXISTS idx_gymna_chats_user_updated 
    ON public.gymna_chats(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_gymna_messages_chat_created 
    ON public.gymna_messages(chat_id, created_at ASC);

-- Food Search Optimization (requires pg_trgm extension)
CREATE INDEX IF NOT EXISTS idx_meals_name_search 
    ON public.meals USING gin(name gin_trgm_ops);

-- Orders & Admin
CREATE INDEX IF NOT EXISTS idx_orders_customer_created 
    ON public.orders(customer_id, created_at DESC);

-- ===========================
-- 2. OPTIMIZE RLS POLICIES
-- ===========================

-- Optimize food_logs policies
DROP POLICY IF EXISTS "Users can view their own food logs" ON public.food_logs;
DROP POLICY IF EXISTS "Users can insert their own food logs" ON public.food_logs;
DROP POLICY IF EXISTS "Users can update their own food logs" ON public.food_logs;
DROP POLICY IF EXISTS "Users can delete their own food logs" ON public.food_logs;

CREATE POLICY "Users can view their own food logs" 
    ON public.food_logs FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own food logs" 
    ON public.food_logs FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own food logs" 
    ON public.food_logs FOR UPDATE 
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own food logs" 
    ON public.food_logs FOR DELETE 
    USING (user_id = auth.uid());

-- Optimize water_logs policies
DROP POLICY IF EXISTS "Users can view their own water logs" ON public.water_logs;
DROP POLICY IF EXISTS "Users can insert their own water logs" ON public.water_logs;
DROP POLICY IF EXISTS "Users can update their own water logs" ON public.water_logs;
DROP POLICY IF EXISTS "Users can delete their own water logs" ON public.water_logs;

CREATE POLICY "Users can view their own water logs" 
    ON public.water_logs FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own water logs" 
    ON public.water_logs FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own water logs" 
    ON public.water_logs FOR UPDATE 
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own water logs" 
    ON public.water_logs FOR DELETE 
    USING (user_id = auth.uid());

-- Optimize weight_logs policies
DROP POLICY IF EXISTS "Users can view their own weight logs" ON public.weight_logs;
DROP POLICY IF EXISTS "Users can insert their own weight logs" ON public.weight_logs;

CREATE POLICY "Users can view their own weight logs" 
    ON public.weight_logs FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own weight logs" 
    ON public.weight_logs FOR INSERT 
    WITH CHECK (user_id = auth.uid());

-- Optimize progress_photos policies
DROP POLICY IF EXISTS "Users can view their own progress photos" ON public.progress_photos;
DROP POLICY IF EXISTS "Users can insert their own progress photos" ON public.progress_photos;
DROP POLICY IF EXISTS "Users can delete their own progress photos" ON public.progress_photos;

CREATE POLICY "Users can view their own progress photos" 
    ON public.progress_photos FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own progress photos" 
    ON public.progress_photos FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own progress photos" 
    ON public.progress_photos FOR DELETE 
    USING (user_id = auth.uid());

-- ===========================
-- 3. ADD COMPOSITE INDEXES FOR COMMON QUERIES
-- ===========================

-- Food logs by user, date range, meal type (common filter)
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date_meal 
    ON public.food_logs(user_id, consumed_at, meal_type);

-- Water logs covering index (all columns needed for query)
CREATE INDEX IF NOT EXISTS idx_water_logs_covering 
    ON public.water_logs(user_id, logged_at) 
    INCLUDE (amount_ml);

-- ===========================
-- PERFORMANCE NOTES
-- ===========================
-- 
-- Key Optimizations Applied:
-- 1. Indexes on all foreign keys and date columns
-- 2. Covering indexes for frequently accessed columns
-- 3. GIN index for fuzzy text search on meals
-- 4. Simplified RLS policies (direct auth.uid() comparison)
-- 5. Composite indexes for multi-column filters
--
-- Note: VACUUM ANALYZE commands removed as they cannot run in a transaction.
-- Supabase automatically runs VACUUM on your database periodically.
-- If you need to run it manually, execute each table separately:
-- VACUUM ANALYZE public.food_logs;
-- (Run each VACUUM command individually in SQL Editor)
