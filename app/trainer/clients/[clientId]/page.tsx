import { getClientFullProfile, getClientNutritionHistory, getClientWorkoutHistory, getClientProgressData, getClientOrders, getTrainerNotes, getAssignedPlans, getClientGoals } from '@/app/actions/trainer';
import { notFound } from 'next/navigation';
import ClientDetailClient from './ClientDetailClient';

export default async function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = await params;

    const [profileRes, nutritionRes, workoutRes, progressRes, ordersRes, notesRes, plansRes, goalsRes] = await Promise.all([
        getClientFullProfile(clientId),
        getClientNutritionHistory(clientId, 30),
        getClientWorkoutHistory(clientId, 20),
        getClientProgressData(clientId),
        getClientOrders(clientId, 20),
        getTrainerNotes(clientId),
        getAssignedPlans(clientId),
        getClientGoals(clientId),
    ]);

    if (profileRes?.error || !profileRes?.profile) notFound();

    return (
        <ClientDetailClient
            clientId={clientId}
            profile={profileRes.profile}
            nutrition={nutritionRes}
            workouts={workoutRes}
            progress={progressRes}
            orders={ordersRes}
            notes={notesRes}
            plans={plansRes}
            goals={goalsRes}
        />
    );
}
