import { getTrainerDashboard } from '@/app/actions/trainer';
import TrainerDashboardClient from './TrainerDashboardClient';

export default async function TrainerDashboardPage() {
    const data = await getTrainerDashboard();
    return <TrainerDashboardClient data={data} />;
}
