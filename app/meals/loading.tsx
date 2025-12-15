export default function MealsLoading() {
    return (
        <div className="min-h-screen bg-gray-50 pb-32 md:pb-0">
            {/* Sticky Header Skeleton */}
            <div className="sticky top-[60px] md:top-[68px] z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-md mx-auto px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4">
                        <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse shrink-0" />
                        <div className="w-px h-6 bg-gray-200 mx-1 shrink-0" />
                        <div className="h-9 w-16 bg-gray-200 rounded-full animate-pulse shrink-0" />
                        <div className="h-9 w-16 bg-gray-200 rounded-full animate-pulse shrink-0" />
                        <div className="h-9 w-24 bg-gray-200 rounded-full animate-pulse shrink-0" />
                    </div>
                </div>
            </div>

            <main className="max-w-md mx-auto px-4 py-6 space-y-6">
                {/* Hero Section Skeleton */}
                <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl p-6 h-32 animate-pulse" />

                {/* Results Header Skeleton */}
                <div className="flex items-center justify-between px-1">
                    <div className="h-7 w-36 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Meal Cards Skeleton */}
                <div className="grid grid-cols-1 gap-5">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                            <div className="h-48 bg-gray-200 animate-pulse" />
                            <div className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-6 w-12 bg-gray-200 rounded-lg animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                    <div className="space-y-1">
                                        <div className="h-3 w-10 bg-gray-200 rounded animate-pulse" />
                                        <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                    <div className="h-11 w-28 bg-gray-200 rounded-xl animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
