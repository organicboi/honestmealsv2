'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, Clock, CheckCircle, Filter } from 'lucide-react';
import { updateCommissionStatus } from '@/app/actions/trainer';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Commission {
    id: string;
    order_amount: number;
    commission_rate: number;
    commission_amount: number;
    status: string;
    paid_at?: string | null;
    created_at: string;
    orders?: { order_date: string } | null;
    profiles?: { name: string; email: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
    pending:    'text-amber-600 bg-amber-50 border-amber-200',
    processing: 'text-blue-600 bg-blue-50 border-blue-200',
    paid:       'text-green-600 bg-green-50 border-green-200',
    cancelled:  'text-gray-500 bg-gray-100 border-gray-200',
};
const STATUS_ORDER = ['pending', 'processing', 'paid', 'cancelled'];

export default function CommissionsClient({ data }: { data: { commissions?: Commission[]; error?: string | null | undefined } }) {
    const { commissions = [] } = data;
    const [filter, setFilter] = useState<string>('all');
    const [localCommissions, setLocalCommissions] = useState(commissions);

    const filtered = filter === 'all' ? localCommissions : localCommissions.filter(c => c.status === filter);

    const total   = localCommissions.filter(c => c.status !== 'cancelled').reduce((s, c) => s + c.commission_amount, 0);
    const pending = localCommissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commission_amount, 0);
    const paid    = localCommissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commission_amount, 0);

    const handleStatusChange = async (id: string, newStatus: 'pending' | 'processing' | 'paid' | 'cancelled') => {
        const res = await updateCommissionStatus(id, newStatus);
        if (res?.error) { toast.error(res.error); return; }
        setLocalCommissions(prev => prev.map(c => c.id === id ? { ...c, status: newStatus, paid_at: newStatus === 'paid' ? new Date().toISOString() : c.paid_at } : c));
        toast.success(`Commission marked as ${newStatus}`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Commissions</h1>
                <p className="text-sm text-gray-400 mt-0.5">Track your earnings from client meal orders</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Earned', value: total, icon: <TrendingUp className="h-6 w-6 text-green-500" />, bg: 'bg-green-50', color: 'text-green-700' },
                    { label: 'Pending Payout', value: pending, icon: <Clock className="h-6 w-6 text-amber-500" />, bg: 'bg-amber-50', color: 'text-amber-700' },
                    { label: 'Paid Out', value: paid, icon: <CheckCircle className="h-6 w-6 text-blue-500" />, bg: 'bg-blue-50', color: 'text-blue-700' },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className={`${s.bg} rounded-2xl p-5 border border-transparent`}>
                        <div className="flex items-center gap-3 mb-2">{s.icon}<p className="font-semibold text-sm text-gray-700">{s.label}</p></div>
                        <p className={`text-3xl font-black ${s.color}`}>₹{s.value.toFixed(2)}</p>
                    </motion.div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                <Filter size={16} className="text-gray-400 self-center" />
                {['all', ...STATUS_ORDER].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${filter === s ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}>
                        {s}
                        {s !== 'all' && (
                            <span className="ml-1.5 opacity-60">({localCommissions.filter(c => c.status === s).length})</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Commission table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                        <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p>No commissions{filter !== 'all' ? ` with status "${filter}"` : ''} yet</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        {['Date', 'Client', 'Order Amt', 'Rate', 'Commission', 'Status', 'Action'].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map(c => (
                                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                                {new Date(c.orders?.order_date ?? c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-900">{c.profiles?.name ?? '—'}</p>
                                                <p className="text-xs text-gray-400">{c.profiles?.email}</p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">₹{c.order_amount}</td>
                                            <td className="px-4 py-3 text-gray-500">{c.commission_rate}%</td>
                                            <td className="px-4 py-3 font-bold text-green-600">₹{c.commission_amount}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${STATUS_COLORS[c.status] ?? ''}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {c.status === 'pending' && (
                                                    <button onClick={() => handleStatusChange(c.id, 'processing')}
                                                        className="text-xs text-blue-600 hover:underline font-medium">
                                                        Mark Processing
                                                    </button>
                                                )}
                                                {c.status === 'processing' && (
                                                    <button onClick={() => handleStatusChange(c.id, 'paid')}
                                                        className="text-xs text-green-600 hover:underline font-medium">
                                                        Mark Paid
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile cards */}
                        <div className="sm:hidden divide-y divide-gray-50">
                            {filtered.map(c => (
                                <div key={c.id} className="px-4 py-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-bold text-gray-900 text-sm">{c.profiles?.name ?? '—'}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${STATUS_COLORS[c.status] ?? ''}`}>{c.status}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mb-2">
                                        {new Date(c.orders?.order_date ?? c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        · Order ₹{c.order_amount} × {c.commission_rate}%
                                    </p>
                                    <p className="font-black text-green-600">₹{c.commission_amount}</p>
                                    {c.status === 'pending' && (
                                        <button onClick={() => handleStatusChange(c.id, 'processing')}
                                            className="mt-2 text-xs text-blue-600 hover:underline font-medium">Mark Processing</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
