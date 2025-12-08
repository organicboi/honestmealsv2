import { getWeightHistory, getProgressPhotos, getGoalWeight } from '@/app/actions/progress'
import ProgressClient from './ProgressClient'
import { redirect } from 'next/navigation'

export default async function ProgressPage() {
  try {
    const [weightHistory, photos, goalWeight] = await Promise.all([
      getWeightHistory(),
      getProgressPhotos(),
      getGoalWeight()
    ])

    return <ProgressClient weightHistory={weightHistory} photos={photos} goalWeight={goalWeight} />
  } catch (error) {
    redirect('/sign-in')
  }
}
