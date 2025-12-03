'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, LogOut, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { signout } from '@/app/actions/auth';

interface ProfileClientProps {
    user: any;
}

export default function ProfileClient({ user }: ProfileClientProps) {
    const router = useRouter();

    const handleSignOut = async () => {
        await signout();
    };

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-5"
                 style={{
                     backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                 }}></div>

            <div className="relative container mx-auto px-4 py-12">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8"
                >
                    <Button
                        onClick={() => router.push('/')}
                        variant="outline"
                        className="border-green-600 text-green-600 hover:bg-green-50"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>
                </motion.div>

                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        className="bg-white rounded-2xl shadow-xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-12 text-white">
                            <div className="flex items-center">
                                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold mr-6">
                                    {user.email?.[0].toUpperCase()}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">My Profile</h1>
                                    <p className="text-green-100">Manage your account settings</p>
                                </div>
                            </div>
                        </div>

                        {/* Profile Information */}
                        <div className="p-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Account Information</h2>
                            
                            <div className="space-y-6">
                                {/* Email */}
                                <div className="flex items-start">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                                        <Mail className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500 mb-1">Email Address</p>
                                        <p className="text-lg font-medium text-gray-800">{user.email}</p>
                                    </div>
                                </div>

                                {/* User ID */}
                                <div className="flex items-start">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                                        <User className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500 mb-1">User ID</p>
                                        <p className="text-sm font-medium text-gray-800 break-all font-mono">{user.id}</p>
                                    </div>
                                </div>

                                {/* Created At */}
                                <div className="flex items-start">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                                        <Calendar className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500 mb-1">Member Since</p>
                                        <p className="text-lg font-medium text-gray-800">
                                            {new Date(user.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* Email Verified Status */}
                                <div className="flex items-start">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                                        <Mail className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500 mb-1">Email Verification</p>
                                        <div className="flex items-center">
                                            {user.email_confirmed_at ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                    ✓ Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                                    Pending Verification
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200 my-8"></div>

                            {/* Actions */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Account Actions</h2>
                                
                                <Button
                                    onClick={handleSignOut}
                                    variant="outline"
                                    className="w-full border-red-600 text-red-600 hover:bg-red-50"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Additional Info Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6"
                    >
                        <h3 className="font-bold text-blue-900 mb-2">Need Help?</h3>
                        <p className="text-sm text-blue-800">
                            If you need to update your account information or have any questions, 
                            please contact our support team at{' '}
                            <a href="mailto:support@honestmeals.com" className="font-medium underline">
                                support@honestmeals.com
                            </a>
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
