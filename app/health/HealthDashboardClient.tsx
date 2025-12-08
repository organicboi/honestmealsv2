'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Flame, 
  Droplets, 
  Trophy, 
  Plus, 
  Activity, 
  ChevronRight,
  Scale,
  Utensils,
  ArrowRight,
  Zap,
  History,
  Trash2,
  Pencil,
  X,
  Check,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { HealthDashboardData, logWater, getWaterLogs, updateWaterLog, deleteWaterLog, updateWaterGoal } from '@/app/actions/health'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function HealthDashboardClient({ data }: { data: HealthDashboardData }) {
  const [waterIntake, setWaterIntake] = useState(data.water.current)
  const [isUpdatingWater, setIsUpdatingWater] = useState(false)
  const [showWaterModal, setShowWaterModal] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [unit, setUnit] = useState<'ml' | 'L'>('ml')
  const [isFlowing, setIsFlowing] = useState(false)
  
  // History State
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [waterLogs, setWaterLogs] = useState<any[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')

  // Goal State
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [newGoal, setNewGoal] = useState(data.water.goal.toString())
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false)

  // Weight Calculations
  const startWeight = data.weight.start || data.weight.current
  const currentWeight = data.weight.current
  const goalWeight = data.weight.goal || currentWeight
  const heightInM = data.weight.height ? data.weight.height / 100 : null
  
  const bmi = heightInM ? (currentWeight / (heightInM * heightInM)).toFixed(1) : null
  const bmiValue = bmi ? parseFloat(bmi) : 0
  
  let bmiCategory = 'Normal'
  let bmiColor = 'text-green-600 bg-green-100'
  
  if (bmiValue < 18.5) {
    bmiCategory = 'Underweight'
    bmiColor = 'text-blue-600 bg-blue-100'
  } else if (bmiValue >= 25 && bmiValue < 30) {
    bmiCategory = 'Overweight'
    bmiColor = 'text-orange-600 bg-orange-100'
  } else if (bmiValue >= 30) {
    bmiCategory = 'Obese'
    bmiColor = 'text-red-600 bg-red-100'
  }

  const weightDiff = currentWeight - startWeight
  const isWeightLoss = weightDiff < 0
  const weightChange = Math.abs(weightDiff).toFixed(1)
  
  const totalChangeNeeded = Math.abs(goalWeight - startWeight)
  const currentChange = Math.abs(currentWeight - startWeight)
  const progressPercent = totalChangeNeeded > 0 ? Math.min(100, Math.max(0, (currentChange / totalChangeNeeded) * 100)) : 0

  const handleOpenWaterModal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowWaterModal(true)
  }

  const handleUpdateGoal = async () => {
    const goal = parseInt(newGoal)
    if (isNaN(goal) || goal <= 0) return

    setIsUpdatingGoal(true)
    try {
      await updateWaterGoal(goal)
      setIsEditingGoal(false)
      // Optimistic update handled by revalidatePath but we can update local state too if needed
      // data.water.goal will be updated on next render from server props
    } catch (error) {
      console.error('Failed to update goal', error)
    } finally {
      setIsUpdatingGoal(false)
    }
  }

  const handleOpenHistory = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowHistoryModal(true)
    setIsLoadingLogs(true)
    try {
      const logs = await getWaterLogs()
      setWaterLogs(logs)
    } catch (error) {
      console.error('Failed to fetch logs', error)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const handleDeleteLog = async (id: string, amount: number) => {
    try {
      await deleteWaterLog(id)
      setWaterLogs(prev => prev.filter(log => log.id !== id))
      setWaterIntake(prev => Math.max(0, prev - amount))
    } catch (error) {
      console.error('Failed to delete log', error)
    }
  }

  const handleStartEdit = (log: any) => {
    setEditingLogId(log.id)
    setEditAmount(log.amount_ml.toString())
  }

  const handleSaveEdit = async (id: string, oldAmount: number) => {
    const newAmount = parseFloat(editAmount)
    if (isNaN(newAmount) || newAmount <= 0) return

    try {
      await updateWaterLog(id, newAmount)
      setWaterLogs(prev => prev.map(log => log.id === id ? { ...log, amount_ml: newAmount } : log))
      setWaterIntake(prev => prev - oldAmount + newAmount)
      setEditingLogId(null)
    } catch (error) {
      console.error('Failed to update log', error)
    }
  }

  const handleLogWater = async (amount: number) => {
    setShowWaterModal(false)
    setIsFlowing(true)
    setIsUpdatingWater(true)
    
    try {
      const updatePromise = logWater(amount)
      const animationPromise = new Promise(resolve => setTimeout(resolve, 3000))
      
      await Promise.all([updatePromise, animationPromise])
      
      setWaterIntake(prev => prev + amount)
      setCustomAmount('')
    } catch (error) {
      console.error('Failed to log water', error)
    } finally {
      setIsUpdatingWater(false)
      setIsFlowing(false)
    }
  }

  const handleCustomSubmit = () => {
    if (!customAmount) return
    let amount = parseFloat(customAmount)
    if (unit === 'L') {
        amount = amount * 1000
    }
    handleLogWater(amount)
  }

  const calorieProgress = Math.min((data.nutrition.calories.current / data.nutrition.calories.goal) * 100, 100)
  const waterProgress = Math.min((waterIntake / data.water.goal) * 100, 100)
  const caloriesRemaining = Math.max(data.nutrition.calories.goal - data.nutrition.calories.current, 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      <main className="max-w-md mx-auto px-4 py-6 space-y-5">
        
        {/* 1. Hero: Calories (The most important daily metric) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/health/log-food">
            <Card className="bg-linear-to-br from-orange-500 to-red-600 border-0 shadow-lg shadow-orange-500/20 rounded-3xl overflow-hidden relative group cursor-pointer">
              <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="absolute bottom-0 left-0 p-24 bg-black/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
              
              <div className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                    <Flame className="w-4 h-4 text-white fill-white" />
                    <span className="text-xs font-bold text-white">Calories</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md p-2 rounded-full group-hover:bg-white/30 transition-colors">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="flex items-end gap-3 mb-2">
                  <span className="text-5xl font-bold text-white tracking-tight">{caloriesRemaining}</span>
                  <span className="text-lg text-orange-100 font-medium mb-1.5">kcal left</span>
                </div>
                
                <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className="h-full bg-white rounded-full shadow-sm"
                    style={{ width: `${calorieProgress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs font-medium text-orange-100">
                  <span>{data.nutrition.calories.current} eaten</span>
                  <span>{data.nutrition.calories.goal} goal</span>
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>

        {/* 2. Macros Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          {/* Protein */}
          <Card className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Protein</p>
            <div className="flex items-end gap-1">
              <span className="text-lg font-bold text-gray-900">{data.nutrition.protein.current}</span>
              <span className="text-xs text-gray-400 font-medium mb-1">/ {data.nutrition.protein.goal}g</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${Math.min((data.nutrition.protein.current / data.nutrition.protein.goal) * 100, 100)}%` }}
              />
            </div>
          </Card>

          {/* Carbs */}
          <Card className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Carbs</p>
            <div className="flex items-end gap-1">
              <span className="text-lg font-bold text-gray-900">{data.nutrition.carbs.current}</span>
              <span className="text-xs text-gray-400 font-medium mb-1">/ {data.nutrition.carbs.goal}g</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${Math.min((data.nutrition.carbs.current / data.nutrition.carbs.goal) * 100, 100)}%` }}
              />
            </div>
          </Card>

          {/* Fat */}
          <Card className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fat</p>
            <div className="flex items-end gap-1">
              <span className="text-lg font-bold text-gray-900">{data.nutrition.fat.current}</span>
              <span className="text-xs text-gray-400 font-medium mb-1">/ {data.nutrition.fat.goal}g</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-400 rounded-full"
                style={{ width: `${Math.min((data.nutrition.fat.current / data.nutrition.fat.goal) * 100, 100)}%` }}
              />
            </div>
          </Card>
        </motion.div>

        {/* 3. Hydration & Streak Split */}
        <div className="grid grid-cols-[2fr_1fr] gap-3">
          {/* Hydration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4 bg-blue-50 rounded-3xl border border-blue-100 h-full flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-0 top-0 p-8 bg-blue-100 rounded-full blur-2xl -mr-4 -mt-4 opacity-50" />
              
              <AnimatePresence>
                {isFlowing && (
                  <motion.div
                    initial={{ height: '0%' }}
                    animate={{ height: '100%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                    className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-blue-400/50 to-blue-300/10 z-0"
                  />
                )}
              </AnimatePresence>

              <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white rounded-full shadow-sm">
                    <Droplets className="w-4 h-4 text-blue-500 fill-blue-500" />
                  </div>
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Water</span>
                </div>
              </div>

              <div className="relative z-10 mb-4">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-blue-900">{waterIntake}</span>
                  <span className="text-sm text-blue-600 font-medium">/ {data.water.goal}ml</span>
                </div>
                <div className="h-2 bg-blue-200/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${waterProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2 relative z-10">
                <Button 
                  onClick={handleOpenWaterModal}
                  disabled={isUpdatingWater}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 font-bold shadow-sm shadow-blue-200 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Water
                </Button>
                <Button 
                  onClick={handleOpenHistory}
                  className="w-10 bg-white text-blue-600 hover:bg-blue-50 rounded-xl h-10 shadow-sm transition-all active:scale-95"
                  title="View History"
                >
                  <History className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Streak */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="p-4 bg-orange-50 rounded-3xl border border-orange-100 h-full flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
              {/* Background Effect */}
              <div className="absolute inset-0 bg-linear-to-b from-orange-100/50 to-transparent opacity-50" />
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-200 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-white rounded-full shadow-sm text-orange-500">
                    <Flame className="w-5 h-5 fill-orange-500 animate-pulse" />
                  </div>
                  {data.streak.longest > 0 && (
                    <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                      <Trophy className="w-3 h-3 text-yellow-600" />
                      <span className="text-[10px] font-bold text-orange-800">Best: {data.streak.longest}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-orange-900 tracking-tight">{data.streak.current}</span>
                    <span className="text-sm font-bold text-orange-600">days</span>
                  </div>
                  <p className="text-xs font-medium text-orange-700/80 mt-1">Keep it up!</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* 4. Weight Progress Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link href="/health/progress">
            <Card className="p-5 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95 group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Scale className="w-32 h-32 text-green-600" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
                      <Scale className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900">Weight Progress</h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg group-hover:bg-green-100 transition-colors">
                    <span>Details</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>

                <div className="flex items-end gap-3 mb-5">
                  <span className="text-4xl font-bold text-gray-900 tracking-tight">{currentWeight}</span>
                  <span className="text-lg font-medium text-gray-500 mb-1.5">kg</span>
                  
                  {weightDiff !== 0 && (
                    <div className={`flex items-center gap-1 mb-2 px-2 py-0.5 rounded-full text-xs font-bold ${isWeightLoss ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isWeightLoss ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                      <span>{weightChange} kg</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                    <span>Start: {startWeight}kg</span>
                    <span>Goal: {goalWeight}kg</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-linear-to-r from-green-400 to-green-600 rounded-full"
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">BMI</p>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{bmi || '--'}</span>
                      {bmi && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${bmiColor}`}>
                          {bmiCategory}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Remaining</p>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-900">
                        {Math.abs(currentWeight - goalWeight).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">kg</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>

      </main>

      <AnimatePresence>
        {showWaterModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={() => setShowWaterModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-4 right-4 bottom-24 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-sm bg-white rounded-3xl p-6 z-[70] shadow-xl"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add Water</h2>
              
              {/* Goal Section */}
              <div className="bg-blue-50 rounded-2xl p-4 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Daily Goal</p>
                  {isEditingGoal ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        className="h-8 w-24 bg-white border-blue-200 text-blue-900 font-bold"
                        autoFocus
                      />
                      <span className="text-sm font-medium text-blue-600">ml</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-blue-900">{data.water.goal}</span>
                      <span className="text-sm font-medium text-blue-600">ml</span>
                    </div>
                  )}
                </div>
                
                {isEditingGoal ? (
                  <div className="flex gap-1">
                    <button 
                      onClick={handleUpdateGoal}
                      disabled={isUpdatingGoal}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditingGoal(false)
                        setNewGoal(data.water.goal.toString())
                      }}
                      className="p-2 bg-white text-blue-400 rounded-lg hover:bg-blue-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsEditingGoal(true)}
                    className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-100 shadow-sm"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[250, 500, 750, 1000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    className="h-12 text-lg font-medium hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                    onClick={() => handleLogWater(amount)}
                    disabled={isUpdatingWater}
                  >
                    {amount}ml
                  </Button>
                ))}
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custom Amount</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="text-lg h-12"
                    />
                  </div>
                  <div className="flex bg-gray-100 p-1 rounded-xl h-12 items-center">
                    <button
                      onClick={() => setUnit('ml')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${unit === 'ml' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                    >
                      ml
                    </button>
                    <button
                      onClick={() => setUnit('L')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${unit === 'L' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                    >
                      L
                    </button>
                  </div>
                </div>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-bold shadow-lg shadow-blue-200"
                  onClick={handleCustomSubmit}
                  disabled={isUpdatingWater || !customAmount}
                >
                  Add Water
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistoryModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={() => setShowHistoryModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-4 right-4 bottom-24 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-sm bg-white rounded-3xl p-6 z-[70] shadow-xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Water History</h2>
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {isLoadingLogs ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : waterLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No water logs for today.
                </div>
              ) : (
                <div className="space-y-3">
                  {waterLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                          <Droplets className="w-4 h-4" />
                        </div>
                        <div>
                          {editingLogId === log.id ? (
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="h-8 w-20"
                                autoFocus
                              />
                              <span className="text-sm font-medium text-gray-600">ml</span>
                            </div>
                          ) : (
                            <p className="font-bold text-gray-900">{log.amount_ml} ml</p>
                          )}
                          <p className="text-xs text-gray-400">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {editingLogId === log.id ? (
                          <>
                            <button 
                              onClick={() => handleSaveEdit(log.id, log.amount_ml)}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setEditingLogId(null)}
                              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleStartEdit(log)}
                              className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteLog(log.id, log.amount_ml)}
                              className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
