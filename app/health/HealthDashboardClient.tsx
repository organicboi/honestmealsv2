'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { 
  Flame, 
  Droplets, 
  Trophy, 
  Plus, 
  Activity, 
  ChevronRight,
  Scale,
  Utensils
} from 'lucide-react'
import { HealthDashboardData, logWater } from '@/app/actions/health'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default function HealthDashboardClient({ data }: { data: HealthDashboardData }) {
  const [waterIntake, setWaterIntake] = useState(data.water.current)
  const [isUpdatingWater, setIsUpdatingWater] = useState(false)

  const handleAddWater = async () => {
    setIsUpdatingWater(true)
    const amount = 250 // Add 250ml
    try {
      await logWater(amount)
      setWaterIntake(prev => prev + amount)
    } catch (error) {
      console.error('Failed to log water', error)
    } finally {
      setIsUpdatingWater(false)
    }
  }

  const calorieProgress = Math.min((data.nutrition.calories.current / data.nutrition.calories.goal) * 100, 100)
  const waterProgress = Math.min((waterIntake / data.water.goal) * 100, 100)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Good Morning,</p>
            <h1 className="text-xl font-bold text-gray-900">{data.user.name}</h1>
          </div>
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
            {data.user.name.charAt(0)}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Calories Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 bg-white rounded-2xl shadow-sm border-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Flame className="w-12 h-12" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-orange-50 rounded-full">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase">Calories</span>
              </div>
              <div className="mb-2">
                <span className="text-2xl font-bold text-gray-900">{data.nutrition.calories.current}</span>
                <span className="text-xs text-gray-400"> / {data.nutrition.calories.goal}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${calorieProgress}%` }}
                />
              </div>
              <Link href="/health/log-food" className="absolute inset-0" />
            </Card>
          </motion.div>

          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4 bg-white rounded-2xl shadow-sm border-0 relative overflow-hidden h-full flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Trophy className="w-12 h-12" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-yellow-50 rounded-full">
                  <Trophy className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase">Streak</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">{data.streak.current}</span>
                <span className="text-sm text-gray-500 ml-1">days</span>
              </div>
              <p className="text-xs text-gray-400">Best: {data.streak.longest} days</p>
            </Card>
          </motion.div>
        </div>

        {/* Water Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-5 bg-white rounded-2xl shadow-sm border-0">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-full">
                  <Droplets className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Hydration</h3>
                  <p className="text-xs text-gray-500">{waterIntake}ml / {data.water.goal}ml</p>
                </div>
              </div>
              <Button 
                onClick={handleAddWater}
                disabled={isUpdatingWater}
                size="sm"
                className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-0 rounded-full h-8 px-3"
              >
                <Plus className="w-4 h-4 mr-1" /> 250ml
              </Button>
            </div>
            
            {/* Water Visual */}
            <div className="relative h-12 bg-blue-50 rounded-xl overflow-hidden flex items-center justify-center">
              <div 
                className="absolute left-0 top-0 bottom-0 bg-blue-200 transition-all duration-700 ease-out"
                style={{ width: `${waterProgress}%` }}
              />
              <span className="relative z-10 text-sm font-medium text-blue-800">
                {Math.round(waterProgress)}% Daily Goal
              </span>
            </div>
          </Card>
        </motion.div>

        {/* Macros Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-5 bg-white rounded-2xl shadow-sm border-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-50 rounded-full">
                <Utensils className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900">Macros</h3>
            </div>

            <div className="space-y-4">
              {/* Protein */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Protein</span>
                  <span className="font-medium text-gray-900">{data.nutrition.protein.current}g <span className="text-gray-400">/ {data.nutrition.protein.goal}g</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min((data.nutrition.protein.current / data.nutrition.protein.goal) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Carbs</span>
                  <span className="font-medium text-gray-900">{data.nutrition.carbs.current}g <span className="text-gray-400">/ {data.nutrition.carbs.goal}g</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${Math.min((data.nutrition.carbs.current / data.nutrition.carbs.goal) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Fat */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Fat</span>
                  <span className="font-medium text-gray-900">{data.nutrition.fat.current}g <span className="text-gray-400">/ {data.nutrition.fat.goal}g</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-400 rounded-full"
                    style={{ width: `${Math.min((data.nutrition.fat.current / data.nutrition.fat.goal) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Weight / Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-5 bg-white rounded-2xl shadow-sm border-0">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-full">
                  <Scale className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Weight Progress</h3>
                  <p className="text-xs text-gray-500">Goal: {data.weight.goal ? `${data.weight.goal}kg` : 'Not set'}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
            
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900">{data.weight.current}</span>
              <span className="text-lg text-gray-500 font-medium mb-1">kg</span>
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Activity className="w-3 h-3" /> On track
            </p>
          </Card>
        </motion.div>

      </main>
    </div>
  )
}
