'use server'

import { createClient } from '@/utils/supabase/server'
import { StravaActivity, StravaIntegration } from '@/lib/strava'

export type StravaPageData =
  | { connected: false }
  | {
      connected: true
      athlete: Record<string, unknown>
      activities: StravaActivity[]
      integration: {
        scope: string | null
        expires_at: number
        athlete_id: number
      }
    }

export async function getStravaData(): Promise<StravaPageData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { connected: false }
  }

  const { data: integration } = await supabase
    .from('strava_integrations')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!integration) {
    return { connected: false }
  }

  // Fetch cached activities from DB (don't call Strava directly here — the page will
  // trigger a client-side sync via /api/strava/activities on first load)
  const { data: activities } = await supabase
    .from('strava_activities')
    .select('*')
    .eq('user_id', user.id)
    .order('start_date', { ascending: false })
    .limit(20)

  return {
    connected: true,
    athlete: (integration.athlete_json as Record<string, unknown>) ?? {},
    activities: (activities ?? []) as StravaActivity[],
    integration: {
      scope: integration.scope,
      expires_at: integration.expires_at,
      athlete_id: integration.athlete_id,
    },
  }
}
