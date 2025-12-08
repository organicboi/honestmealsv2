import { getHealthDashboardData } from '@/app/actions/health'
import HealthDashboardClient from './HealthDashboardClient'
import { redirect } from 'next/navigation'

export default async function HealthPage() {
  try {
    const data = await getHealthDashboardData()
    return <HealthDashboardClient data={data} />
  } catch (error) {
    // If user is not authenticated or other error, redirect to sign-in
    // In a real app, you might want to handle specific errors differently
    redirect('/sign-in')
  }
}
