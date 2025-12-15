export default function ProfileLoading() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="max-w-md mx-auto px-4 py-6 space-y-6">
                {/* Profile Header Skeleton */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 bg-gray-200 rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                            <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
                            <div className="h-3 w-16 bg-gray-200 rounded mx-auto animate-pulse" />
                        </div>
                    ))}
                </div>

                {/* Menu Items Skeleton */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50 last:border-b-0">
                            <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
                                <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
                            </div>
                            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                        </div>
                    ))}
                </div>

                {/* Goals Card Skeleton */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between">
                                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                                </div>
                                <div className="h-2 w-full bg-gray-200 rounded-full animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sign Out Button Skeleton */}
                <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
            </div>
        </div>
    );
}
