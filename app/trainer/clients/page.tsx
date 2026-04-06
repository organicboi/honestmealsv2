import { getTrainerClients } from '@/app/actions/trainer';
import ClientsClient from './ClientsClient';

export default async function TrainerClientsPage() {
    const data = await getTrainerClients();
    return <ClientsClient data={data} />;
}
