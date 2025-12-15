export default function WorkoutLoading() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="max-w-md mx-auto px-4 py-6 space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                </div>

                {/* Calendar Skeleton */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
                        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {/* Day names */}
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={`day-${i}`} className="h-4 bg-gray-200 rounded animate-pulse" />
                        ))}
                        {/* Calendar days */}
                        {Array.from({ length: 35 }).map((_, i) => (
                            <div key={`date-${i}`} className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                            <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-1 animate-pulse" />
                            <div className="h-3 w-16 bg-gray-200 rounded mx-auto animate-pulse" />
                        </div>
                    ))}
                </div>

                {/* Workout Card Skeleton */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                        <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add Workout Button Skeleton */}
                <div className="h-14 w-full bg-gray-200 rounded-2xl animate-pulse" />
            </div>
        </div>
    );
}
