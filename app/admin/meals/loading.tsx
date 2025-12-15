export default function AdminMealsLoading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                    <div className="grid grid-cols-6 gap-4">
                        <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
                        <div className="h-4 w-12 bg-gray-300 rounded animate-pulse" />
                        <div className="h-4 w-20 bg-gray-300 rounded animate-pulse" />
                        <div className="h-4 w-14 bg-gray-300 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
                    </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="px-6 py-4">
                            <div className="grid grid-cols-6 gap-4 items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                </div>
                                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                                <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                                <div className="h-4 w-10 bg-gray-200 rounded animate-pulse" />
                                <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                                <div className="flex gap-2 justify-end">
                                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
