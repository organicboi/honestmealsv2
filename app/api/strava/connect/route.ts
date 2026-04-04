import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  // Ensure user is authenticated before starting OAuth
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_SITE_URL!))
  }

  const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
  const redirectUri = `${siteUrl}/api/strava/callback`

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
  })

  return NextResponse.redirect(
    `https://www.strava.com/oauth/authorize?${params.toString()}`
  )
}
