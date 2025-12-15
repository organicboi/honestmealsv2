export default function HealthLoading() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="max-w-md mx-auto px-4 py-6 space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse" />
                                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                            </div>
                            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                            <div className="h-2 w-full bg-gray-200 rounded-full animate-pulse" />
                        </div>
                    ))}
                </div>

                {/* Macros Card Skeleton */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="flex justify-between gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex-1 text-center">
                                <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-2 animate-pulse" />
                                <div className="h-4 w-12 bg-gray-200 rounded mx-auto mb-1 animate-pulse" />
                                <div className="h-3 w-16 bg-gray-200 rounded mx-auto animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions Skeleton */}
                <div className="grid grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 h-24 animate-pulse" />
                    ))}
                </div>

                {/* Water Tracker Skeleton */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="h-6 w-28 bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="flex justify-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="h-12 w-8 bg-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                    <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
                </div>
            </div>
        </div>
    );
}
