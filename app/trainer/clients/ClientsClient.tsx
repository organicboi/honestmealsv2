'use client';

import { useState } from 'react';
import { Users, Search, UserPlus, Mail, ArrowRight, CheckCircle, Clock, UserX } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { inviteClientByEmail, acceptPendingInvite } from '@/app/actions/trainer';
import { toast } from 'sonner';

interface ClientRow {
    id: string;
    status: string;
    commission_rate?: number | null;
    joined_at?: string | null;
    profiles?: {
        id: string;
        name: string;
        email: string;
        goal_type?: string;
        weight?: number;
        daily_calorie_goal?: number;
    } | null;
}

const GOAL_LABELS: Record<string, string> = {
    lose_weight:     '🔥 Lose fat',
    build_muscle:    '💪 Build muscle',
    gain_weight:     '📈 Gain weight',
    maintain_weight: '⚖️ Maintain',
    manage_health:   '🫀 Get healthier',
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    active:   { icon: <CheckCircle size={14} />, label: 'Active',   color: 'text-green-600 bg-green-50' },
    pending:  { icon: <Clock size={14} />,        label: 'Pending',  color: 'text-amber-600 bg-amber-50' },
    inactive: { icon: <UserX size={14} />,        label: 'Inactive', color: 'text-gray-500 bg-gray-100' },
};

export default function ClientsClient({ data }: { data: { clients?: ClientRow[]; error?: string | null | undefined } }) {
    const { clients = [] } = data;
    const [search, setSearch] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [showInvite, setShowInvite] = useState(false);

    const filtered = clients.filter(c => {
        const q = search.toLowerCase();
        const p = c.profiles;
        return !q || p?.name?.toLowerCase().includes(q) || p?.email?.toLowerCase().includes(q);
    });

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        setInviting(true);
        try {
            const res = await inviteClientByEmail(inviteEmail);
            if ('error' in res && res.error) { toast.error(res.error); }
            else { toast.success(`Invite sent to ${inviteEmail}`); setInviteEmail(''); setShowInvite(false); }
        } finally { setInviting(false); }
    };

    const handleAccept = async (relId: string) => {
        const res = await acceptPendingInvite(relId);
        if ('error' in res && res.error) { toast.error(res.error); }
        else { toast.success('Client accepted!'); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Clients</h1>
                    <p className="text-sm text-gray-400">{clients.filter(c => c.status === 'active').length} active</p>
                </div>
                <button onClick={() => setShowInvite(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors">
                    <UserPlus size={16} /> Invite Client
                </button>
            </div>

            {/* Invite drawer */}
            {showInvite && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                    <p className="font-bold text-gray-800 mb-3">Invite client by email</p>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                placeholder="client@example.com"
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-orange-400 text-sm" />
                        </div>
                        <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
                            className="px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold disabled:opacity-50">
                            {inviting ? 'Sending…' : 'Send Invite'}
                        </button>
                        <button onClick={() => setShowInvite(false)}
                            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500">
                            Cancel
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search clients…"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-orange-400 text-sm" />
            </div>

            {/* Client list */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">No clients yet</p>
                    <p className="text-sm text-gray-400 mt-1">Share your trainer invite code or invite by email</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {filtered.map((c, i) => {
                        const p = c.profiles;
                        const statusCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.inactive;
                        const initials = (p?.name ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                        return (
                            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4 hover:border-orange-200 transition-colors">
                                {/* Avatar */}
                                <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                    <span className="font-black text-orange-600 text-sm">{initials}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-gray-900 text-sm truncate">{p?.name ?? 'Unnamed'}</p>
                                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                                            {statusCfg.icon}{statusCfg.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 truncate">{p?.email}</p>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        {p?.goal_type && (
                                            <span className="text-xs text-gray-500">{GOAL_LABELS[p.goal_type] ?? p.goal_type}</span>
                                        )}
                                        {c.joined_at && (
                                            <span className="text-xs text-gray-400">
                                                Joined {new Date(c.joined_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {c.status === 'pending' && (
                                        <button onClick={() => handleAccept(c.id)}
                                            className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100 transition-colors">
                                            Accept
                                        </button>
                                    )}
                                    {c.status === 'active' && p?.id && (
                                        <Link href={`/trainer/clients/${p.id}`}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 text-xs font-bold hover:bg-orange-100 transition-colors">
                                            View <ArrowRight size={12} />
                                        </Link>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
