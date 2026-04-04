import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${siteUrl}/sign-in`)
  }

  // Fetch integration to get the most recent access token for deauthorization
  const { data: integration } = await supabase
    .from('strava_integrations')
    .select('access_token')
    .eq('user_id', user.id)
    .single()

  if (integration?.access_token) {
    // Deauthorize with Strava (best-effort, don't fail if this errors)
    try {
      await fetch('https://www.strava.com/oauth/deauthorize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${integration.access_token}` },
      })
    } catch {
      console.warn('Strava deauthorize call failed (continuing with local delete)')
    }
  }

  // Delete from DB — cascade will remove strava_activities rows too
  await supabase.from('strava_integrations').delete().eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
