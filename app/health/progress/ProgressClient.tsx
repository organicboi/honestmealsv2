'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  ArrowLeft, 
  Plus, 
  Camera, 
  Scale, 
  Calendar as CalendarIcon, 
  X, 
  Trash2, 
  Edit2, 
  Upload, 
  Download, 
  History, 
  Target, 
  TrendingDown, 
  TrendingUp, 
  Minus,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { WeightLog, ProgressPhoto, logWeight, addProgressPhoto, deleteProgressPhoto, updateProgressPhoto, deleteWeightLog, updateWeightLog, updateGoalWeight } from '@/app/actions/progress'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const MOTIVATIONAL_QUOTES = [
  "The only bad workout is the one that didn't happen.",
  "Your body can stand almost anything. It's your mind that you have to convince.",
  "Fitness is not about being better than someone else. It's about being better than you were yesterday.",
  "Don't stop when you're tired. Stop when you're done.",
  "Motivation is what gets you started. Habit is what keeps you going."
]

export default function ProgressClient({ 
  weightHistory, 
  photos,
  goalWeight
}: { 
  weightHistory: WeightLog[]
  photos: ProgressPhoto[]
  goalWeight: number | null
}) {
  const [isLoggingWeight, setIsLoggingWeight] = useState(false)
  const [isAddingPhoto, setIsAddingPhoto] = useState(false)
  const [isSettingGoal, setIsSettingGoal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [editingLog, setEditingLog] = useState<WeightLog | null>(null)
  const [newWeight, setNewWeight] = useState('')
  const [goalWeightInput, setGoalWeightInput] = useState(goalWeight?.toString() || '')
  const [photoNotes, setPhotoNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<ProgressPhoto | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<ProgressPhoto | null>(null)
  const router = useRouter()

  // Derived State
  const currentWeight = weightHistory.length > 0 
    ? weightHistory[weightHistory.length - 1].weight 
    : 0
  
  const startWeight = weightHistory.length > 0 ? weightHistory[0].weight : currentWeight
  const weightChange = currentWeight - startWeight
  const isWeightLoss = weightChange <= 0

  const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]

  // Handlers
  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWeight) return

    setIsSubmitting(true)
    try {
      await logWeight(parseFloat(newWeight), new Date().toISOString().split('T')[0])
      setIsLoggingWeight(false)
      setNewWeight('')
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    setUploading(true)
    
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('progress_photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('progress_photos')
        .getPublicUrl(filePath)

      await addProgressPhoto(
        publicUrl,
        newWeight ? parseFloat(newWeight) : null,
        new Date().toISOString(),
        photoNotes
      )

      setIsAddingPhoto(false)
      setNewWeight('')
      setPhotoNotes('')
      router.refresh()
    } catch (error: any) {
      console.error('Error uploading image:', error)
      alert(`Error uploading image: ${error.message || 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return
    try {
      await deleteProgressPhoto(id)
      router.refresh()
    } catch (error) {
      console.error(error)
    }
  }

  const handleUpdatePhoto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPhoto) return

    setIsSubmitting(true)
    try {
      await updateProgressPhoto(editingPhoto.id, {
        weight: editingPhoto.weight,
        notes: editingPhoto.notes
      })
      setEditingPhoto(null)
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this weight log?')) return
    try {
      await deleteWeightLog(id)
      router.refresh()
    } catch (error) {
      console.error(error)
    }
  }

  const handleUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLog) return

    setIsSubmitting(true)
    try {
      await updateWeightLog(editingLog.id, editingLog.weight, editingLog.log_date)
      setEditingLog(null)
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSetGoalWeight = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goalWeightInput) return

    setIsSubmitting(true)
    try {
      await updateGoalWeight(parseFloat(goalWeightInput))
      setIsSettingGoal(false)
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Chart Data
  const chartData = weightHistory.map(log => ({
    date: new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: log.weight
  }))

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/health">
              <Button variant="ghost" size="icon" className="rounded-full -ml-2 hover:bg-gray-100">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Progress</h1>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* 1. Hero Card: Current Weight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-linear-to-br from-green-500 to-emerald-700 border-0 shadow-lg shadow-green-500/20 rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-24 bg-black/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
            
            <div className="p-6 relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-green-50 text-sm font-medium mb-1">Current Weight</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white tracking-tight">{currentWeight}</span>
                    <span className="text-xl text-green-100 font-medium">kg</span>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center min-w-[80px]">
                  <p className="text-green-50 text-[10px] font-bold uppercase tracking-wider mb-1">Change</p>
                  <div className="flex items-center gap-1">
                    {isWeightLoss ? (
                      <TrendingDown className="w-4 h-4 text-green-200" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-green-200" />
                    )}
                    <span className="text-white font-bold">
                      {Math.abs(weightChange).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => setIsLoggingWeight(true)}
                  className="flex-1 bg-white text-green-700 hover:bg-green-50 border-0 rounded-xl h-12 font-bold shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Log Today's Weight
                </Button>
                <Button
                  onClick={() => setShowHistory(true)}
                  className="w-12 bg-white/20 text-white hover:bg-white/30 border-0 rounded-xl h-12 shadow-sm transition-all active:scale-95 backdrop-blur-sm"
                  title="View History"
                >
                  <History className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 2. Goal & Quote Split */}
        <div className="grid grid-cols-[1fr_2fr] gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setIsSettingGoal(true)}
            className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-95 flex flex-col justify-center items-center text-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Goal</p>
              {goalWeight ? (
                <p className="text-gray-900 text-lg font-bold">{goalWeight} <span className="text-xs text-gray-500 font-normal">kg</span></p>
              ) : (
                <p className="text-blue-600 text-xs font-bold">Set Goal</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 bg-orange-50 rounded-full blur-2xl -mr-6 -mt-6 opacity-50" />
            <p className="text-gray-600 text-xs font-medium italic text-center leading-relaxed relative z-10">
              "{quote}"
            </p>
          </motion.div>
        </div>

        {/* 3. Chart Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900">Weight Trend</h3>
              <div className="flex gap-2">
                {/* Placeholder for time range filters if needed later */}
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">All Time</span>
              </div>
            </div>

            <div className="h-56 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#9ca3af' }} 
                    dy={10}
                    minTickGap={30}
                  />
                  <YAxis 
                    domain={['dataMin - 2', 'dataMax + 2']} 
                    hide 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#059669', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorWeight)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* 4. Photos Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-bold text-gray-900">Progress Photos</h2>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full text-xs font-bold"
              onClick={() => setIsAddingPhoto(true)}
            >
              <Camera className="w-4 h-4 mr-1.5" />
              Add Photo
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {isAddingPhoto && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="col-span-2"
                >
                  <Card className="p-4 bg-white rounded-3xl shadow-sm border border-green-100 overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-900 text-sm">New Photo</h3>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsAddingPhoto(false)}>
                        <X className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-green-200 bg-green-50/50 rounded-2xl p-8 text-center hover:bg-green-50 transition-colors relative group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          disabled={uploading}
                        />
                        <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:scale-105 transition-transform">
                          {uploading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-1">
                                <Camera className="w-6 h-6 text-green-600" />
                              </div>
                              <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Tap to Upload</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Weight</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={newWeight}
                            onChange={(e) => setNewWeight(e.target.value)}
                            placeholder="kg"
                            className="h-10 bg-gray-50 border-gray-200 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Notes</label>
                          <Input
                            value={photoNotes}
                            onChange={(e) => setPhotoNotes(e.target.value)}
                            placeholder="..."
                            className="h-10 bg-gray-50 border-gray-200 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {photos.map((photo) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-gray-100 group cursor-pointer shadow-sm"
                  onClick={() => setViewingPhoto(photo)}
                >
                  <img 
                    src={photo.image_url} 
                    alt="Progress" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-bold text-sm">
                      {new Date(photo.taken_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                    {photo.weight && (
                      <div className="flex items-center gap-1 text-white/90 text-xs font-medium">
                        <Scale className="w-3 h-3" />
                        {photo.weight} kg
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {photos.length === 0 && !isAddingPhoto && (
              <div className="col-span-2 py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium text-sm">No photos yet</p>
                <p className="text-gray-400 text-xs mt-1">Start tracking your visual progress</p>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {/* Set Goal Modal */}
          {isSettingGoal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
              >
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-gray-900">Set Goal Weight</h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsSettingGoal(false)} className="rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="p-6">
                  <form onSubmit={handleSetGoalWeight} className="space-y-6">
                    <div className="text-center">
                      <div className="inline-block p-4 bg-blue-50 rounded-full mb-4">
                        <Target className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-gray-500 text-sm mb-6">What is your target weight?</p>
                      <div className="relative max-w-[160px] mx-auto">
                        <Input
                          type="number"
                          step="0.1"
                          value={goalWeightInput}
                          onChange={(e) => setGoalWeightInput(e.target.value)}
                          placeholder="0.0"
                          className="text-center text-4xl font-bold h-16 border-2 border-blue-100 focus:border-blue-500 rounded-2xl bg-white"
                          autoFocus
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">kg</span>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12 text-base font-bold shadow-lg shadow-blue-200" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Set Goal'}
                    </Button>
                  </form>
                </div>
              </motion.div>
            </div>
          )}

          {/* Log Weight Modal */}
          {isLoggingWeight && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
              >
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-gray-900">Log Weight</h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsLoggingWeight(false)} className="rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="p-6">
                  <form onSubmit={handleLogWeight} className="space-y-6">
                    <div className="text-center">
                      <div className="inline-block p-4 bg-green-50 rounded-full mb-4">
                        <Scale className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-gray-500 text-sm mb-6">Enter today's weight</p>
                      <div className="relative max-w-[160px] mx-auto">
                        <Input
                          type="number"
                          step="0.1"
                          value={newWeight}
                          onChange={(e) => setNewWeight(e.target.value)}
                          placeholder="0.0"
                          className="text-center text-4xl font-bold h-16 border-2 border-green-100 focus:border-green-500 rounded-2xl bg-white"
                          autoFocus
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">kg</span>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full h-12 text-base font-bold shadow-lg shadow-green-200" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Entry'}
                    </Button>
                  </form>
                </div>
              </motion.div>
            </div>
          )}

          {/* History Modal */}
          {showHistory && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl"
              >
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-gray-900">History</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="overflow-y-auto p-4 space-y-3">
                  {weightHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500">No history yet.</p>
                    </div>
                  ) : (
                    [...weightHistory].reverse().map((log) => (
                      <div key={log.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        {editingLog?.id === log.id ? (
                          <form onSubmit={handleUpdateLog} className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.1"
                              value={editingLog.weight}
                              onChange={(e) => setEditingLog({ ...editingLog, weight: parseFloat(e.target.value) })}
                              className="w-24 h-10 text-lg font-bold bg-white"
                              autoFocus
                            />
                            <Input
                              type="date"
                              value={editingLog.log_date.split('T')[0]}
                              onChange={(e) => setEditingLog({ ...editingLog, log_date: e.target.value })}
                              className="flex-1 h-10 bg-white"
                            />
                            <Button type="submit" size="icon" className="h-10 w-10 bg-green-600 hover:bg-green-700 text-white rounded-full shrink-0">
                              <Upload className="w-4 h-4" />
                            </Button>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 rounded-full shrink-0"
                              onClick={() => setEditingLog(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </form>
                        ) : (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-green-600 border border-gray-100">
                                <Scale className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-lg">{log.weight} <span className="text-sm text-gray-500 font-normal">kg</span></p>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                                  {new Date(log.log_date).toLocaleDateString(undefined, { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                onClick={() => setEditingLog(log)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                onClick={() => handleDeleteLog(log.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Full Screen Photo Viewer */}
          {viewingPhoto && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black flex flex-col"
            >
              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 p-6 flex justify-end items-center z-10 bg-linear-to-b from-black/60 to-transparent">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full h-12 w-12"
                  onClick={() => setViewingPhoto(null)}
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Main Image */}
              <div className="flex-1 flex items-center justify-center overflow-hidden bg-black relative">
                <img 
                  src={viewingPhoto.image_url} 
                  alt="Progress" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Bottom Toolbar */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/10 pb-safe">
                <div className="flex items-center justify-between px-6 py-6">
                  {/* Left: Info */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">
                        {viewingPhoto.weight ? viewingPhoto.weight : '--'}
                      </span>
                      <span className="text-gray-400 text-lg font-medium">kg</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      {new Date(viewingPhoto.taken_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white hover:bg-white/10 rounded-full h-12 w-12"
                      onClick={async () => {
                        try {
                          const response = await fetch(viewingPhoto.image_url);
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `progress-photo-${new Date(viewingPhoto.taken_at).toISOString().split('T')[0]}.jpg`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (e) {
                          console.error('Download failed', e);
                          alert('Failed to download image');
                        }
                      }}
                    >
                      <Download className="w-6 h-6" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white hover:bg-white/10 rounded-full h-12 w-12"
                      onClick={() => {
                        setEditingPhoto(viewingPhoto)
                        // Close viewer to show edit modal? Or show edit modal on top?
                        // For simplicity, let's close viewer and open edit modal
                        // But wait, edit modal is not full screen.
                        // Let's just keep viewer open and show edit modal on top if possible, 
                        // but my structure has edit modal outside.
                        // I'll just set editingPhoto and keep viewingPhoto.
                      }}
                    >
                      <Edit2 className="w-6 h-6" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:bg-red-500/10 rounded-full h-12 w-12"
                      onClick={() => {
                        handleDeletePhoto(viewingPhoto.id)
                        setViewingPhoto(null)
                      }}
                    >
                      <Trash2 className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
                
                {/* Notes Section (if exists) */}
                {viewingPhoto.notes && (
                  <div className="px-6 pb-8 pt-0">
                    <p className="text-gray-300 text-base leading-relaxed border-l-2 border-green-500 pl-4 py-1">
                      {viewingPhoto.notes}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Edit Photo Modal (on top of viewer if needed) */}
          {editingPhoto && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm p-6 bg-white rounded-3xl shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-gray-900">Edit Photo Details</h3>
                  <Button variant="ghost" size="icon" onClick={() => setEditingPhoto(null)} className="rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <form onSubmit={handleUpdatePhoto} className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Weight</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editingPhoto.weight || ''}
                      onChange={(e) => setEditingPhoto({...editingPhoto, weight: parseFloat(e.target.value) || null})}
                      className="h-12 text-lg bg-gray-50 border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Notes</label>
                    <Input
                      value={editingPhoto.notes || ''}
                      onChange={(e) => setEditingPhoto({...editingPhoto, notes: e.target.value})}
                      className="h-12 text-lg bg-gray-50 border-gray-200 rounded-xl"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full h-12 font-bold shadow-lg shadow-green-200" disabled={isSubmitting}>
                    Save Changes
                  </Button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
