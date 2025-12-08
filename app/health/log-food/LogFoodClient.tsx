'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Search, 
  ChevronLeft, 
  Flame, 
  Loader2,
  Utensils,
  Plus,
  Trash2,
  Pencil
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  searchMeals, 
  logFood, 
  deleteFoodLog, 
  updateFoodLog,
  type MealSearchResult, 
  type FoodLogItem 
} from '@/app/actions/food-logging'
import { cn } from '@/lib/utils'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

interface LogFoodClientProps {
  initialLogs: FoodLogItem[]
}

export default function LogFoodClient({ initialLogs }: LogFoodClientProps) {
  const router = useRouter()
  
  // View State
  const [isAddingFood, setIsAddingFood] = useState(false)
  const [logs, setLogs] = useState<FoodLogItem[]>(initialLogs)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)

  // Sync logs when initialLogs updates
  useEffect(() => {
    setLogs(initialLogs)
  }, [initialLogs])

  // Form State
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MealSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  })

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true)
        try {
          const results = await searchMeals(searchQuery)
          setSearchResults(results)
          setShowResults(true)
        } catch (error) {
          console.error(error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, name: value }))
    setSearchQuery(value)
  }

  const selectMeal = (meal: MealSearchResult) => {
    setFormData({
      name: meal.name,
      calories: meal.calories.toString(),
      protein: meal.protein.toString(),
      carbs: meal.carbs.toString(),
      fat: meal.fat.toString()
    })
    setShowResults(false)
    setSearchQuery('') 
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const input = {
        custom_food_name: formData.name,
        quantity: 1,
        calories: Number(formData.calories),
        protein: Number(formData.protein),
        carbs: Number(formData.carbs),
        fat: Number(formData.fat),
        meal_type: mealType,
        date: new Date().toISOString().split('T')[0]
      }

      if (editingLogId) {
        await updateFoodLog(editingLogId, input)
        setIsAddingFood(false)
        setEditingLogId(null)
        router.refresh()
      } else {
        await logFood(input)
        setShowSuccessModal(true)
      }
    } catch (error) {
      console.error('Failed to log/update food', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (log: FoodLogItem) => {
    setEditingLogId(log.id)
    setFormData({
      name: log.name,
      calories: log.calories.toString(),
      protein: log.protein.toString(),
      carbs: log.carbs.toString(),
      fat: log.fat.toString()
    })
    setMealType(log.meal_type as MealType)
    setIsAddingFood(true)
  }

  const handleDelete = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this log?')) return
    try {
      await deleteFoodLog(logId)
      // Optimistic update
      setLogs(prev => prev.filter(l => l.id !== logId))
      router.refresh()
    } catch (error) {
      console.error('Failed to delete log', error)
    }
  }

  const handleAddAnother = () => {
    setShowSuccessModal(false)
    setFormData({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    })
    setSearchQuery('')
    setSearchResults([])
    setEditingLogId(null)
  }

  const handleDone = () => {
    setShowSuccessModal(false)
    setIsAddingFood(false)
    setEditingLogId(null)
    router.refresh() 
  }

  const handleCloseForm = () => {
    setIsAddingFood(false)
    setEditingLogId(null)
    setFormData({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    })
  }

  // Group logs by meal type
  const groupedLogs = {
    breakfast: logs.filter(l => l.meal_type === 'breakfast'),
    lunch: logs.filter(l => l.meal_type === 'lunch'),
    dinner: logs.filter(l => l.meal_type === 'dinner'),
    snack: logs.filter(l => l.meal_type === 'snack'),
  }

  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0)
  const totalProtein = logs.reduce((sum, log) => sum + log.protein, 0)
  const totalCarbs = logs.reduce((sum, log) => sum + log.carbs, 0)
  const totalFat = logs.reduce((sum, log) => sum + log.fat, 0)

  if (isAddingFood) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 relative" onClick={() => setShowResults(false)}>
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4">
          <div className="max-w-md mx-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleCloseForm} className="-ml-2">
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900">{editingLogId ? 'Edit Food' : 'Add Food'}</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6 space-y-6">
          {/* Meal Type Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  mealType === type 
                    ? "bg-green-600 text-white shadow-sm" 
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4" onClick={e => e.stopPropagation()}>
              <div className="space-y-2 relative z-20">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Food Name</label>
                <div className="relative">
                  <Input 
                    required
                    placeholder="Type to search (e.g. Chicken Salad)"
                    className="bg-white pr-10"
                    value={formData.name}
                    onChange={handleNameChange}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowResults(true)
                    }}
                    autoComplete="off"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {showResults && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-h-60 overflow-y-auto z-50"
                    >
                      {searchResults.map((meal) => (
                        <button
                          key={meal.id}
                          type="button"
                          onClick={() => selectMeal(meal)}
                          className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            meal.food_type === 'vegetarian' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                          )}>
                            <Utensils className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{meal.name}</p>
                            <p className="text-xs text-gray-500">{meal.calories} kcal</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Calories</label>
                  <div className="relative">
                    <Input 
                      required
                      type="number"
                      placeholder="0"
                      className="bg-white pl-8"
                      value={formData.calories}
                      onChange={e => setFormData({...formData, calories: e.target.value})}
                    />
                    <Flame className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Protein (g)</label>
                  <Input 
                    type="number"
                    placeholder="0"
                    className="bg-white"
                    value={formData.protein}
                    onChange={e => setFormData({...formData, protein: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Carbs (g)</label>
                  <Input 
                    type="number"
                    placeholder="0"
                    className="bg-white"
                    value={formData.carbs}
                    onChange={e => setFormData({...formData, carbs: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fat (g)</label>
                  <Input 
                    type="number"
                    placeholder="0"
                    className="bg-white"
                    value={formData.fat}
                    onChange={e => setFormData({...formData, fat: e.target.value})}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingLogId ? 'Update Food' : 'Log Food')}
              </Button>
            </form>
          </motion.div>
        </main>

        {/* Success Modal */}
        <AnimatePresence>
          {showSuccessModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                onClick={handleDone}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto"
              >
                <Card className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Utensils className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Food Logged!</h3>
                    <p className="text-gray-500 mt-1">
                      {formData.name} has been added to your daily log.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={handleAddAnother}>
                      Add Another
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleDone}>
                      Done
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/health')} className="-ml-2">
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900">Today's Food</h1>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-orange-50 p-2 rounded-xl text-center border border-orange-100">
              <p className="text-[10px] uppercase tracking-wider text-orange-600 font-bold">Cals</p>
              <p className="text-sm font-bold text-orange-700">{totalCalories}</p>
            </div>
            <div className="bg-blue-50 p-2 rounded-xl text-center border border-blue-100">
              <p className="text-[10px] uppercase tracking-wider text-blue-600 font-bold">Protein</p>
              <p className="text-sm font-bold text-blue-700">{totalProtein}g</p>
            </div>
            <div className="bg-green-50 p-2 rounded-xl text-center border border-green-100">
              <p className="text-[10px] uppercase tracking-wider text-green-600 font-bold">Carbs</p>
              <p className="text-sm font-bold text-green-700">{totalCarbs}g</p>
            </div>
            <div className="bg-yellow-50 p-2 rounded-xl text-center border border-yellow-100">
              <p className="text-[10px] uppercase tracking-wider text-yellow-600 font-bold">Fat</p>
              <p className="text-sm font-bold text-yellow-700">{totalFat}g</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-8">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No food logged yet</h3>
            <p className="text-gray-500 mt-1">Start tracking your meals for today</p>
            <Button 
              onClick={() => setIsAddingFood(true)}
              className="mt-6 bg-green-600 hover:bg-green-700 text-white"
            >
              Log Your First Meal
            </Button>
          </div>
        ) : (
          <>
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => {
              const typeLogs = groupedLogs[type]
              if (typeLogs.length === 0) return null
              
              return (
                <section key={type} className="space-y-3">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                    {type}
                    <span className="text-xs font-normal bg-gray-100 px-2 py-0.5 rounded-full">
                      {typeLogs.reduce((sum, l) => sum + l.calories, 0)} kcal
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {typeLogs.map((log) => (
                      <Card key={log.id} className="p-4 flex items-center justify-between shadow-sm border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">{log.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3 text-orange-500" />
                              {log.calories}
                            </span>
                            <span>P: {log.protein}g</span>
                            <span>C: {log.carbs}g</span>
                            <span>F: {log.fat}g</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-blue-600"
                            onClick={() => handleEdit(log)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-red-600"
                            onClick={() => handleDelete(log.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              )
            })}
          </>
        )}
      </main>

      <div className="fixed bottom-24 right-6 z-40">
        <Button 
          onClick={() => setIsAddingFood(true)}
          className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg flex items-center justify-center"
        >
          <Plus className="w-8 h-8" />
        </Button>
      </div>
    </div>
  )
}
