// Database types generated from Supabase schema

export type UserRole = 
  | 'standard_user' 
  | 'admin' 
  | 'trainer' 
  | 'gym_franchise' 
  | 'influencer';

export type ReferralType = 
  | 'standard' 
  | 'influencer' 
  | 'gym' 
  | 'trainer';

export type ReferralStatus = 
  | 'pending' 
  | 'completed' 
  | 'expired';

export type RewardType = 
  | 'discount' 
  | 'free_meal' 
  | 'cashback' 
  | 'points';

export type GoalType = 
  | 'lose_weight' 
  | 'gain_weight' 
  | 'maintain_weight' 
  | 'build_muscle' 
  | 'manage_health';

export type FoodType = 
  | 'veg' 
  | 'non_veg' 
  | 'vegan' 
  | 'no_preference';

export type ActivityLevel = 
  | 'sedentary' 
  | 'lightly_active' 
  | 'moderately_active' 
  | 'very_active';

export type MealType = 
  | 'breakfast' 
  | 'lunch' 
  | 'dinner' 
  | 'snack';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  weight: number | null;
  height: number | null;
  age: number | null;
  dietary_preference: string | null;
  daily_calorie_goal: number | null;
  daily_protein_goal: number | null;
  created_at: string;
  updated_at: string;
  address: string | null;
  phone_number: string | null;
  role: UserRole;
  subscription_status: string | null;
  subscription_expiry: string | null;
  referral_code: string | null;
  referred_by: string | null;
  total_referrals: number;
  total_rewards_earned: number;
  has_onboarded: boolean;
  goal_type: GoalType | null;
  goal_aim: string | null;
  calories_count: number | null;
  location: string | null;
  food_type: FoodType;
  activity_level: ActivityLevel;
  health_conditions: string[] | null;
  dietary_restrictions: string[] | null;
  food_preferences: string[] | null;
  spice_level: number;
  meals_per_day: number;
  budget_per_meal: number | null;
  delivery_time: 'morning' | 'afternoon' | 'evening';
  onboarding_completed_at: string | null;
  onboarding_step: number;
}

export interface Meal {
  id: string;
  name: string;
  description: string | null;
  price: number;
  calories: number;
  protein: number;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  image_url: string | null;
  additional_images: string[] | null;
  is_available: boolean;
  is_air_fried: boolean;
  is_featured: boolean;
  category_id: string | null;
  dietary_type_id: string | null;
  spice_level: number | null;
  cooking_time_minutes: number | null;
  average_rating: number;
  total_reviews: number;
  search_tags: string[] | null;
  food_type: 'vegetarian' | 'non-vegetarian';
  created_at: string;
  updated_at: string;
}

export interface MealCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DietaryType {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  order_date: string;
  delivery_date: string | null;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  meal_id: string | null;
  custom_meal_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_customized: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  customer_id: string;
  meal_id: string | null;
  order_id: string | null;
  rating: number;
  comment: string | null;
  taste_rating: number | null;
  portion_rating: number | null;
  value_rating: number | null;
  packaging_rating: number | null;
  delivery_rating: number | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  id: string;
  name: string;
  description: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number | null;
  price_per_100g: number;
  is_allergen: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_featured: boolean;
  image_url: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomMeal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  base_price: number;
  total_price: number;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  dietary_type_id: string | null;
  is_favorite: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MealPlan {
  id: string;
  customer_id: string;
  name: string;
  description: string | null;
  calorie_type: string;
  is_active: boolean;
  total_budget: number;
  daily_calories_target: number;
  daily_protein_target: number;
  daily_carbs_target: number;
  daily_fat_target: number;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  meal_id: string;
  created_at: string;
}

export interface GymPartnership {
  id: string;
  gym_name: string;
  gym_address: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  partnership_type: string;
  commission_rate: number;
  is_active: boolean;
  referral_code: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NutritionGoal {
  id: string;
  customer_id: string;
  goal_type: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'health_condition';
  target_weight: number | null;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  target_fiber: number;
  start_date: string;
  target_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Database query result types
export interface MealWithDetails extends Meal {
  meal_categories?: MealCategory;
  dietary_types?: DietaryType;
  reviews?: Review[];
  favorites?: Favorite[];
}

export interface OrderWithItems extends Order {
  order_items?: (OrderItem & {
    meals?: Meal;
    custom_meals?: CustomMeal;
  })[];
  profiles?: Profile;
}

export interface ProfileWithStats extends Profile {
  orders?: Order[];
  reviews?: Review[];
  favorites?: Favorite[];
  nutrition_goals?: NutritionGoal[];
}
