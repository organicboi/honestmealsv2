import { getTrainerCommissions } from '@/app/actions/trainer';
import CommissionsClient from './CommissionsClient';

export default async function CommissionsPage() {
    const data = await getTrainerCommissions();
    return <CommissionsClient data={data} />;
}
