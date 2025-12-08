-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  description text,
  icon character varying NOT NULL,
  badge_color character varying DEFAULT 'blue'::character varying,
  requirement_type character varying NOT NULL CHECK (requirement_type::text = ANY (ARRAY['streak'::character varying::text, 'orders'::character varying::text, 'points'::character varying::text, 'nutrition'::character varying::text, 'social'::character varying::text])),
  requirement_value integer NOT NULL,
  points_reward integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT achievements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.app_roles (
  id integer NOT NULL DEFAULT nextval('app_roles_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  description text,
  CONSTRAINT app_roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.challenge_participation (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  challenge_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  current_progress integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  completion_date timestamp with time zone,
  rank integer,
  points_earned integer DEFAULT 0,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT challenge_participation_pkey PRIMARY KEY (id),
  CONSTRAINT challenge_participation_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id),
  CONSTRAINT challenge_participation_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  challenge_type character varying NOT NULL CHECK (challenge_type::text = ANY (ARRAY['streak'::character varying::text, 'nutrition'::character varying::text, 'orders'::character varying::text, 'community'::character varying::text])),
  target_value integer NOT NULL,
  reward_points integer DEFAULT 0,
  reward_description text,
  max_participants integer,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT challenges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cooking_instructions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  meal_id uuid,
  step_number integer NOT NULL,
  instruction text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cooking_instructions_pkey PRIMARY KEY (id),
  CONSTRAINT cooking_instructions_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id)
);
CREATE TABLE public.custom_cooking_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_item_id uuid,
  instructions text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT custom_cooking_requests_pkey PRIMARY KEY (id),
  CONSTRAINT custom_cooking_requests_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id)
);
CREATE TABLE public.custom_dish_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  title text NOT NULL,
  description text NOT NULL,
  desired_calories integer,
  desired_protein numeric,
  dietary_type_id uuid,
  status text NOT NULL DEFAULT 'pending'::text,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT custom_dish_requests_pkey PRIMARY KEY (id),
  CONSTRAINT custom_dish_requests_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT custom_dish_requests_dietary_type_id_fkey FOREIGN KEY (dietary_type_id) REFERENCES public.dietary_types(id)
);
CREATE TABLE public.custom_meal_components (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  custom_meal_id uuid,
  ingredient_id uuid,
  custom_ingredient_id uuid,
  quantity_grams numeric NOT NULL,
  price_contribution numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT custom_meal_components_pkey PRIMARY KEY (id),
  CONSTRAINT custom_meal_components_custom_ingredient_id_fkey FOREIGN KEY (custom_ingredient_id) REFERENCES public.user_custom_ingredients(id),
  CONSTRAINT custom_meal_components_custom_meal_id_fkey FOREIGN KEY (custom_meal_id) REFERENCES public.custom_meals(id),
  CONSTRAINT custom_meal_components_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id)
);
CREATE TABLE public.custom_meal_instructions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  custom_meal_id uuid,
  instructions text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT custom_meal_instructions_pkey PRIMARY KEY (id),
  CONSTRAINT custom_meal_instructions_custom_meal_id_fkey FOREIGN KEY (custom_meal_id) REFERENCES public.custom_meals(id)
);
CREATE TABLE public.custom_meal_preferences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  preference_type text NOT NULL,
  item text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT custom_meal_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT custom_meal_preferences_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.custom_meals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  name text NOT NULL,
  description text,
  base_price numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  calories integer,
  protein numeric,
  carbs numeric,
  fat numeric,
  fiber numeric,
  dietary_type_id uuid,
  is_favorite boolean DEFAULT false,
  status text NOT NULL DEFAULT 'draft'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT custom_meals_pkey PRIMARY KEY (id),
  CONSTRAINT custom_meals_dietary_type_id_fkey FOREIGN KEY (dietary_type_id) REFERENCES public.dietary_types(id),
  CONSTRAINT custom_meals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL,
  full_name text,
  phone_number text,
  address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.daily_goals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  daily_calorie_goal integer NOT NULL DEFAULT 2000,
  daily_protein_goal numeric NOT NULL DEFAULT 150,
  daily_water_goal_ml integer NOT NULL DEFAULT 2000,
  goal_type text NOT NULL DEFAULT 'maintenance'::text CHECK (goal_type = ANY (ARRAY['weight_loss'::text, 'weight_gain'::text, 'maintenance'::text])),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_goals_pkey PRIMARY KEY (id),
  CONSTRAINT daily_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.daily_nutrition_log (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  log_date date NOT NULL,
  total_calories integer DEFAULT 0,
  total_protein integer DEFAULT 0,
  total_carbs integer DEFAULT 0,
  total_fat integer DEFAULT 0,
  total_fiber integer DEFAULT 0,
  meals_count integer DEFAULT 0,
  goals_met boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_nutrition_log_pkey PRIMARY KEY (id),
  CONSTRAINT daily_nutrition_log_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.delivery_zones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  postal_code text,
  delivery_fee numeric,
  is_serviceable boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT delivery_zones_pkey PRIMARY KEY (id)
);
CREATE TABLE public.dietary_types (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dietary_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.favorites (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  meal_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.food_journal (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  meal_type text NOT NULL,
  food_name text NOT NULL,
  calories integer NOT NULL,
  protein numeric,
  carbs numeric,
  fat numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT food_journal_pkey PRIMARY KEY (id),
  CONSTRAINT food_journal_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.food_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  meal_id uuid,
  custom_food_name text,
  quantity numeric NOT NULL DEFAULT 1,
  calories_consumed integer NOT NULL,
  protein_consumed numeric DEFAULT 0,
  carbs_consumed numeric DEFAULT 0,
  fat_consumed numeric DEFAULT 0,
  meal_type text NOT NULL CHECK (meal_type = ANY (ARRAY['breakfast'::text, 'lunch'::text, 'dinner'::text, 'snack'::text])),
  consumed_at timestamp with time zone DEFAULT now(),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT food_logs_pkey PRIMARY KEY (id),
  CONSTRAINT food_logs_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id),
  CONSTRAINT food_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.gym_partnerships (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  gym_name text NOT NULL,
  gym_address text,
  contact_person text,
  contact_phone text,
  contact_email text,
  partnership_type text DEFAULT 'referral'::text,
  commission_rate numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  referral_code text UNIQUE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gym_partnerships_pkey PRIMARY KEY (id)
);
CREATE TABLE public.health_metrics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  gender text,
  age integer,
  weight numeric,
  height numeric,
  activity_level text,
  goal text,
  food_preference text,
  bmr numeric,
  tdee numeric,
  target_calories numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT health_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT health_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.ingredient_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ingredient_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ingredients (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  calories_per_100g numeric NOT NULL,
  protein_per_100g numeric NOT NULL,
  carbs_per_100g numeric NOT NULL,
  fat_per_100g numeric NOT NULL,
  fiber_per_100g numeric,
  price_per_100g numeric NOT NULL DEFAULT 0,
  is_allergen boolean DEFAULT false,
  is_vegetarian boolean DEFAULT true,
  is_vegan boolean DEFAULT false,
  is_gluten_free boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  image_url text,
  category_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ingredients_pkey PRIMARY KEY (id),
  CONSTRAINT ingredients_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.ingredient_categories(id)
);
CREATE TABLE public.meal_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT meal_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.meal_ingredients (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  meal_id uuid,
  ingredient_id uuid,
  quantity_grams numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT meal_ingredients_pkey PRIMARY KEY (id),
  CONSTRAINT meal_ingredients_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id)
);
CREATE TABLE public.meal_plan_subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  meal_plan_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'active'::text,
  billing_cycle text NOT NULL,
  price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT meal_plan_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT meal_plan_subscriptions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT meal_plan_subscriptions_meal_plan_id_fkey FOREIGN KEY (meal_plan_id) REFERENCES public.meal_plans(id)
);
CREATE TABLE public.meal_plan_templates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  description text,
  goal_type character varying NOT NULL CHECK (goal_type::text = ANY (ARRAY['weight_loss'::character varying::text, 'muscle_gain'::character varying::text, 'maintenance'::character varying::text])),
  duration_days integer NOT NULL,
  daily_calories integer NOT NULL,
  daily_protein integer NOT NULL,
  daily_carbs integer NOT NULL,
  daily_fat integer NOT NULL,
  is_premium boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT meal_plan_templates_pkey PRIMARY KEY (id),
  CONSTRAINT meal_plan_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.meal_plans (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  calorie_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  customer_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  total_budget numeric DEFAULT 0,
  daily_calories_target integer DEFAULT 2000,
  daily_protein_target integer DEFAULT 150,
  daily_carbs_target integer DEFAULT 250,
  daily_fat_target integer DEFAULT 65,
  CONSTRAINT meal_plans_pkey PRIMARY KEY (id),
  CONSTRAINT meal_plans_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.meal_recommendations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  meal_id uuid NOT NULL,
  recommendation_type character varying NOT NULL CHECK (recommendation_type::text = ANY (ARRAY['ai_based'::character varying::text, 'collaborative'::character varying::text, 'content_based'::character varying::text, 'contextual'::character varying::text])),
  context character varying CHECK (context::text = ANY (ARRAY['morning'::character varying::text, 'afternoon'::character varying::text, 'evening'::character varying::text, 'post_workout'::character varying::text, 'weather_based'::character varying::text, 'mood_based'::character varying::text])),
  confidence_score numeric DEFAULT 0.5,
  reason text,
  is_clicked boolean DEFAULT false,
  is_ordered boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT meal_recommendations_pkey PRIMARY KEY (id),
  CONSTRAINT meal_recommendations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id),
  CONSTRAINT meal_recommendations_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id)
);
CREATE TABLE public.meals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  calories integer NOT NULL,
  protein numeric NOT NULL,
  image_url text,
  is_available boolean DEFAULT true,
  category_id uuid,
  dietary_type_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  spice_level integer CHECK (spice_level >= 1 AND spice_level <= 5),
  cooking_time_minutes integer,
  carbs numeric,
  fat numeric,
  fiber numeric,
  additional_images ARRAY,
  is_air_fried boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  average_rating numeric DEFAULT 0.0 CHECK (average_rating >= 0::numeric AND average_rating <= 5::numeric),
  total_reviews integer NOT NULL DEFAULT 0,
  search_tags ARRAY,
  food_type text NOT NULL DEFAULT 'vegetarian'::text CHECK (food_type = ANY (ARRAY['vegetarian'::text, 'non-vegetarian'::text])),
  CONSTRAINT meals_pkey PRIMARY KEY (id),
  CONSTRAINT meals_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.meal_categories(id),
  CONSTRAINT meals_dietary_type_id_fkey FOREIGN KEY (dietary_type_id) REFERENCES public.dietary_types(id)
);
CREATE TABLE public.nutrition_goals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  goal_type character varying NOT NULL CHECK (goal_type::text = ANY (ARRAY['weight_loss'::character varying::text, 'muscle_gain'::character varying::text, 'maintenance'::character varying::text, 'health_condition'::character varying::text])),
  target_weight numeric,
  target_calories integer NOT NULL,
  target_protein integer NOT NULL,
  target_carbs integer NOT NULL,
  target_fat integer NOT NULL,
  target_fiber integer DEFAULT 25,
  start_date date NOT NULL,
  target_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nutrition_goals_pkey PRIMARY KEY (id),
  CONSTRAINT nutrition_goals_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.nutritional_goals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  calories_target integer,
  protein_target numeric,
  carbs_target numeric,
  fat_target numeric,
  fitness_goal text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nutritional_goals_pkey PRIMARY KEY (id),
  CONSTRAINT nutritional_goals_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  meal_id uuid,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  custom_meal_id uuid,
  is_customized boolean DEFAULT false,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  order_date timestamp with time zone DEFAULT now(),
  delivery_date timestamp with time zone,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  payment_status text NOT NULL DEFAULT 'pending'::text,
  payment_method text,
  delivery_address text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.planned_meals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  meal_plan_id uuid NOT NULL,
  meal_id uuid NOT NULL,
  planned_date date NOT NULL,
  meal_type character varying NOT NULL CHECK (meal_type::text = ANY (ARRAY['breakfast'::character varying::text, 'lunch'::character varying::text, 'dinner'::character varying::text, 'snack'::character varying::text])),
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT planned_meals_pkey PRIMARY KEY (id),
  CONSTRAINT planned_meals_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id),
  CONSTRAINT planned_meals_meal_plan_id_fkey FOREIGN KEY (meal_plan_id) REFERENCES public.meal_plans(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  name text,
  weight double precision,
  height double precision,
  age integer,
  dietary_preference text,
  daily_calorie_goal integer,
  daily_protein_goal integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  address text,
  phone_number text,
  subscription_status text,
  subscription_expiry timestamp with time zone,
  trainer_specialty text,
  trainer_experience integer,
  influencer_followers integer,
  influencer_platform text,
  admin_level integer,
  metadata jsonb,
  referral_code text UNIQUE,
  referred_by uuid,
  total_referrals integer DEFAULT 0,
  total_rewards_earned numeric DEFAULT 0,
  has_onboarded boolean DEFAULT false,
  goal_type text CHECK (goal_type = ANY (ARRAY['lose_weight'::text, 'gain_weight'::text, 'maintain_weight'::text, 'build_muscle'::text, 'manage_health'::text])),
  goal_aim text,
  calories_count integer,
  location text,
  food_type text DEFAULT 'no_preference'::text CHECK (food_type = ANY (ARRAY['veg'::text, 'non_veg'::text, 'vegan'::text, 'no_preference'::text])),
  activity_level text DEFAULT 'moderately_active'::text CHECK (activity_level = ANY (ARRAY['sedentary'::text, 'lightly_active'::text, 'moderately_active'::text, 'very_active'::text])),
  health_conditions ARRAY,
  dietary_restrictions ARRAY,
  food_preferences ARRAY,
  spice_level integer DEFAULT 3 CHECK (spice_level >= 1 AND spice_level <= 5),
  meals_per_day integer DEFAULT 3 CHECK (meals_per_day >= 1 AND meals_per_day <= 6),
  budget_per_meal integer,
  delivery_time text DEFAULT 'morning'::text CHECK (delivery_time = ANY (ARRAY['morning'::text, 'afternoon'::text, 'evening'::text])),
  onboarding_completed_at timestamp with time zone,
  onboarding_step integer DEFAULT 0,
  role text DEFAULT 'standard_user'::text CHECK (role = ANY (ARRAY['standard_user'::text, 'admin'::text, 'trainer'::text, 'influencer'::text, 'gym_franchise'::text])),
  goal_weight double precision,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES auth.users(id)
);
CREATE TABLE public.progress_photo_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  progress_photo_id uuid NOT NULL,
  tag text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT progress_photo_tags_pkey PRIMARY KEY (id),
  CONSTRAINT progress_photo_tags_progress_photo_id_fkey FOREIGN KEY (progress_photo_id) REFERENCES public.progress_photos(id)
);
CREATE TABLE public.progress_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  weight numeric,
  body_fat_percentage numeric,
  muscle_mass numeric,
  waist_measurement numeric,
  chest_measurement numeric,
  notes text,
  photo_type text DEFAULT 'progress'::text CHECK (photo_type = ANY (ARRAY['progress'::text, 'before'::text, 'after'::text, 'milestone'::text])),
  is_public boolean DEFAULT false,
  taken_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT progress_photos_pkey PRIMARY KEY (id),
  CONSTRAINT progress_photos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.referral_codes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  referrer_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referral_codes_pkey PRIMARY KEY (id),
  CONSTRAINT referral_codes_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.referral_rewards (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  referral_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reward_value numeric NOT NULL,
  is_claimed boolean DEFAULT false,
  claimed_at timestamp with time zone,
  expires_at timestamp with time zone,
  order_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referral_rewards_pkey PRIMARY KEY (id),
  CONSTRAINT referral_rewards_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES public.referrals(id),
  CONSTRAINT referral_rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.referral_rewards_config (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  referrer_reward_value numeric NOT NULL,
  referred_reward_value numeric NOT NULL,
  min_order_amount numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referral_rewards_config_pkey PRIMARY KEY (id)
);
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  referral_code_id uuid NOT NULL,
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL,
  first_order_id uuid,
  completion_date timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referrals_pkey PRIMARY KEY (id),
  CONSTRAINT referrals_referral_code_id_fkey FOREIGN KEY (referral_code_id) REFERENCES public.referral_codes(id),
  CONSTRAINT referrals_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES auth.users(id),
  CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  meal_id uuid,
  order_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  taste_rating integer CHECK (taste_rating >= 1 AND taste_rating <= 5),
  portion_rating integer CHECK (portion_rating >= 1 AND portion_rating <= 5),
  value_rating integer CHECK (value_rating >= 1 AND value_rating <= 5),
  packaging_rating integer CHECK (packaging_rating >= 1 AND packaging_rating <= 5),
  delivery_rating integer CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  images ARRAY,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT reviews_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id),
  CONSTRAINT reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.role_permissions (
  role_id integer NOT NULL,
  resource text NOT NULL,
  permission text NOT NULL,
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, resource, permission),
  CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.app_roles(id)
);
CREATE TABLE public.roles (
  id integer NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.subscription_meals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  subscription_id uuid NOT NULL,
  meal_id uuid NOT NULL,
  day_of_week text,
  meal_time text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscription_meals_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_meals_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id),
  CONSTRAINT subscription_meals_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.meal_plan_subscriptions(id)
);
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  achievement_id uuid NOT NULL,
  earned_at timestamp with time zone DEFAULT now(),
  points_earned integer DEFAULT 0,
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id),
  CONSTRAINT user_achievements_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_custom_ingredients (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  name text NOT NULL,
  description text,
  calories_per_100g numeric NOT NULL,
  protein_per_100g numeric NOT NULL,
  carbs_per_100g numeric NOT NULL,
  fat_per_100g numeric NOT NULL,
  fiber_per_100g numeric,
  price_per_100g numeric NOT NULL DEFAULT 0,
  is_private boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_custom_ingredients_pkey PRIMARY KEY (id),
  CONSTRAINT user_custom_ingredients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_rewards (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  reward_type character varying NOT NULL CHECK (reward_type::text = ANY (ARRAY['free_meal'::character varying::text, 'discount'::character varying::text, 'points'::character varying::text, 'badge'::character varying::text])),
  reward_value integer NOT NULL,
  description text,
  is_claimed boolean DEFAULT false,
  claimed_at timestamp with time zone,
  expires_at timestamp with time zone,
  source character varying CHECK (source::text = ANY (ARRAY['streak'::character varying::text, 'achievement'::character varying::text, 'challenge'::character varying::text, 'referral'::character varying::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_rewards_pkey PRIMARY KEY (id),
  CONSTRAINT user_rewards_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  role_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id),
  CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_streaks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  streak_type character varying NOT NULL CHECK (streak_type::text = ANY (ARRAY['daily_order'::character varying::text, 'meal_plan_adherence'::character varying::text, 'nutrition_goals'::character varying::text])),
  total_points integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_streaks_pkey PRIMARY KEY (id),
  CONSTRAINT user_streaks_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.water_intake (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  amount integer NOT NULL,
  goal integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT water_intake_pkey PRIMARY KEY (id),
  CONSTRAINT water_intake_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.water_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  amount_ml integer NOT NULL,
  logged_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT water_logs_pkey PRIMARY KEY (id),
  CONSTRAINT water_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.weight_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  weight numeric NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT weight_logs_pkey PRIMARY KEY (id),
  CONSTRAINT weight_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);