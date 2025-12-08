-- Function to update daily_nutrition_log
CREATE OR REPLACE FUNCTION update_daily_nutrition_log()
RETURNS TRIGGER AS $$
DECLARE
    log_date_val DATE;
    user_id_val UUID;
BEGIN
    -- Determine operation type to get date and user_id
    IF (TG_OP = 'DELETE') THEN
        log_date_val := OLD.consumed_at::DATE;
        user_id_val := OLD.user_id;
    ELSE
        log_date_val := NEW.consumed_at::DATE;
        user_id_val := NEW.user_id;
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
        created_at
    )
    SELECT
        user_id_val,
        log_date_val,
        COALESCE(SUM(calories_consumed), 0),
        COALESCE(SUM(protein_consumed), 0),
        COALESCE(SUM(carbs_consumed), 0),
        COALESCE(SUM(fat_consumed), 0),
        COUNT(*),
        NOW()
    FROM public.food_logs
    WHERE user_id = user_id_val AND consumed_at::DATE = log_date_val
    ON CONFLICT (customer_id, log_date)
    DO UPDATE SET
        total_calories = EXCLUDED.total_calories,
        total_protein = EXCLUDED.total_protein,
        total_carbs = EXCLUDED.total_carbs,
        total_fat = EXCLUDED.total_fat,
        meals_count = EXCLUDED.meals_count;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for INSERT, UPDATE, DELETE on food_logs
DROP TRIGGER IF EXISTS trigger_update_daily_nutrition ON public.food_logs;

CREATE TRIGGER trigger_update_daily_nutrition
AFTER INSERT OR UPDATE OR DELETE ON public.food_logs
FOR EACH ROW
EXECUTE FUNCTION update_daily_nutrition_log();
