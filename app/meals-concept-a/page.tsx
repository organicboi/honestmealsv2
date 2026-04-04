'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Star, Zap, Leaf, Flame, Dumbbell, Wind } from 'lucide-react';

// ─── Mock Meal Data ────────────────────────────────────────────────────────────
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

// ─── Smart Spotlight Logic ─────────────────────────────────────────────────────
type Spotlight = {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
};

function getSpotlight(meal: typeof MOCK_MEALS[0]): Spotlight {
  if (meal.protein >= 30) {
    return { label: 'Protein', value: `${meal.protein}g`, color: 'bg-emerald-500 text-white', icon: <Dumbbell className="w-3 h-3" /> };
  }
  if (meal.protein >= 20) {
    return { label: 'Protein', value: `${meal.protein}g`, color: 'bg-green-400 text-white', icon: <Dumbbell className="w-3 h-3" /> };
  }
  if (meal.calories <= 200) {
    return { label: 'Only', value: `${meal.calories} cal`, color: 'bg-sky-500 text-white', icon: <Flame className="w-3 h-3" /> };
  }
  if (meal.fiber >= 8) {
    return { label: 'Fiber Rich', value: `${meal.fiber}g fiber`, color: 'bg-violet-500 text-white', icon: <Leaf className="w-3 h-3" /> };
  }
  if (meal.is_air_fried) {
    return { label: 'Air Fried', value: 'Clean Cook', color: 'bg-amber-400 text-white', icon: <Wind className="w-3 h-3" /> };
  }
  return { label: 'Balanced', value: `${meal.calories} cal`, color: 'bg-gray-700 text-white', icon: <Zap className="w-3 h-3" /> };
}

// ─── Meal Card ─────────────────────────────────────────────────────────────────
function MealCardA({ meal }: { meal: typeof MOCK_MEALS[0] }) {
  const [qty, setQty] = useState(0);
  const spotlight = getSpotlight(meal);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300 flex flex-col"
    >
      {/* Image Area */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-6xl shrink-0">
        <span>{meal.image_emoji}</span>

        {/* Smart Spotlight Badge — top right */}
        <div className={`absolute top-3 right-3 ${spotlight.color} rounded-2xl px-3 py-1.5 flex items-center gap-1.5 shadow-lg`}>
          {spotlight.icon}
          <div className="text-right leading-none">
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-80 block">{spotlight.label}</span>
            <span className="text-sm font-black">{spotlight.value}</span>
          </div>
        </div>

        {/* Veg/Non-Veg dot — top left */}
        <div className="absolute top-3 left-3">
          <div className={`w-6 h-6 rounded border-2 bg-white flex items-center justify-center ${
            meal.food_type === 'vegetarian' ? 'border-green-600' : 'border-red-500'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${
              meal.food_type === 'vegetarian' ? 'bg-green-600' : 'bg-red-500'
            }`} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow gap-2">
        <div>
          <h3 className="font-bold text-gray-900 text-base leading-snug">{meal.name}</h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{meal.description}</p>
        </div>

        {/* Secondary Macro Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
            {meal.calories} cal
          </span>
          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
            {meal.protein}g P
          </span>
          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
            {meal.carbs}g C
          </span>
          {meal.is_air_fried && (
            <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 rounded-full px-2 py-0.5 flex items-center gap-1">
              <Wind className="w-2.5 h-2.5" /> Air Fried
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-bold text-gray-700">{meal.average_rating}</span>
        </div>

        {/* Price + Action */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <span className="text-xl font-black text-gray-900">₹{meal.price}</span>
          {qty > 0 ? (
            <div className="flex items-center gap-2 bg-green-50 rounded-2xl px-2 py-1 border border-green-100">
              <button onClick={() => setQty(q => q - 1)} className="p-1 rounded-xl hover:bg-green-100 text-green-700">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-green-700 text-sm min-w-[1rem] text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="p-1 rounded-xl hover:bg-green-100 text-green-700">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setQty(1)}
              className="bg-gray-900 text-white text-xs font-bold px-5 py-2.5 rounded-2xl hover:bg-gray-800 active:scale-95 transition-all"
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
export default function MealsConceptA() {
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Concept A</p>
            <h1 className="text-lg font-black text-gray-900">Smart Spotlight</h1>
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

      {/* Hero Strip */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <div className="bg-gray-900 rounded-3xl px-6 py-5 flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-black text-xl leading-tight">Fuel Your Day<br /><span className="text-green-400">The Right Way</span></h2>
            <p className="text-gray-400 text-xs mt-1">Every meal, built for your goals</p>
          </div>
          <div className="flex flex-col gap-2 items-end text-right">
            <div className="bg-emerald-500/20 rounded-2xl px-3 py-1.5">
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest block">Up to</span>
              <span className="text-emerald-400 font-black text-lg leading-none">42g protein</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 flex-wrap mb-4 px-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mr-1">Badges:</span>
          <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">30g+ Protein</span>
          <span className="bg-green-400 text-white text-[10px] font-bold px-2 py-1 rounded-full">20g+ Protein</span>
          <span className="bg-sky-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">Low Cal</span>
          <span className="bg-violet-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">Fiber Rich</span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4">
          <AnimatePresence>
            {filtered.map(meal => (
              <MealCardA key={meal.id} meal={meal} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
