'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClipboardList, Plus, X } from 'lucide-react';
import { assignPlan } from '@/app/actions/trainer';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface AssignedPlan {
    id: string;
    client_id: string;
    plan_type: string;
    title: string;
    description?: string | null;
    is_active: boolean;
    start_date?: string | null;
    end_date?: string | null;
    created_at: string;
    profiles?: { name: string; email: string } | null;
}

const PLAN_TYPES = ['meal', 'workout', 'combined'];
const TYPE_COLORS: Record<string, string> = {
    meal:     'text-green-600 bg-green-50 border-green-200',
    workout:  'text-blue-600 bg-blue-50 border-blue-200',
    combined: 'text-orange-600 bg-orange-50 border-orange-200',
};

export default function PlansClient({ data }: { data: { plans?: AssignedPlan[]; clients?: { id: string; name: string }[]; error?: string | null } }) {
    const { plans = [], clients = [] } = data;
    const searchParams = useSearchParams();
    const preselectedClientId = searchParams.get('newFor') ?? '';

    const [localPlans, setLocalPlans] = useState(plans);
    const [showForm, setShowForm] = useState(!!preselectedClientId);
    const [filterType, setFilterType] = useState('all');
    const [form, setForm] = useState({
        client_id: preselectedClientId,
        plan_type: 'meal',
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        plan_data: '{}',
    });
    const [saving, setSaving] = useState(false);

    const filtered = filterType === 'all' ? localPlans : localPlans.filter(p => p.plan_type === filterType);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.client_id) { toast.error('Select a client'); return; }
        if (!form.title.trim()) { toast.error('Enter a plan title'); return; }
        let parsedData: Record<string, unknown> = {};
        try { parsedData = JSON.parse(form.plan_data); } catch { toast.error('Plan data is not valid JSON'); return; }

        setSaving(true);
        const res = await assignPlan({
            client_id: form.client_id,
            plan_type: form.plan_type as 'meal' | 'workout' | 'combined',
            title: form.title,
            plan_data: parsedData,
            start_date: form.start_date || undefined,
            end_date: form.end_date || undefined,
            description: form.description || undefined,
        });
        setSaving(false);

        if (res?.error) { toast.error(res.error); return; }
        if (res?.plan) {
            setLocalPlans(prev => [res.plan as AssignedPlan, ...prev]);
            toast.success('Plan assigned!');
            setShowForm(false);
            setForm({ client_id: '', plan_type: 'meal', title: '', description: '', start_date: '', end_date: '', plan_data: '{}' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Plans</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Meal and workout plans assigned to your clients</p>
                </div>
                <button onClick={() => setShowForm(v => !v)}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors">
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                    {showForm ? 'Cancel' : 'Assign Plan'}
                </button>
            </div>

            {/* Create form */}
            <AnimatePresence>
                {showForm && (
                    <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-white border border-orange-100 rounded-2xl p-5 space-y-4">
                        <h2 className="font-bold text-gray-800">New Plan</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 font-medium">Client *</label>
                                <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                                    className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
                                    <option value="">— Select client —</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-medium">Plan Type *</label>
                                <select value={form.plan_type} onChange={e => setForm(f => ({ ...f, plan_type: e.target.value }))}
                                    className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
                                    {PLAN_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs text-gray-500 font-medium">Title *</label>
                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. 8-week fat loss plan"
                                    className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs text-gray-500 font-medium">Description</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                                    className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-medium">Start Date</label>
                                <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                                    className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-medium">End Date</label>
                                <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                                    className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs text-gray-500 font-medium">Plan Data (JSON)</label>
                                <textarea value={form.plan_data} onChange={e => setForm(f => ({ ...f, plan_data: e.target.value }))} rows={4}
                                    className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-orange-400 resize-none" />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={saving}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                                {saving ? 'Saving…' : 'Save Plan'}
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {['all', ...PLAN_TYPES].map(t => (
                    <button key={t} onClick={() => setFilterType(t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${filterType === t ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Plans list */}
            {filtered.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                    <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>No plans{filterType !== 'all' ? ` of type "${filterType}"` : ''} assigned yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(plan => (
                        <motion.div key={plan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${TYPE_COLORS[plan.plan_type] ?? ''}`}>
                                    {plan.plan_type}
                                </span>
                                <span className={`text-xs font-medium ${plan.is_active ? 'text-green-500' : 'text-gray-400'}`}>
                                    {plan.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-sm">{plan.title}</p>
                                {plan.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{plan.description}</p>}
                            </div>
                            <div className="text-xs text-gray-400">
                                <p><span className="font-medium text-gray-600">Client: </span>{plan.profiles?.name ?? '—'}</p>
                                {plan.start_date && (
                                    <p className="mt-0.5">
                                        {new Date(plan.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        {plan.end_date && ` → ${new Date(plan.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
