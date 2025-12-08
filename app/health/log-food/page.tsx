import LogFoodClient from './LogFoodClient'
import { Suspense } from 'react'
import { getTodayFoodLogs } from '@/app/actions/food-logging'

export default async function LogFoodPage() {
  const initialLogs = await getTodayFoodLogs()

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LogFoodClient initialLogs={initialLogs} />
    </Suspense>
  )
}
