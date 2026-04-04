import { getStravaData } from '@/app/actions/strava'
import { redirect } from 'next/navigation'
import StravaClient from './StravaClient'

export default async function StravaPage() {
  try {
    const data = await getStravaData()
    return <StravaClient data={data} />
  } catch {
    redirect('/sign-in')
  }
}
