'use client'

import type { Variants } from 'framer-motion'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Activity, TrendingUp, Clock, Mountain, Flame, Heart, Trophy, LogOut, RefreshCw, ChevronRight, Bike, PersonStanding } from 'lucide-react'
import { StravaPageData } from '@/app/actions/strava'
import { StravaActivity, formatDuration, metresToKm, sportEmoji } from '@/lib/strava'
import { toast } from 'sonner'

interface Props {
  data: StravaPageData
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

// ─── Not Connected View ───────────────────────────────────────────────────────

function NotConnectedView() {
  const [loading, setLoading] = useState(false)

  const handleConnect = () => {
    setLoading(true)
    window.location.href = '/api/strava/connect'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen bg-gray-50 pb-24"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">Strava</h1>
      </div>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Hero card */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-8 text-white shadow-xl shadow-orange-200/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 rounded-2xl p-3">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-orange-100 text-sm font-medium">Integration</p>
              <h2 className="text-2xl font-bold">Strava</h2>
            </div>
          </div>
          <p className="text-orange-100 leading-relaxed text-sm">
            Connect your Strava account to pull in your runs, rides, and workouts — all in one place alongside your nutrition data.
          </p>
        </div>

        {/* Feature bullets */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h3 className="font-bold text-gray-900">What you'll get</h3>
          {[
            { icon: Activity, text: 'Recent activities synced automatically', color: 'text-orange-500 bg-orange-50' },
            { icon: TrendingUp, text: 'Distance, pace, elevation gain & calories', color: 'text-red-500 bg-red-50' },
            { icon: Heart, text: 'Heart rate & performance data', color: 'text-pink-500 bg-pink-50' },
            { icon: Trophy, text: 'Kudos & achievement tracking', color: 'text-yellow-500 bg-yellow-50' },
          ].map(({ icon: Icon, text, color }) => (
            <div key={text} className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-gray-700 text-sm">{text}</p>
            </div>
          ))}
        </div>

        {/* Connect button */}
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full h-14 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Connect with Strava
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          You'll be redirected to Strava to approve access.
        </p>
      </main>
    </motion.div>
  )
}

// ─── Activity Card ────────────────────────────────────────────────────────────

function ActivityCard({ activity }: { activity: StravaActivity }) {
  const [expanded, setExpanded] = useState(false)

  const date = activity.start_date
    ? new Date(activity.start_date).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    : ''

  return (
    <motion.div variants={itemVariants}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md transition-shadow duration-200"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-2xl shrink-0">{sportEmoji(activity.sport_type)}</div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate text-sm">{activity.name ?? 'Activity'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{date} · {activity.sport_type}</p>
            </div>
          </div>
          <ChevronRight
            className={`w-4 h-4 text-gray-400 shrink-0 mt-0.5 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          />
        </div>

        {/* Primary stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {activity.distance ? (
            <div className="bg-orange-50 rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-orange-600">{metresToKm(activity.distance)}</p>
              <p className="text-[10px] text-orange-400 font-medium uppercase tracking-wider">km</p>
            </div>
          ) : null}
          {activity.moving_time ? (
            <div className="bg-blue-50 rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-blue-600">{formatDuration(activity.moving_time)}</p>
              <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">time</p>
            </div>
          ) : null}
          {activity.total_elevation_gain != null ? (
            <div className="bg-green-50 rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-green-600">{Math.round(activity.total_elevation_gain)}m</p>
              <p className="text-[10px] text-green-400 font-medium uppercase tracking-wider">elev</p>
            </div>
          ) : null}
        </div>

        {/* Expanded stats */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                {[
                  { label: 'Avg Speed', value: activity.average_speed ? `${(activity.average_speed * 3.6).toFixed(1)} km/h` : null, icon: '⚡' },
                  { label: 'Max Speed', value: activity.max_speed ? `${(activity.max_speed * 3.6).toFixed(1)} km/h` : null, icon: '🚀' },
                  { label: 'Avg HR', value: activity.average_heartrate ? `${Math.round(activity.average_heartrate)} bpm` : null, icon: '❤️' },
                  { label: 'Max HR', value: activity.max_heartrate ? `${Math.round(activity.max_heartrate)} bpm` : null, icon: '💓' },
                  { label: 'Calories', value: activity.calories ? `${Math.round(activity.calories)} kcal` : null, icon: '🔥' },
                  { label: 'Kudos', value: activity.kudos_count != null ? `${activity.kudos_count}` : null, icon: '👏' },
                ]
                  .filter((s) => s.value !== null)
                  .map(({ label, value, icon }) => (
                    <div key={label} className="flex items-center gap-2 py-1">
                      <span className="text-sm">{icon}</span>
                      <div>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-semibold text-gray-800">{value}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  )
}

// ─── Connected View ───────────────────────────────────────────────────────────

function ConnectedView({
  athlete,
  initialActivities,
}: {
  athlete: Record<string, unknown>
  initialActivities: StravaActivity[]
}) {
  const [activities, setActivities] = useState<StravaActivity[]>(initialActivities)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const syncActivities = useCallback(async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/strava/activities')
      if (!res.ok) throw new Error('Sync failed')
      const json = await res.json()
      setActivities(json.activities ?? [])
      toast.success('Activities synced!')
    } catch {
      toast.error('Failed to sync activities. Please try again.')
    } finally {
      setSyncing(false)
    }
  }, [])

  // Auto-sync on first load if no cached activities
  useEffect(() => {
    if (initialActivities.length === 0) {
      syncActivities()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Strava? Your synced activities will be removed.')) return
    setDisconnecting(true)
    try {
      const res = await fetch('/api/strava/disconnect', { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      window.location.reload()
    } catch {
      toast.error('Failed to disconnect. Try again.')
      setDisconnecting(false)
    }
  }

  // Compute weekly stats
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const weeklyActivities = activities.filter(
    (a) => a.start_date && new Date(a.start_date).getTime() > weekAgo
  )
  const weeklyKm = weeklyActivities.reduce((s, a) => s + (a.distance ?? 0), 0) / 1000
  const weeklyTime = weeklyActivities.reduce((s, a) => s + (a.moving_time ?? 0), 0)

  const firstName = (athlete.firstname as string) ?? ''
  const lastName = (athlete.lastname as string) ?? ''
  const profilePic = (athlete.profile_medium as string) ?? (athlete.profile as string) ?? null
  const city = (athlete.city as string) ?? ''
  const country = (athlete.country as string) ?? ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen bg-gray-50 pb-24"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Strava</h1>
        <button
          onClick={syncActivities}
          disabled={syncing}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Sync activities"
        >
          <RefreshCw className={`w-5 h-5 text-gray-500 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Athlete Hero */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-200/60">
          <div className="flex items-center gap-4 mb-5">
            {profilePic ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profilePic}
                alt={`${firstName}'s profile`}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <PersonStanding className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <p className="text-orange-100 text-xs font-medium uppercase tracking-wider">Connected Athlete</p>
              <h2 className="text-2xl font-bold">{firstName} {lastName}</h2>
              {(city || country) && (
                <p className="text-orange-200 text-sm mt-0.5">{[city, country].filter(Boolean).join(', ')}</p>
              )}
            </div>
          </div>

          {/* Weekly stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold">{weeklyActivities.length}</p>
              <p className="text-orange-200 text-[10px] uppercase tracking-wider font-medium">This week</p>
            </div>
            <div className="bg-white/15 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold">{weeklyKm.toFixed(1)}</p>
              <p className="text-orange-200 text-[10px] uppercase tracking-wider font-medium">km / week</p>
            </div>
            <div className="bg-white/15 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold">{formatDuration(weeklyTime)}</p>
              <p className="text-orange-200 text-[10px] uppercase tracking-wider font-medium">active time</p>
            </div>
          </div>
        </div>

        {/* Activities section */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-gray-900">Recent Activities</h3>
          <span className="text-xs text-gray-400">{activities.length} activities</span>
        </div>

        {syncing && activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
            <p className="text-gray-500 text-sm">Syncing your Strava activities…</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
            <span className="text-4xl">🏅</span>
            <p className="font-bold text-gray-900 mt-3">No activities yet</p>
            <p className="text-gray-500 text-sm mt-1">Go record a workout on Strava, then sync here.</p>
            <button
              onClick={syncActivities}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              Sync Now
            </button>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {activities.map((activity) => (
              <ActivityCard key={activity.strava_id} activity={activity} />
            ))}
          </motion.div>
        )}

        {/* Disconnect */}
        <div className="pt-4">
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="w-full h-12 bg-white border border-red-200 text-red-500 font-semibold rounded-2xl hover:bg-red-50 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {disconnecting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Disconnect Strava
              </>
            )}
          </button>
        </div>
      </main>
    </motion.div>
  )
}

// ─── Root Export ──────────────────────────────────────────────────────────────

export default function StravaClient({ data }: Props) {
  if (!data.connected) {
    return <NotConnectedView />
  }

  return (
    <ConnectedView
      athlete={data.athlete}
      initialActivities={data.activities}
    />
  )
}
