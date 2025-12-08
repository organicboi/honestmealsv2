'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Search, 
  ChevronLeft, 
  Flame, 
  Loader2,
  Utensils,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  ChevronRight,
  ScanBarcode
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

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative">
      {/* Main Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push('/health')} className="rounded-full -ml-2 hover:bg-gray-100">
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Today's Food</h1>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsAddingFood(true)}
              className="rounded-full bg-green-50 text-green-600 hover:bg-green-100"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Macro Summary Cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-orange-50 p-2.5 rounded-2xl text-center border border-orange-100 flex flex-col justify-center">
              <p className="text-[10px] uppercase tracking-wider text-orange-600 font-bold mb-0.5">Cals</p>
              <p className="text-sm font-bold text-orange-900 leading-none">{totalCalories}</p>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-2xl text-center border border-blue-100 flex flex-col justify-center">
              <p className="text-[10px] uppercase tracking-wider text-blue-600 font-bold mb-0.5">Pro</p>
              <p className="text-sm font-bold text-blue-900 leading-none">{totalProtein}g</p>
            </div>
            <div className="bg-green-50 p-2.5 rounded-2xl text-center border border-green-100 flex flex-col justify-center">
              <p className="text-[10px] uppercase tracking-wider text-green-600 font-bold mb-0.5">Carb</p>
              <p className="text-sm font-bold text-green-900 leading-none">{totalCarbs}g</p>
            </div>
            <div className="bg-yellow-50 p-2.5 rounded-2xl text-center border border-yellow-100 flex flex-col justify-center">
              <p className="text-[10px] uppercase tracking-wider text-yellow-600 font-bold mb-0.5">Fat</p>
              <p className="text-sm font-bold text-yellow-900 leading-none">{totalFat}g</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-8">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Utensils className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No food logged yet</h3>
            <p className="text-gray-500 mt-2 max-w-[200px]">Start tracking your meals to reach your goals</p>
            <Button 
              onClick={() => setIsAddingFood(true)}
              className="mt-8 bg-green-600 hover:bg-green-700 text-white rounded-full px-8 h-12 font-bold shadow-lg shadow-green-200"
            >
              Log Breakfast
            </Button>
          </div>
        ) : (
          <>
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => {
              const typeLogs = groupedLogs[type]
              if (typeLogs.length === 0) return null
              
              return (
                <motion.section 
                  key={type} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-bold text-gray-900 capitalize flex items-center gap-2">
                      {type}
                    </h2>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      {typeLogs.reduce((sum, l) => sum + l.calories, 0)} kcal
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {typeLogs.map((log) => (
                      <Card key={log.id} className="p-4 flex items-center justify-between shadow-sm border-gray-100 rounded-2xl bg-white group">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="font-bold text-gray-900 truncate">{log.name}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md">
                              <Flame className="w-3 h-3" />
                              {log.calories}
                            </span>
                            <div className="flex gap-2 text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                              <span>P: {log.protein}</span>
                              <span>C: {log.carbs}</span>
                              <span>F: {log.fat}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                            onClick={() => handleEdit(log)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                            onClick={() => handleDelete(log.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </motion.section>
              )
            })}
          </>
        )}
      </main>

      {/* Add Food Overlay */}
      <AnimatePresence>
        {isAddingFood && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-gray-50 flex flex-col"
          >
            {/* Overlay Header */}
            <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
              <Button variant="ghost" size="icon" onClick={handleCloseForm} className="rounded-full -ml-2">
                <X className="w-6 h-6 text-gray-600" />
              </Button>
              <h2 className="text-lg font-bold text-gray-900">{editingLogId ? 'Edit Food' : 'Add Food'}</h2>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-32" onClick={() => setShowResults(false)}>
              <div className="max-w-md mx-auto space-y-6">
                
                {/* Meal Type Selector */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setMealType(type)}
                      className={cn(
                        "px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                        mealType === type 
                          ? "bg-green-600 text-white shadow-md shadow-green-200 scale-105" 
                          : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" onClick={e => e.stopPropagation()}>
                  {/* Search / Name Input */}
                  <div className="space-y-2 relative z-20">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Food Name</label>
                    <div className="relative">
                      <Input 
                        required
                        placeholder="Search food (e.g. Banana)"
                        className="bg-white h-14 pl-12 rounded-2xl border-gray-200 text-lg shadow-sm focus:ring-2 focus:ring-green-500/20"
                        value={formData.name}
                        onChange={handleNameChange}
                        onFocus={() => {
                          if (searchResults.length > 0) setShowResults(true)
                        }}
                        autoComplete="off"
                        autoFocus={!editingLogId}
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        {isSearching ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Search className="w-5 h-5" />
                        )}
                      </div>
                    </div>

                    {/* Search Results Dropdown */}
                    <AnimatePresence>
                      {showResults && searchResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-[300px] overflow-y-auto z-50"
                        >
                          {searchResults.map((meal) => (
                            <button
                              key={meal.id}
                              type="button"
                              onClick={() => selectMeal(meal)}
                              className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 group"
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                meal.food_type === 'vegetarian' ? "bg-green-100 text-green-600 group-hover:bg-green-200" : "bg-red-100 text-red-600 group-hover:bg-red-200"
                              )}>
                                <Utensils className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-gray-900">{meal.name}</p>
                                <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                                  <span className="font-medium text-orange-600">{meal.calories} kcal</span>
                                  <span>P: {meal.protein}g</span>
                                  <span>C: {meal.carbs}g</span>
                                  <span>F: {meal.fat}g</span>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-300" />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Manual Entry Fields */}
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                      <ScanBarcode className="w-5 h-5 text-gray-400" />
                      <h3 className="font-bold text-gray-900 text-sm">Nutritional Info</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Calories</label>
                        <div className="relative">
                          <Input 
                            required
                            type="number"
                            placeholder="0"
                            className="bg-gray-50 h-12 pl-10 rounded-xl border-gray-200 font-bold text-lg"
                            value={formData.calories}
                            onChange={e => setFormData({...formData, calories: e.target.value})}
                          />
                          <Flame className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Protein (g)</label>
                        <Input 
                          type="number"
                          placeholder="0"
                          className="bg-gray-50 h-12 rounded-xl border-gray-200"
                          value={formData.protein}
                          onChange={e => setFormData({...formData, protein: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Carbs (g)</label>
                        <Input 
                          type="number"
                          placeholder="0"
                          className="bg-gray-50 h-12 rounded-xl border-gray-200"
                          value={formData.carbs}
                          onChange={e => setFormData({...formData, carbs: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Fat (g)</label>
                        <Input 
                          type="number"
                          placeholder="0"
                          className="bg-gray-50 h-12 rounded-xl border-gray-200"
                          value={formData.fat}
                          onChange={e => setFormData({...formData, fat: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe">
                    <Button 
                      type="submit" 
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-14 rounded-full text-lg shadow-lg shadow-green-200 max-w-md mx-auto block"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (editingLogId ? 'Update Food' : 'Add to Log')}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleDone}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Food Logged!</h3>
              <p className="text-gray-500 mb-8">
                <span className="font-bold text-gray-900">{formData.name}</span> has been added to your daily log.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleAddAnother}
                  className="h-12 rounded-xl font-bold border-gray-200"
                >
                  Add Another
                </Button>
                <Button 
                  onClick={handleDone}
                  className="h-12 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (Only visible when not adding food) */}
      {!isAddingFood && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-24 right-6 z-20"
        >
          <Button 
            onClick={() => setIsAddingFood(true)}
            className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-300 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-8 h-8" />
          </Button>
        </motion.div>
      )}
    </div>
  )
}
