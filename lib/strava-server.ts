// Server-only Strava utilities. Must NOT be imported by Client Components.
// This file uses process.env server secrets.
import type { StravaTokenResponse, StravaIntegration } from './strava'

export type { StravaTokenResponse, StravaIntegration }

/**
 * Returns a valid (non-expired) access token.
 * If expired/near-expiry, refreshes and returns { accessToken, refreshed }.
 * The CALLER (API route) is responsible for persisting refreshed tokens to DB.
 */
export async function getValidAccessToken(
  integration: StravaIntegration
): Promise<{ accessToken: string; refreshed: StravaTokenResponse | null }> {
  const nowSecs = Math.floor(Date.now() / 1000)
  const bufferSecs = 300

  if (integration.expires_at > nowSecs + bufferSecs) {
    return { accessToken: integration.access_token, refreshed: null }
  }

  const refreshed = await refreshStravaToken(integration.refresh_token)
  return { accessToken: refreshed.access_token, refreshed }
}

/**
 * Refreshes an access token using the refresh token.
 */
export async function refreshStravaToken(refreshToken: string): Promise<StravaTokenResponse> {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    throw new Error(`Strava token refresh failed: ${res.status} ${await res.text()}`)
  }

  return res.json()
}

/**
 * Exchanges an authorization code for tokens + athlete info.
 */
export async function exchangeStravaCode(code: string): Promise<StravaTokenResponse> {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    throw new Error(`Strava code exchange failed: ${res.status} ${await res.text()}`)
  }

  return res.json()
}

/**
 * Fetches the last 20 activities from Strava for a given access token.
 */
export async function fetchStravaActivities(
  accessToken: string
): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=20&page=1',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    throw new Error(`Strava activities fetch failed: ${res.status} ${await res.text()}`)
  }

  return res.json()
}
