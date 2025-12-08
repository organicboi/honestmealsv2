-- 1. Ensure Unique Constraints
-- We need these for ON CONFLICT clauses to work correctly

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_nutrition_log_customer_date_unique') THEN
        ALTER TABLE public.daily_nutrition_log
        ADD CONSTRAINT daily_nutrition_log_customer_date_unique UNIQUE (customer_id, log_date);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_streaks_customer_type_unique') THEN
        ALTER TABLE public.user_streaks
        ADD CONSTRAINT user_streaks_customer_type_unique UNIQUE (customer_id, streak_type);
    END IF;
END $$;

-- 2. Update the daily_nutrition_log trigger function to calculate goals_met
CREATE OR REPLACE FUNCTION update_daily_nutrition_log()
RETURNS TRIGGER AS $$
DECLARE
    log_date_val DATE;
    user_id_val UUID;
    
    -- Goal variables
    calorie_goal INTEGER;
    protein_goal NUMERIC;
    
    -- Aggregated values
    total_cal INTEGER;
    total_prot INTEGER;
    total_c INTEGER;
    total_f INTEGER;
    meals_c INTEGER;
    
    is_goal_met BOOLEAN := FALSE;
BEGIN
    -- Determine operation type to get date and user_id
    IF (TG_OP = 'DELETE') THEN
        log_date_val := OLD.consumed_at::DATE;
        user_id_val := OLD.user_id;
    ELSE
        log_date_val := NEW.consumed_at::DATE;
        user_id_val := NEW.user_id;
    END IF;

    -- Calculate totals from food_logs
    SELECT
        COALESCE(SUM(calories_consumed), 0),
        COALESCE(SUM(protein_consumed), 0),
        COALESCE(SUM(carbs_consumed), 0),
        COALESCE(SUM(fat_consumed), 0),
        COUNT(*)
    INTO
        total_cal,
        total_prot,
        total_c,
        total_f,
        meals_c
    FROM public.food_logs
    WHERE user_id = user_id_val AND consumed_at::DATE = log_date_val;

    -- Fetch user goals
    SELECT daily_calorie_goal, daily_protein_goal 
    INTO calorie_goal, protein_goal
    FROM public.daily_goals
    WHERE user_id = user_id_val AND is_active = true
    LIMIT 1;

    -- Calculate goals_met
    -- Logic: Calories within +/- 15% of goal AND Protein >= 80% of goal
    IF calorie_goal IS NOT NULL AND calorie_goal > 0 THEN
        IF (total_cal >= (calorie_goal * 0.85) AND total_cal <= (calorie_goal * 1.15)) THEN
             -- Optional: Add protein check
             -- IF (total_prot >= (protein_goal * 0.8)) THEN
                 is_goal_met := TRUE;
             -- END IF;
        END IF;
    END IF;

    -- Upsert into daily_nutrition_log
    INSERT INTO public.daily_nutrition_log (
        customer_id,
        log_date,
        total_calories,
        total_protein,
        total_carbs,
        total_fat,
        meals_count,
        goals_met,
        created_at
    )
    VALUES (
        user_id_val,
        log_date_val,
        total_cal,
        total_prot,
        total_c,
        total_f,
        meals_c,
        is_goal_met,
        NOW()
    )
    ON CONFLICT (customer_id, log_date)
    DO UPDATE SET
        total_calories = EXCLUDED.total_calories,
        total_protein = EXCLUDED.total_protein,
        total_carbs = EXCLUDED.total_carbs,
        total_fat = EXCLUDED.total_fat,
        meals_count = EXCLUDED.meals_count,
        goals_met = EXCLUDED.goals_met;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- 3. Function to calculate and update streak
CREATE OR REPLACE FUNCTION calculate_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    user_id_val UUID;
    streak_val INTEGER := 0;
    longest_streak_val INTEGER := 0;
    
    -- Variables for iteration
    check_date DATE;
    found_log BOOLEAN;
BEGIN
    user_id_val := NEW.customer_id;
    
    -- We only care if goals_met is TRUE or changed. 
    -- But simpler to just recalculate streak whenever daily log changes.
    
    -- Start checking from today (or the latest log date) backwards
    -- Actually, streak should be "consecutive days ending today or yesterday"
    
    check_date := CURRENT_DATE;
    
    -- Check if today has a goal met
    SELECT goals_met INTO found_log
    FROM public.daily_nutrition_log
    WHERE customer_id = user_id_val AND log_date = check_date;
    
    IF found_log IS TRUE THEN
        streak_val := 1;
    ELSE
        -- If today not met, check yesterday. If yesterday met, streak is alive.
        check_date := CURRENT_DATE - 1;
        SELECT goals_met INTO found_log
        FROM public.daily_nutrition_log
        WHERE customer_id = user_id_val AND log_date = check_date;
        
        IF found_log IS TRUE THEN
            streak_val := 1;
        ELSE
            streak_val := 0;
        END IF;
    END IF;
    
    -- If we have a start, count backwards
    IF streak_val > 0 THEN
        LOOP
            check_date := check_date - 1;
            
            SELECT goals_met INTO found_log
            FROM public.daily_nutrition_log
            WHERE customer_id = user_id_val AND log_date = check_date;
            
            IF found_log IS TRUE THEN
                streak_val := streak_val + 1;
            ELSE
                EXIT; -- Break loop if gap found
            END IF;
        END LOOP;
    END IF;

    -- Get existing longest streak to update if needed
    SELECT longest_streak INTO longest_streak_val
    FROM public.user_streaks
    WHERE customer_id = user_id_val AND streak_type = 'nutrition_goals';
    
    IF longest_streak_val IS NULL THEN
        longest_streak_val := 0;
    END IF;
    
    IF streak_val > longest_streak_val THEN
        longest_streak_val := streak_val;
    END IF;

    -- Update user_streaks
    INSERT INTO public.user_streaks (
        customer_id,
        current_streak,
        longest_streak,
        streak_type,
        last_activity_date,
        created_at,
        updated_at
    )
    VALUES (
        user_id_val,
        streak_val,
        longest_streak_val,
        'nutrition_goals',
        CURRENT_DATE,
        NOW(),
        NOW()
    )
    ON CONFLICT (customer_id, streak_type)
    DO UPDATE SET
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        last_activity_date = EXCLUDED.last_activity_date,
        updated_at = NOW();

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger for streak calculation
DROP TRIGGER IF EXISTS trigger_calculate_streak ON public.daily_nutrition_log;

CREATE TRIGGER trigger_calculate_streak
AFTER INSERT OR UPDATE OF goals_met ON public.daily_nutrition_log
FOR EACH ROW
EXECUTE FUNCTION calculate_user_streak();
