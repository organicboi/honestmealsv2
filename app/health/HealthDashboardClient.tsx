'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Flame, Droplets, Trophy, Plus, ChevronRight,
  Scale, History, Trash2, Pencil, ArrowRight,
  X, Check, TrendingUp, TrendingDown,
} from 'lucide-react'
import {
  HealthDashboardData, logWater, getWaterLogs,
  updateWaterLog, deleteWaterLog, updateWaterGoal,
} from '@/app/actions/health'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

// ── Animated SVG Ring ──────────────────────────────────────────────────────────
function Ring({
  pct, color, size, stroke, children,
}: {
  pct: number; color: string; size: number; stroke: number; children?: React.ReactNode
}) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const off  = circ * (1 - Math.min(Math.max(pct, 0), 1))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

// ── AI Nudge (fully client-side, zero API calls) ───────────────────────────────
type NudgeColor = 'orange' | 'green' | 'blue' | 'lime'
interface Nudge { text: string; emoji: string; color: NudgeColor; link?: string }

function buildNudge(data: HealthDashboardData, waterIntake: number): Nudge {
  const h        = new Date().getHours()
  const calPct   = data.nutrition.calories.current / (data.nutrition.calories.goal || 1)
  const protPct  = data.nutrition.protein.current  / (data.nutrition.protein.goal  || 1)
  const waterPct = waterIntake                     / (data.water.goal               || 1)
  const calLeft  = Math.max(data.nutrition.calories.goal - data.nutrition.calories.current, 0)
  const protLeft = Math.max(data.nutrition.protein.goal  - data.nutrition.protein.current,  0)

  if (calPct >= 0.99 && protPct >= 0.99 && waterPct >= 0.99)
    return { text: "Every goal hit today. That's what discipline looks like.", emoji: '🎯', color: 'lime' }
  if (protPct < 0.4 && h >= 13)
    return { text: `${Math.round(protLeft)}g protein left. A chicken bowl closes the gap.`, emoji: '🥩', color: 'green', link: '/meals' }
  if (waterPct < 0.5 && h >= 15)
    return { text: `Only ${Math.round(waterPct * 100)}% of water done. Hydration drives recovery.`, emoji: '💧', color: 'blue' }
  if (calLeft > 100 && h >= 19)
    return { text: `${calLeft} kcal left. A light dinner keeps you on track.`, emoji: '🍽️', color: 'orange', link: '/meals' }
  if (h < 10)
    return { text: 'Start with a protein-rich breakfast. Sets the tone for the day.', emoji: '☀️', color: 'orange', link: '/meals' }
  if (protPct < 0.6)
    return { text: `Protein is running low — ${Math.round(protLeft)}g short. Hit it at your next meal.`, emoji: '💪', color: 'green', link: '/meals' }
  return { text: "You're on track. Consistency is the only thing that compounds.", emoji: '📊', color: 'lime' }
}

const NUDGE_THEME: Record<NudgeColor, { bg: string; border: string; text: string }> = {
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700'  },
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700'   },
  lime:   { bg: 'bg-lime-50',   border: 'border-lime-200',   text: 'text-lime-700'   },
}

// ── Streak dot calendar (last 28 days) ────────────────────────────────────────
function StreakDots({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap gap-1 mt-3">
      {Array.from({ length: 28 }, (_, i) => {
        const daysAgo = 27 - i
        return (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.012 * i, duration: 0.18 }}
            className={`w-2.5 h-2.5 rounded-full ${daysAgo < count ? 'bg-orange-400' : 'bg-gray-200'}`}
          />
        )
      })}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function HealthDashboardClient({ data }: { data: HealthDashboardData }) {
  const [waterIntake,    setWaterIntake]    = useState(data.water.current)
  const [isUpdatingWater, setIsUpdatingWater] = useState(false)
  const [showWaterModal, setShowWaterModal] = useState(false)
  const [customAmount,   setCustomAmount]   = useState('')
  const [unit,           setUnit]           = useState<'ml' | 'L'>('ml')
  const [isFlowing,      setIsFlowing]      = useState(false)

  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [waterLogs,        setWaterLogs]        = useState<any[]>([])
  const [isLoadingLogs,    setIsLoadingLogs]    = useState(false)
  const [editingLogId,     setEditingLogId]     = useState<string | null>(null)
  const [editAmount,       setEditAmount]       = useState('')

  const [isEditingGoal,  setIsEditingGoal]  = useState(false)
  const [newGoal,        setNewGoal]        = useState(data.water.goal.toString())
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false)

  // Weight calculations
  const startWeight   = data.weight.start || data.weight.current
  const currentWeight = data.weight.current
  const goalWeight    = data.weight.goal || currentWeight
  const heightInM     = data.weight.height ? data.weight.height / 100 : null
  const bmi           = heightInM ? (currentWeight / (heightInM * heightInM)).toFixed(1) : null
  const bmiValue      = bmi ? parseFloat(bmi) : 0

  let bmiCategory = 'Normal'
  let bmiColor    = 'text-green-600 bg-green-100'
  if (bmiValue < 18.5)                      { bmiCategory = 'Underweight'; bmiColor = 'text-blue-600 bg-blue-100'     }
  else if (bmiValue >= 25 && bmiValue < 30) { bmiCategory = 'Overweight';  bmiColor = 'text-orange-600 bg-orange-100' }
  else if (bmiValue >= 30)                  { bmiCategory = 'Obese';       bmiColor = 'text-red-600 bg-red-100'       }

  const weightDiff    = currentWeight - startWeight
  const isWeightLoss  = weightDiff < 0
  const weightChange  = Math.abs(weightDiff).toFixed(1)
  const totalChange   = Math.abs(goalWeight - startWeight)
  const currentChange = Math.abs(currentWeight - startWeight)
  const progressPct   = totalChange > 0 ? Math.min(100, Math.max(0, (currentChange / totalChange) * 100)) : 0

  // Handlers
  const handleOpenWaterModal = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setShowWaterModal(true) }

  const handleUpdateGoal = async () => {
    const goal = parseInt(newGoal)
    if (isNaN(goal) || goal <= 0) return
    setIsUpdatingGoal(true)
    try   { await updateWaterGoal(goal); setIsEditingGoal(false) }
    catch (e) { console.error('Failed to update goal', e) }
    finally   { setIsUpdatingGoal(false) }
  }

  const handleOpenHistory = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setShowHistoryModal(true); setIsLoadingLogs(true)
    try   { setWaterLogs(await getWaterLogs()) }
    catch (e) { console.error('Failed to fetch logs', e) }
    finally   { setIsLoadingLogs(false) }
  }

  const handleDeleteLog = async (id: string, amount: number) => {
    try { await deleteWaterLog(id); setWaterLogs(p => p.filter(l => l.id !== id)); setWaterIntake(p => Math.max(0, p - amount)) }
    catch (e) { console.error('Failed to delete log', e) }
  }

  const handleStartEdit = (log: any) => { setEditingLogId(log.id); setEditAmount(log.amount_ml.toString()) }

  const handleSaveEdit = async (id: string, oldAmount: number) => {
    const newAmount = parseFloat(editAmount)
    if (isNaN(newAmount) || newAmount <= 0) return
    try {
      await updateWaterLog(id, newAmount)
      setWaterLogs(p => p.map(l => l.id === id ? { ...l, amount_ml: newAmount } : l))
      setWaterIntake(p => p - oldAmount + newAmount)
      setEditingLogId(null)
    } catch (e) { console.error('Failed to update log', e) }
  }

  const handleLogWater = async (amount: number) => {
    setShowWaterModal(false); setIsFlowing(true); setIsUpdatingWater(true)
    try {
      await Promise.all([logWater(amount), new Promise(r => setTimeout(r, 3000))])
      setWaterIntake(p => p + amount); setCustomAmount('')
    } catch (e) { console.error('Failed to log water', e) }
    finally { setIsUpdatingWater(false); setIsFlowing(false) }
  }

  const handleCustomSubmit = () => {
    if (!customAmount) return
    let amount = parseFloat(customAmount)
    if (unit === 'L') amount *= 1000
    handleLogWater(amount)
  }

  // Derived values
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name1    = (data.user.name || '').split(' ')[0] || ''

  const calPct   = Math.min(data.nutrition.calories.current / (data.nutrition.calories.goal || 1), 1)
  const protPct  = Math.min(data.nutrition.protein.current  / (data.nutrition.protein.goal  || 1), 1)
  const carbPct  = Math.min(data.nutrition.carbs.current    / (data.nutrition.carbs.goal    || 1), 1)
  const fatPct   = Math.min(data.nutrition.fat.current      / (data.nutrition.fat.goal      || 1), 1)
  const waterPct = Math.min(waterIntake                     / (data.water.goal               || 1), 1)

  const calsRemaining = Math.max(data.nutrition.calories.goal - data.nutrition.calories.current, 0)
  const nudge         = buildNudge(data, waterIntake)
  const theme         = NUDGE_THEME[nudge.color]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* ── Sticky header ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{greeting}</p>
            <h1 className="text-xl font-black text-gray-900 leading-tight">{name1 || 'Today'}</h1>
          </div>
          <div className="flex items-center gap-2">
            {data.streak.current > 0 && (
              <div className="flex items-center gap-1 bg-orange-50 px-2.5 py-1.5 rounded-xl border border-orange-100">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                <span className="text-sm font-black text-orange-700">{data.streak.current}d</span>
              </div>
            )}
            <Link href="/health/log-food">
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm shadow-orange-200 active:scale-95 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">

        {/* ── AI Nudge strip ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {nudge.link ? (
            <Link href={nudge.link}>
              <div className={`${theme.bg} ${theme.border} border rounded-2xl px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-transform`}>
                <span className="text-xl leading-none shrink-0">{nudge.emoji}</span>
                <p className={`${theme.text} text-sm font-medium flex-1 leading-snug`}>{nudge.text}</p>
                <ArrowRight className={`w-4 h-4 ${theme.text} shrink-0`} />
              </div>
            </Link>
          ) : (
            <div className={`${theme.bg} ${theme.border} border rounded-2xl px-4 py-3 flex items-center gap-3`}>
              <span className="text-xl leading-none shrink-0">{nudge.emoji}</span>
              <p className={`${theme.text} text-sm font-medium flex-1 leading-snug`}>{nudge.text}</p>
            </div>
          )}
        </motion.div>

        {/* ── Calorie ring hero ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
        >
          <Link href="/health/log-food">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-5 active:scale-[0.98] transition-transform">
              <Ring pct={calPct} color="#f97316" size={120} stroke={13}>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-gray-900 leading-none">{data.nutrition.calories.current}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">eaten</span>
                </div>
              </Ring>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Calories</span>
                </div>
                <p className="text-4xl font-black text-gray-900 leading-none tracking-tight">{calsRemaining}</p>
                <p className="text-sm text-gray-400 font-medium mt-0.5">left of {data.nutrition.calories.goal}</p>
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-orange-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${calPct * 100}%` }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* ── Macro rings (Protein / Carbs / Fat) ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: 'Protein', pct: protPct, cur: data.nutrition.protein.current, goal: data.nutrition.protein.goal, color: '#22c55e' },
            { label: 'Carbs',   pct: carbPct, cur: data.nutrition.carbs.current,   goal: data.nutrition.carbs.goal,   color: '#f59e0b' },
            { label: 'Fat',     pct: fatPct,  cur: data.nutrition.fat.current,     goal: data.nutrition.fat.goal,     color: '#ef4444' },
          ].map((m) => (
            <div key={m.label} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col items-center gap-2">
              <Ring pct={m.pct} color={m.color} size={68} stroke={7}>
                <span className="text-sm font-black text-gray-900">{m.cur}</span>
              </Ring>
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{m.label}</p>
                <p className="text-[11px] font-medium text-gray-400">/ {m.goal}g</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Hydration + Streak ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-[2fr_1fr] gap-3">

          {/* Hydration */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <div className="bg-blue-50 rounded-3xl border border-blue-100 p-4 h-full flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-0 top-0 p-8 bg-blue-100 rounded-full blur-2xl -mr-4 -mt-4 opacity-50" />
              <AnimatePresence>
                {isFlowing && (
                  <motion.div
                    initial={{ height: '0%' }} animate={{ height: '100%' }} exit={{ opacity: 0 }}
                    transition={{ duration: 3, ease: 'easeInOut' }}
                    className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-blue-400/50 to-blue-300/10 z-0"
                  />
                )}
              </AnimatePresence>
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="p-1.5 bg-white rounded-full shadow-sm">
                  <Droplets className="w-4 h-4 text-blue-500 fill-blue-500" />
                </div>
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Water</span>
              </div>
              <div className="relative z-10 mb-3">
                <div className="flex items-baseline gap-1 mb-1.5">
                  <span className="text-2xl font-bold text-blue-900">{waterIntake}</span>
                  <span className="text-[11px] text-blue-600 font-medium">/ {data.water.goal}ml</span>
                </div>
                <div className="h-1.5 bg-blue-200/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${waterPct * 100}%` }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <div className="flex gap-2 relative z-10">
                <Button
                  onClick={handleOpenWaterModal}
                  disabled={isUpdatingWater}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-xs font-bold shadow-sm shadow-blue-200"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
                <Button
                  onClick={handleOpenHistory}
                  className="w-9 bg-white text-blue-600 hover:bg-blue-50 rounded-xl h-9 shadow-sm transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Streak */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
          >
            <div className="bg-orange-50 rounded-3xl border border-orange-100 p-4 h-full flex flex-col relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-orange-200 rounded-full blur-2xl opacity-40" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="p-2 bg-white rounded-full shadow-sm w-fit mb-2">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-orange-900">{data.streak.current}</span>
                  <span className="text-sm font-bold text-orange-600">days</span>
                </div>
                {data.streak.longest > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Trophy className="w-3 h-3 text-yellow-600" />
                    <span className="text-[10px] font-bold text-orange-600">Best: {data.streak.longest}</span>
                  </div>
                )}
                <StreakDots count={data.streak.current} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Weight Progress ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <Link href="/health/progress">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] relative overflow-hidden group">
              <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
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

                <div className="mb-5">
                  <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                    <span>Start: {startWeight}kg</span>
                    <span>Goal: {goalWeight}kg</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-linear-to-r from-green-400 to-green-600 rounded-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">BMI</p>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{bmi || '--'}</span>
                      {bmi && <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${bmiColor}`}>{bmiCategory}</span>}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Remaining</p>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-900">{Math.abs(currentWeight - goalWeight).toFixed(1)}</span>
                      <span className="text-xs text-gray-500">kg</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

      </main>

      {/* ── Water Modal ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showWaterModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60"
              onClick={() => setShowWaterModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-4 right-4 bottom-24 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-sm bg-white rounded-3xl p-6 z-70 shadow-xl"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add Water</h2>

              <div className="bg-blue-50 rounded-2xl p-4 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Daily Goal</p>
                  {isEditingGoal ? (
                    <div className="flex items-center gap-2">
                      <Input type="number" value={newGoal} onChange={e => setNewGoal(e.target.value)} className="h-8 w-24 bg-white border-blue-200 text-blue-900 font-bold" autoFocus />
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
                    <button onClick={handleUpdateGoal} disabled={isUpdatingGoal} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setIsEditingGoal(false); setNewGoal(data.water.goal.toString()) }} className="p-2 bg-white text-blue-400 rounded-lg hover:bg-blue-100">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setIsEditingGoal(true)} className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-100 shadow-sm">
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[250, 500, 750, 1000].map(amount => (
                  <Button key={amount} variant="outline" className="h-12 text-lg font-medium hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" onClick={() => handleLogWater(amount)} disabled={isUpdatingWater}>
                    {amount}ml
                  </Button>
                ))}
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custom Amount</p>
                <div className="flex gap-2">
                  <Input type="number" placeholder="0" value={customAmount} onChange={e => setCustomAmount(e.target.value)} className="text-lg h-12 flex-1" />
                  <div className="flex bg-gray-100 p-1 rounded-xl h-12 items-center">
                    <button onClick={() => setUnit('ml')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${unit === 'ml' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>ml</button>
                    <button onClick={() => setUnit('L')}  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${unit === 'L'  ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>L</button>
                  </div>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-bold shadow-lg shadow-blue-200" onClick={handleCustomSubmit} disabled={isUpdatingWater || !customAmount}>
                  Add Water
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── History Modal ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHistoryModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60"
              onClick={() => setShowHistoryModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-4 right-4 bottom-24 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-sm bg-white rounded-3xl p-6 z-70 shadow-xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Water History</h2>
                <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {isLoadingLogs ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : waterLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No water logs for today.</div>
              ) : (
                <div className="space-y-3">
                  {waterLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                          <Droplets className="w-4 h-4" />
                        </div>
                        <div>
                          {editingLogId === log.id ? (
                            <div className="flex items-center gap-2">
                              <Input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="h-8 w-20" autoFocus />
                              <span className="text-sm font-medium text-gray-600">ml</span>
                            </div>
                          ) : (
                            <p className="font-bold text-gray-900">{log.amount_ml} ml</p>
                          )}
                          <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {editingLogId === log.id ? (
                          <>
                            <button onClick={() => handleSaveEdit(log.id, log.amount_ml)} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200">
                              <ArrowRight className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingLogId(null)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleStartEdit(log)} className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteLog(log.id, log.amount_ml)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
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
