import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getValidAccessToken, fetchStravaActivities } from '@/lib/strava-server'
import type { StravaIntegration } from '@/lib/strava'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get integration
  const { data: integration, error: intErr } = await supabase
    .from('strava_integrations')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (intErr || !integration) {
    return NextResponse.json({ error: 'Not connected' }, { status: 404 })
  }

  try {
    const { accessToken, refreshed } = await getValidAccessToken(integration as StravaIntegration)

    // If token was refreshed, persist the new tokens to DB
    if (refreshed) {
      await supabase
        .from('strava_integrations')
        .update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          expires_at: refreshed.expires_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id)
    }

    const rawActivities = await fetchStravaActivities(accessToken)

    // Upsert activities into strava_activities
    if (rawActivities.length > 0) {
      const rows = rawActivities.map((a: Record<string, unknown>) => ({
        user_id: user.id,
        strava_id: a.id,
        name: a.name,
        sport_type: a.sport_type,
        start_date: a.start_date,
        distance: a.distance,
        moving_time: a.moving_time,
        elapsed_time: a.elapsed_time,
        total_elevation_gain: a.total_elevation_gain,
        average_speed: a.average_speed,
        max_speed: a.max_speed,
        average_heartrate: a.average_heartrate,
        max_heartrate: a.max_heartrate,
        calories: (a.kilojoules as number | null) ? Number(a.kilojoules) * 0.239006 : null,
        kudos_count: a.kudos_count,
        achievement_count: a.achievement_count,
        map_polyline: (a.map as Record<string, unknown>)?.summary_polyline ?? null,
        raw_json: a,
      }))

      await supabase
        .from('strava_activities')
        .upsert(rows, { onConflict: 'strava_id' })
    }

    // Return the latest 20 from DB (freshly upserted)
    const { data: activities } = await supabase
      .from('strava_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(20)

    return NextResponse.json({ activities: activities ?? [] })
  } catch (err) {
    console.error('Strava activities sync error:', err)
    return NextResponse.json({ error: 'Failed to sync activities' }, { status: 500 })
  }
}
