import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { exchangeStravaCode } from '@/lib/strava-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  const error = searchParams.get('error')
  if (error) {
    // User denied access
    return NextResponse.redirect(`${siteUrl}/strava?error=access_denied`)
  }

  const code = searchParams.get('code')
  const scope = searchParams.get('scope') ?? ''

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/strava?error=no_code`)
  }

  // Get the currently logged-in user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${siteUrl}/sign-in`)
  }

  try {
    // Exchange the short-lived code for tokens
    const tokenData = await exchangeStravaCode(code)

    const athlete = tokenData.athlete as Record<string, unknown> | undefined

    // Upsert integration row (one per user)
    const { error: dbError } = await supabase
      .from('strava_integrations')
      .upsert(
        {
          user_id: user.id,
          athlete_id: athlete?.id ?? 0,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_at,
          scope,
          athlete_json: athlete ?? {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (dbError) {
      console.error('Strava DB upsert error:', dbError)
      return NextResponse.redirect(`${siteUrl}/strava?error=db_error`)
    }

    return NextResponse.redirect(`${siteUrl}/strava?connected=true`)
  } catch (err) {
    console.error('Strava callback error:', err)
    return NextResponse.redirect(`${siteUrl}/strava?error=exchange_failed`)
  }
}
