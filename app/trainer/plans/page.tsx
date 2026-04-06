import { getAllAssignedPlans } from '@/app/actions/trainer';
import PlansClient from './PlansClient';

export default async function PlansPage() {
    const data = await getAllAssignedPlans();
    return <PlansClient data={data} />;
}
