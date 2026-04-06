'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireTrainer() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { supabase: null, user: null, error: 'Not authenticated' as const };
    const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();
    if (profile?.user_type !== 'trainer') return { supabase: null, user: null, error: 'Unauthorized' as const };
    return { supabase, user, error: null };
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export async function getTrainerDashboard() {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error };

    const [clientsRes, commissionsRes, activityRes] = await Promise.all([
        supabase
            .from('trainer_clients')
            .select('id, status, client_id, joined_at, profiles!client_id(name, email)')
            .eq('trainer_id', user.id),
        supabase
            .from('trainer_commissions')
            .select('commission_amount, status, created_at')
            .eq('trainer_id', user.id),
        // clients who logged food or workout in the last 24h
        supabase
            .from('trainer_clients')
            .select(`
                client_id,
                profiles!client_id(name),
                food_logs!inner(created_at)
            `)
            .eq('trainer_id', user.id)
            .eq('status', 'active')
            .gte('food_logs.created_at', new Date(Date.now() - 86400000).toISOString())
            .limit(20),
    ]);

    const clients = clientsRes.data ?? [];
    const commissions = commissionsRes.data ?? [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const totalClients  = clients.filter(c => c.status === 'active').length;
    const pendingInvites = clients.filter(c => c.status === 'pending').length;
    const mtdEarned     = commissions
        .filter(c => c.status !== 'cancelled' && c.created_at >= startOfMonth)
        .reduce((s, c) => s + (c.commission_amount ?? 0), 0);
    const pendingPayout = commissions
        .filter(c => c.status === 'pending')
        .reduce((s, c) => s + (c.commission_amount ?? 0), 0);
    const totalEarned   = commissions
        .filter(c => c.status !== 'cancelled')
        .reduce((s, c) => s + (c.commission_amount ?? 0), 0);

    const recentCommissions = await supabase
        .from('trainer_commissions')
        .select(`
            id, commission_amount, commission_rate, order_amount,
            status, created_at,
            orders!order_id(order_date),
            profiles!client_id(name)
        `)
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

    const normalizeRow = (row: Record<string, unknown>) => ({
        ...row,
        orders:   Array.isArray(row.orders)   ? (row.orders[0]   ?? null) : (row.orders   ?? null),
        profiles: Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : (row.profiles ?? null),
    });

    return {
        stats: { totalClients, pendingInvites, mtdEarned, pendingPayout, totalEarned },
        recentCommissions: ((recentCommissions.data ?? []) as Record<string, unknown>[]).map(normalizeRow) as unknown as Array<{
            id: string; commission_amount: number; commission_rate: number;
            order_amount: number; status: string; created_at: string;
            profiles?: { name: string } | null;
        }>,
        activeClientsFeedToday: activityRes.data ?? [],
    };
}

// ─── Client list ──────────────────────────────────────────────────────────────

export async function getTrainerClients() {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error, clients: [] };

    const { data, error: dbErr } = await supabase
        .from('trainer_clients')
        .select(`
            id, status, commission_rate, joined_at, invite_code,
            profiles!client_id(
                id, name, email, goal_type, weight, height,
                daily_calorie_goal, daily_protein_goal, user_type
            )
        `)
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false });

    if (dbErr) return { error: dbErr.message, clients: [] };
    const clients = (data ?? []).map(row => ({
        ...row,
        profiles: Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : (row.profiles ?? null),
    }));
    return { clients };
}

// ─── Full client profile (trainer view) ───────────────────────────────────────

export async function getClientFullProfile(clientId: string) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error };

    // Verify active relationship
    const { data: rel } = await supabase
        .from('trainer_clients')
        .select('id')
        .eq('trainer_id', user.id)
        .eq('client_id', clientId)
        .eq('status', 'active')
        .single();
    if (!rel) return { error: 'No active relationship with this client' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', clientId)
        .single();

    return { profile };
}

// ─── Client nutrition history ─────────────────────────────────────────────────

export async function getClientNutritionHistory(clientId: string, days = 30) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error };

    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [daily, foodLogs] = await Promise.all([
        supabase
            .from('daily_nutrition_log')
            .select('log_date, total_calories, total_protein, total_carbs, total_fat, goals_met')
            .eq('customer_id', clientId)
            .gte('log_date', since.split('T')[0])
            .order('log_date', { ascending: true }),
        supabase
            .from('food_logs')
            .select('consumed_at, meal_type, calories_consumed, protein_consumed, carbs_consumed, fat_consumed, custom_food_name')
            .eq('user_id', clientId)
            .gte('consumed_at', since)
            .order('consumed_at', { ascending: false })
            .limit(50),
    ]);

    return {
        daily: daily.data ?? [],
        recentLogs: foodLogs.data ?? [],
    };
}

// ─── Client workout history ───────────────────────────────────────────────────

export async function getClientWorkoutHistory(clientId: string, limit = 20) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error };

    const { data: workouts } = await supabase
        .from('workout_logs')
        .select(`
            id, log_date, duration_minutes, intensity_level, calories_burned, notes,
            workout_categories!category_id(name),
            workout_exercises(
                exercise_name, order_index,
                workout_sets(set_number, weight_kg, reps, rpe)
            )
        `)
        .eq('user_id', clientId)
        .order('log_date', { ascending: false })
        .limit(limit);

    return { workouts: workouts ?? [] };
}

// ─── Client progress data ─────────────────────────────────────────────────────

export async function getClientProgressData(clientId: string) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error };

    const [weightLogs, measurements, photos] = await Promise.all([
        supabase
            .from('weight_logs')
            .select('weight, log_date')
            .eq('user_id', clientId)
            .order('log_date', { ascending: true })
            .limit(90),
        supabase
            .from('body_measurements')
            .select('*')
            .eq('user_id', clientId)
            .order('measured_at', { ascending: false })
            .limit(10),
        supabase
            .from('progress_photos')
            .select('id, image_url, photo_type, taken_at, weight, body_fat_percentage, notes')
            .eq('user_id', clientId)
            .order('taken_at', { ascending: false })
            .limit(20),
    ]);

    return {
        weightLogs:   weightLogs.data ?? [],
        measurements: measurements.data ?? [],
        photos:       photos.data ?? [],
    };
}

// ─── Client orders ────────────────────────────────────────────────────────────

export async function getClientOrders(clientId: string, limit = 20) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error };

    const { data } = await supabase
        .from('orders')
        .select(`
            id, order_date, total_amount, status, payment_status,
            trainer_commission_amount, trainer_commission_rate,
            order_items(quantity, unit_price, total_price, meals!meal_id(name))
        `)
        .eq('customer_id', clientId)
        .order('order_date', { ascending: false })
        .limit(limit);

    return { orders: data ?? [] };
}

// ─── Commission ledger ────────────────────────────────────────────────────────

export async function getTrainerCommissions(filters?: { status?: string; clientId?: string }) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error, commissions: [] };

    let query = supabase
        .from('trainer_commissions')
        .select(`
            id, order_amount, commission_rate, commission_amount,
            status, paid_at, created_at,
            orders!order_id(order_date),
            profiles!client_id(id, name, email)
        `)
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.clientId) query = query.eq('client_id', filters.clientId);

    const { data, error: dbErr } = await query;
    if (dbErr) return { error: dbErr.message, commissions: [] };
    const commissions = (data ?? []).map(row => ({
        ...row,
        orders:   Array.isArray(row.orders)   ? (row.orders[0]   ?? null) : (row.orders   ?? null),
        profiles: Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : (row.profiles ?? null),
    }));
    return { commissions };
}

export async function updateCommissionStatus(commissionId: string, status: 'pending' | 'processing' | 'paid' | 'cancelled') {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error };

    const { error: dbErr } = await supabase
        .from('trainer_commissions')
        .update({ status, paid_at: status === 'paid' ? new Date().toISOString() : null })
        .eq('id', commissionId)
        .eq('trainer_id', user.id);

    if (dbErr) return { error: dbErr.message };
    revalidatePath('/trainer/commissions');
    return { success: true };
}

// ─── Trainer notes ────────────────────────────────────────────────────────────

export async function getTrainerNotes(clientId: string) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error, notes: [] };

    const { data } = await supabase
        .from('trainer_notes')
        .select('id, note, note_type, created_at, updated_at')
        .eq('trainer_id', user.id)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    return { notes: data ?? [] };
}

export async function addTrainerNote(clientId: string, note: string, noteType: string = 'general') {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error };

    const { data, error: dbErr } = await supabase
        .from('trainer_notes')
        .insert({ trainer_id: user.id, client_id: clientId, note, note_type: noteType })
        .select()
        .single();

    if (dbErr) return { error: dbErr.message };
    revalidatePath(`/trainer/clients/${clientId}`);
    return { note: data };
}

export async function updateTrainerNote(noteId: string, note: string) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error };

    const { error: dbErr } = await supabase
        .from('trainer_notes')
        .update({ note })
        .eq('id', noteId)
        .eq('trainer_id', user.id);

    if (dbErr) return { error: dbErr.message };
    return { success: true };
}

export async function deleteTrainerNote(noteId: string) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error };

    const { error: dbErr } = await supabase
        .from('trainer_notes')
        .delete()
        .eq('id', noteId)
        .eq('trainer_id', user.id);

    if (dbErr) return { error: dbErr.message };
    return { success: true };
}

// ─── Assigned plans ───────────────────────────────────────────────────────────

export async function getAssignedPlans(clientId: string) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error, plans: [] };

    const { data } = await supabase
        .from('trainer_assigned_plans')
        .select('id, plan_type, title, description, is_active, starts_at, ends_at, created_at')
        .eq('trainer_id', user.id)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    return { plans: data ?? [] };
}

/** All plans across all clients, with client profile joined — used by /trainer/plans */
export async function getAllAssignedPlans() {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error, plans: [], clients: [] };

    const [plansRes, clientsRes] = await Promise.all([
        supabase
            .from('trainer_assigned_plans')
            .select('id, client_id, plan_type, title, description, is_active, starts_at, ends_at, created_at, profiles!client_id(name, email)')
            .eq('trainer_id', user.id)
            .order('created_at', { ascending: false }),
        supabase
            .from('trainer_clients')
            .select('client_id, profiles!client_id(id, name)')
            .eq('trainer_id', user.id)
            .eq('status', 'active'),
    ]);

    const clients = (clientsRes.data ?? []).map((r: any) => ({
        id: r.profiles?.id ?? r.client_id,
        name: r.profiles?.name ?? 'Unknown',
    }));

    const plans = (plansRes.data ?? []).map((p: any) => ({
        ...p,
        start_date: p.starts_at,
        end_date: p.ends_at,
        profiles: p.profiles as { name: string; email: string } | null,
    }));

    return { plans, clients };
}

/** Assign a plan — accepts a flat object including client_id */
export async function assignPlan(plan: {
    client_id: string;
    plan_type: 'meal' | 'workout' | 'combined';
    title: string;
    description?: string;
    plan_data: Record<string, unknown>;
    start_date?: string;
    end_date?: string;
}) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error };

    const { client_id, start_date, end_date, ...rest } = plan;
    const { data, error: dbErr } = await supabase
        .from('trainer_assigned_plans')
        .insert({ trainer_id: user.id, client_id, starts_at: start_date, ends_at: end_date, ...rest })
        .select()
        .single();

    if (dbErr) return { error: dbErr.message };
    revalidatePath(`/trainer/clients/${client_id}`);
    revalidatePath('/trainer/plans');
    return { plan: data };
}

// ─── Client goals ─────────────────────────────────────────────────────────────

export async function getClientGoals(clientId: string) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error, goals: [] };

    const { data } = await supabase
        .from('trainer_client_goals')
        .select('*')
        .eq('trainer_id', user.id)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    return { goals: data ?? [] };
}

export async function setClientGoal(clientId: string, goal: {
    title: string;
    goal_type: string;
    target_value?: number;
    current_value?: number;
    target_unit?: string;
    deadline?: string;
    notes?: string;
}) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error };

    const { data, error: dbErr } = await supabase
        .from('trainer_client_goals')
        .insert({ trainer_id: user.id, client_id: clientId, ...goal })
        .select()
        .single();

    if (dbErr) return { error: dbErr.message };
    revalidatePath(`/trainer/clients/${clientId}`);
    return { goal: data };
}

export async function updateClientGoal(goalId: string, updates: {
    current_value?: number;
    status?: 'active' | 'completed' | 'cancelled';
    notes?: string;
}) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error };

    const { error: dbErr } = await supabase
        .from('trainer_client_goals')
        .update(updates)
        .eq('id', goalId)
        .eq('trainer_id', user.id);

    if (dbErr) return { error: dbErr.message };
    return { success: true };
}

// ─── Client relationship management ──────────────────────────────────────────

/** Trainer invites a client by email — creates a pending row */
export async function inviteClientByEmail(clientEmail: string) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error };

    // Look up the client profile
    const { data: clientProfile } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('email', clientEmail.toLowerCase().trim())
        .single();

    if (!clientProfile) return { error: 'No user found with that email' };
    if (clientProfile.id === user.id) return { error: 'Cannot invite yourself' };

    // Check for existing relationship
    const { data: existing } = await supabase
        .from('trainer_clients')
        .select('id, status')
        .eq('trainer_id', user.id)
        .eq('client_id', clientProfile.id)
        .single();

    if (existing) return { error: `Relationship already exists (status: ${existing.status})` };

    const { data, error: dbErr } = await supabase
        .from('trainer_clients')
        .insert({ trainer_id: user.id, client_id: clientProfile.id, status: 'pending' })
        .select()
        .single();

    if (dbErr) return { error: dbErr.message };
    revalidatePath('/trainer/clients');
    return { relationship: data, clientName: clientProfile.name };
}

/** Client accepts a trainer's invite using the trainer's invite code */
export async function acceptTrainerInvite(trainerInviteCode: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Find trainer by invite code
    const { data: trainer } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('trainer_invite_code', trainerInviteCode.trim().toUpperCase())
        .single();

    if (!trainer) return { error: 'Invalid invite code' };
    if (trainer.id === user.id) return { error: 'Cannot join yourself' };

    // Upsert relationship — if trainer already invited via email, activate; else create
    const { data: existing } = await supabase
        .from('trainer_clients')
        .select('id, status')
        .eq('trainer_id', trainer.id)
        .eq('client_id', user.id)
        .single();

    if (existing?.status === 'active') return { error: 'Already connected to this trainer' };

    if (existing) {
        // Trainer already created a pending invite, accept it
        const { error: dbErr } = await supabase
            .from('trainer_clients')
            .update({ status: 'active', joined_at: new Date().toISOString(), invite_code: trainerInviteCode })
            .eq('id', existing.id);
        if (dbErr) return { error: dbErr.message };
    } else {
        // Self-join via invite code
        const { error: dbErr } = await supabase
            .from('trainer_clients')
            .insert({
                trainer_id:  trainer.id,
                client_id:   user.id,
                status:      'active',
                invite_code: trainerInviteCode,
                joined_at:   new Date().toISOString(),
            });
        if (dbErr) return { error: dbErr.message };
    }

    // Update client's user_type to 'client'
    await supabase.from('profiles').update({ user_type: 'client' }).eq('id', user.id);

    revalidatePath('/profile');
    return { success: true, trainerName: trainer.name };
}

/** Trainer accepts a pending invite request */
export async function acceptPendingInvite(relationshipId: string) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error };

    const { error: dbErr } = await supabase
        .from('trainer_clients')
        .update({ status: 'active', joined_at: new Date().toISOString() })
        .eq('id', relationshipId)
        .eq('trainer_id', user.id);

    if (dbErr) return { error: dbErr.message };
    revalidatePath('/trainer/clients');
    return { success: true };
}

/** Trainer deactivates a client relationship */
export async function deactivateClient(clientId: string) {
    const { supabase, user, error } = await requireTrainer();
    if (error || !supabase || !user) return { error };

    const { error: dbErr } = await supabase
        .from('trainer_clients')
        .update({ status: 'inactive' })
        .eq('trainer_id', user.id)
        .eq('client_id', clientId);

    if (dbErr) return { error: dbErr.message };
    revalidatePath('/trainer/clients');
    return { success: true };
}
