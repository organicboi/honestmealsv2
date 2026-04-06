'use client';

import { Users, DollarSign, TrendingUp, Clock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface DashboardData {
    stats?: {
        totalClients: number;
        pendingInvites: number;
        mtdEarned: number;
        pendingPayout: number;
        totalEarned: number;
    };
    recentCommissions?: Array<{
        id: string;
        commission_amount: number;
        commission_rate: number;
        order_amount: number;
        status: string;
        created_at: string;
        profiles?: { name: string } | null;
    }>;
    activeClientsFeedToday?: unknown[];
    error?: string | null | undefined;
}

const STATUS_COLORS: Record<string, string> = {
    pending:    'text-amber-600 bg-amber-50',
    processing: 'text-blue-600 bg-blue-50',
    paid:       'text-green-600 bg-green-50',
    cancelled:  'text-gray-500 bg-gray-100',
};

export default function TrainerDashboardClient({ data }: { data: DashboardData }) {
    const { stats, recentCommissions = [], error } = data;

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                    <AlertCircle className="h-10 w-10 mx-auto mb-2 text-red-400" />
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    const kpis = [
        {
            label: 'Active Clients',
            value: stats?.totalClients ?? 0,
            icon: <Users className="h-6 w-6 text-blue-500" />,
            bg: 'bg-blue-50',
            sub: stats?.pendingInvites ? `${stats.pendingInvites} pending invite${stats.pendingInvites !== 1 ? 's' : ''}` : 'All active',
            href: '/trainer/clients',
        },
        {
            label: 'This Month',
            value: `₹${(stats?.mtdEarned ?? 0).toFixed(2)}`,
            icon: <TrendingUp className="h-6 w-6 text-green-500" />,
            bg: 'bg-green-50',
            sub: 'Commission earned',
            href: '/trainer/commissions',
        },
        {
            label: 'Pending Payout',
            value: `₹${(stats?.pendingPayout ?? 0).toFixed(2)}`,
            icon: <Clock className="h-6 w-6 text-amber-500" />,
            bg: 'bg-amber-50',
            sub: 'Awaiting payment',
            href: '/trainer/commissions',
        },
        {
            label: 'Total Earned',
            value: `₹${(stats?.totalEarned ?? 0).toFixed(2)}`,
            icon: <DollarSign className="h-6 w-6 text-purple-500" />,
            bg: 'bg-purple-50',
            sub: 'All time commissions',
            href: '/trainer/commissions',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Your training business at a glance</p>
                </div>
                <Link href="/trainer/clients"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors">
                    <Users size={16} /> Add Client
                </Link>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((k, i) => (
                    <motion.div key={k.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}>
                        <Link href={k.href}
                            className="block bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-orange-200 transition-colors">
                            <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
                                {k.icon}
                            </div>
                            <p className="text-2xl font-black text-gray-900">{k.value}</p>
                            <p className="text-xs font-semibold text-gray-600 mt-0.5">{k.label}</p>
                            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Recent commissions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Recent Commissions</h2>
                    <Link href="/trainer/commissions" className="text-xs text-orange-500 font-semibold flex items-center gap-1">
                        View all <ArrowRight size={12} />
                    </Link>
                </div>
                {recentCommissions.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-400">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No commissions yet. Clients haven&apos;t ordered any meals.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recentCommissions.map(c => (
                            <div key={c.id} className="flex items-center justify-between px-6 py-3.5">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {(c.profiles as { name?: string } | null)?.name ?? 'Unknown client'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Order ₹{c.order_amount} × {c.commission_rate}%
                                        · {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="font-bold text-green-600 text-sm">+₹{c.commission_amount}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] ?? 'text-gray-500 bg-gray-100'}`}>
                                        {c.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { href: '/trainer/clients',     label: 'Manage Clients',     icon: <Users size={18} />,        color: 'bg-blue-500' },
                    { href: '/trainer/commissions', label: 'View Commissions',   icon: <DollarSign size={18} />,   color: 'bg-green-500' },
                    { href: '/trainer/plans',       label: 'Assign a Plan',      icon: <CheckCircle size={18} />,  color: 'bg-purple-500' },
                ].map(a => (
                    <Link key={a.href} href={a.href}
                        className="flex items-center gap-3 bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 hover:border-orange-200 transition-colors">
                        <div className={`w-9 h-9 rounded-lg ${a.color} flex items-center justify-center text-white shrink-0`}>
                            {a.icon}
                        </div>
                        <span className="font-semibold text-sm text-gray-800">{a.label}</span>
                        <ArrowRight size={14} className="ml-auto text-gray-300" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
