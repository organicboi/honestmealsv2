'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Star, Leaf, Wind } from 'lucide-react';

// ─── Mock Meal Data (same set) ─────────────────────────────────────────────────
const MOCK_MEALS = [
  {
    id: '1', name: 'Grilled Chicken Rice Bowl', food_type: 'non-vegetarian',
    price: 249, calories: 480, protein: 38, carbs: 42, fat: 10, fiber: 4,
    is_air_fried: false, average_rating: 4.8, description: 'Tender grilled chicken over steamed rice with green chutney',
    image_emoji: '🍗',
  },
  {
    id: '2', name: 'Paneer Tikka Bowl', food_type: 'vegetarian',
    price: 219, calories: 420, protein: 26, carbs: 35, fat: 14, fiber: 3,
    is_air_fried: false, average_rating: 4.6, description: 'Chargrilled paneer cubes with bell pepper and spiced rice',
    image_emoji: '🧆',
  },
  {
    id: '3', name: 'Greek Salad', food_type: 'vegetarian',
    price: 149, calories: 180, protein: 4, carbs: 14, fat: 12, fiber: 6,
    is_air_fried: false, average_rating: 4.5, description: 'Crisp cucumber, olives, cherry tomatoes with feta and oregano',
    image_emoji: '🥗',
  },
  {
    id: '4', name: 'Egg White Bhurji Wrap', food_type: 'non-vegetarian',
    price: 179, calories: 310, protein: 28, carbs: 28, fat: 8, fiber: 2,
    is_air_fried: false, average_rating: 4.7, description: 'Fluffy egg whites scrambled with onions and whole-wheat wrap',
    image_emoji: '🌯',
  },
  {
    id: '5', name: 'Air-Fried Makhana Bowl', food_type: 'vegetarian',
    price: 139, calories: 220, protein: 8, carbs: 32, fat: 6, fiber: 9,
    is_air_fried: true, average_rating: 4.4, description: 'Lotus seeds air-fried with turmeric and black pepper',
    image_emoji: '🍱',
  },
  {
    id: '6', name: 'Salmon & Quinoa Plate', food_type: 'non-vegetarian',
    price: 349, calories: 520, protein: 42, carbs: 38, fat: 16, fiber: 5,
    is_air_fried: false, average_rating: 4.9, description: 'Pan-seared salmon with herbed quinoa and lemon drizzle',
    image_emoji: '🐟',
  },
  {
    id: '7', name: 'Detox Garden Salad', food_type: 'vegetarian',
    price: 129, calories: 140, protein: 3, carbs: 18, fat: 5, fiber: 10,
    is_air_fried: false, average_rating: 4.3, description: 'Kale, spinach, beetroot, seeds and a lemon-ginger dressing',
    image_emoji: '🥬',
  },
  {
    id: '8', name: 'Dal Makhani with Brown Rice', food_type: 'vegetarian',
    price: 189, calories: 390, protein: 14, carbs: 58, fat: 9, fiber: 8,
    is_air_fried: false, average_rating: 4.6, description: 'Slow-cooked black lentils with a hint of cream and brown rice',
    image_emoji: '🫘',
  },
];

// ─── Protein Tier ──────────────────────────────────────────────────────────────
function getProteinTier(protein: number) {
  if (protein >= 30) return { label: 'GOLD', bg: 'bg-amber-400', text: 'text-amber-900', ring: 'ring-amber-400', glow: 'shadow-amber-200' };
  if (protein >= 20) return { label: 'SILVER', bg: 'bg-slate-300', text: 'text-slate-800', ring: 'ring-slate-300', glow: 'shadow-slate-200' };
  if (protein >= 10) return { label: 'BRONZE', bg: 'bg-orange-300', text: 'text-orange-900', ring: 'ring-orange-300', glow: 'shadow-orange-100' };
  return null; // No tier badge for low-protein items
}

// ─── Macro Bar ─────────────────────────────────────────────────────────────────
function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein + carbs + fat;
  const pPct = (protein / total) * 100;
  const cPct = (carbs / total) * 100;
  const fPct = (fat / total) * 100;

  return (
    <div className="space-y-1">
      <div className="flex rounded-full overflow-hidden h-2 gap-0.5">
        <div className="bg-emerald-400 rounded-l-full" style={{ width: `${pPct}%` }} />
        <div className="bg-amber-400" style={{ width: `${cPct}%` }} />
        <div className="bg-rose-400 rounded-r-full" style={{ width: `${fPct}%` }} />
      </div>
      <div className="flex gap-3 text-[9px] font-bold uppercase tracking-widest">
        <span className="text-emerald-600">{protein}g Protein</span>
        <span className="text-amber-500">{carbs}g Carbs</span>
        <span className="text-rose-400">{fat}g Fat</span>
      </div>
    </div>
  );
}

// ─── Meal Card B ───────────────────────────────────────────────────────────────
function MealCardB({ meal }: { meal: typeof MOCK_MEALS[0] }) {
  const [qty, setQty] = useState(0);
  const tier = getProteinTier(meal.protein);
  const isHighProtein = meal.protein >= 20;
  const isLightMeal = meal.calories <= 250 && meal.protein < 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl overflow-hidden shadow-sm border transition-shadow duration-300 flex flex-col ${
        tier ? `ring-2 ${tier.ring} shadow-lg ${tier.glow}` : 'border-gray-100'
      }`}
    >
      {/* Top: Image + Protein Hero ─────────────── */}
      <div className={`relative h-44 flex items-center justify-center ${
        isHighProtein
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : isLightMeal
            ? 'bg-gradient-to-br from-sky-50 via-teal-50 to-emerald-50'
            : 'bg-gradient-to-br from-slate-100 to-gray-100'
      }`}>
        {/* Big emoji */}
        <span className="text-7xl select-none">{meal.image_emoji}</span>

        {/* Protein number or Light Meal — bottom left overlay */}
        <div className="absolute bottom-3 left-4">
          {isHighProtein ? (
            <div>
              <span className={`text-5xl font-black leading-none tracking-tighter ${
                tier?.label === 'GOLD' ? 'text-amber-400' :
                tier?.label === 'SILVER' ? 'text-slate-300' :
                'text-white'
              }`}>
                {meal.protein}
              </span>
              <span className={`text-sm font-bold ml-1 ${
                tier?.label === 'GOLD' ? 'text-amber-400/70' :
                tier?.label === 'SILVER' ? 'text-slate-300/70' :
                'text-white/60'
              }`}>g protein</span>
            </div>
          ) : isLightMeal ? (
            <div>
              <span className="text-sky-600 text-xs font-black uppercase tracking-widest block">Only</span>
              <span className="text-sky-700 text-4xl font-black leading-none">{meal.calories}</span>
              <span className="text-sky-500 text-sm font-bold ml-1">cal</span>
            </div>
          ) : meal.fiber >= 8 ? (
            <div>
              <span className="text-violet-600 text-xs font-black uppercase tracking-widest block">Fiber Rich</span>
              <span className="text-violet-700 text-4xl font-black leading-none">{meal.fiber}</span>
              <span className="text-violet-500 text-sm font-bold ml-1">g fiber</span>
            </div>
          ) : (
            <div>
              <span className="text-gray-400 text-xs font-black uppercase tracking-widest block">Energy</span>
              <span className="text-gray-700 text-4xl font-black leading-none">{meal.calories}</span>
              <span className="text-gray-400 text-sm font-bold ml-1">kcal</span>
            </div>
          )}
        </div>

        {/* Tier badge — top right */}
        {tier && (
          <div className={`absolute top-3 right-3 ${tier.bg} ${tier.text} text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md`}>
            {tier.label}
          </div>
        )}

        {/* Air Fried badge */}
        {meal.is_air_fried && (
          <div className="absolute top-3 right-3 bg-violet-100 text-violet-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
            <Wind className="w-2.5 h-2.5" /> Air Fried
          </div>
        )}

        {/* Veg indicator — top left */}
        <div className="absolute top-3 left-3">
          <div className={`w-5 h-5 rounded border-2 bg-white flex items-center justify-center ${
            meal.food_type === 'vegetarian' ? 'border-green-600' : 'border-red-500'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              meal.food_type === 'vegetarian' ? 'bg-green-600' : 'bg-red-500'
            }`} />
          </div>
        </div>

        {/* Rating — bottom right */}
        <div className={`absolute bottom-3 right-3 flex items-center gap-1 ${
          isHighProtein ? 'text-white/80' : 'text-gray-600'
        }`}>
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-bold">{meal.average_rating}</span>
        </div>
      </div>

      {/* Bottom: Info + Action ─────────────── */}
      <div className="bg-white p-4 flex flex-col gap-3 flex-grow">
        <div>
          <h3 className="font-black text-gray-900 text-sm leading-snug">{meal.name}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{meal.description}</p>
        </div>

        {/* Macro Bar */}
        <MacroBar protein={meal.protein} carbs={meal.carbs} fat={meal.fat} />

        {/* Price + Action */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xl font-black text-gray-900">₹{meal.price}</span>

          {qty > 0 ? (
            <div className="flex items-center gap-2 bg-green-50 rounded-2xl px-2 py-1.5 border border-green-100">
              <button onClick={() => setQty(q => q - 1)} className="p-1 rounded-xl hover:bg-green-100 text-green-700">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-black text-green-700 text-sm min-w-[1rem] text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="p-1 rounded-xl hover:bg-green-100 text-green-700">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setQty(1)}
              className={`text-xs font-black px-5 py-2.5 rounded-2xl active:scale-95 transition-all text-white ${
                isHighProtein
                  ? 'bg-gray-900 hover:bg-gray-800'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function MealsConceptB() {
  const [filter, setFilter] = useState<'all' | 'veg' | 'nonveg'>('all');

  const filtered = MOCK_MEALS.filter(m =>
    filter === 'all' ? true :
    filter === 'veg' ? m.food_type === 'vegetarian' :
    m.food_type === 'non-vegetarian'
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Concept B</p>
            <h1 className="text-lg font-black text-gray-900">Macro Hero</h1>
          </div>
          <div className="flex gap-2">
            {(['all', 'veg', 'nonveg'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all ${
                  filter === f
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        {/* Tier Legend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 flex items-center gap-4 flex-wrap shadow-sm">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide shrink-0">Protein Tiers:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-amber-400 ring-2 ring-amber-400" />
            <span className="text-xs font-bold text-gray-700">Gold  <span className="font-normal text-gray-400">(30g+)</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-slate-300 ring-2 ring-slate-300" />
            <span className="text-xs font-bold text-gray-700">Silver  <span className="font-normal text-gray-400">(20g+)</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-orange-300 ring-2 ring-orange-300" />
            <span className="text-xs font-bold text-gray-700">Bronze  <span className="font-normal text-gray-400">(10g+)</span></span>
          </div>
          <span className="text-xs text-gray-400">Salads / light meals show their own hero metric</span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4">
          <AnimatePresence>
            {filtered.map(meal => (
              <MealCardB key={meal.id} meal={meal} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
