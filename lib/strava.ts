// Client-safe Strava types and display utilities.
// This file MUST NOT import from @/utils/supabase/server or next/headers.
// Server-only functions (token exchange, fetch) are in lib/strava-server.ts

export interface StravaIntegration {
  id: string
  user_id: string
  athlete_id: number
  access_token: string
  refresh_token: string
  expires_at: number
  scope: string | null
  athlete_json: Record<string, unknown> | null
}

export interface StravaActivity {
  id: string
  user_id: string
  strava_id: number
  name: string | null
  sport_type: string | null
  start_date: string | null
  distance: number | null
  moving_time: number | null
  elapsed_time: number | null
  total_elevation_gain: number | null
  average_speed: number | null
  max_speed: number | null
  average_heartrate: number | null
  max_heartrate: number | null
  calories: number | null
  kudos_count: number | null
  achievement_count: number | null
  map_polyline: string | null
}

export interface StravaTokenResponse {
  token_type: string
  access_token: string
  refresh_token: string
  expires_at: number
  expires_in: number
  athlete?: Record<string, unknown>
}

/** Format seconds as "1h 23m" or "45m 30s" */
export function formatDuration(seconds: number): string {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

/** Converts metres to km, rounded to 2dp */
export function metresToKm(metres: number): string {
  return (metres / 1000).toFixed(2)
}

/** Sport type → emoji mapping */
export function sportEmoji(sportType: string | null): string {
  const map: Record<string, string> = {
    Run: '🏃',
    VirtualRun: '🏃',
    TrailRun: '🏔️',
    Walk: '🚶',
    Hike: '🥾',
    Ride: '🚴',
    VirtualRide: '🚴',
    MountainBikeRide: '🚵',
    Swim: '🏊',
    WeightTraining: '🏋️',
    Yoga: '🧘',
    Workout: '💪',
    Crossfit: '💪',
    Rowing: '🚣',
    Soccer: '⚽',
    Tennis: '🎾',
    Golf: '⛳',
    Ski: '⛷️',
    Snowboard: '🏂',
  }
  return sportType ? (map[sportType] ?? '🏅') : '🏅'
}
