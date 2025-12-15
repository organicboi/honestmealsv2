export default function AskMeLoading() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="max-w-md mx-auto px-4 py-6 space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                </div>

                {/* Credits/Info Card Skeleton */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Chat Area Skeleton */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Chat History */}
                    <div className="p-4 space-y-4 min-h-[400px]">
                        {/* Assistant Message */}
                        <div className="flex gap-3">
                            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>

                        {/* User Message */}
                        <div className="flex gap-3 justify-end">
                            <div className="space-y-2 max-w-[80%]">
                                <div className="h-10 w-48 bg-green-100 rounded-2xl animate-pulse ml-auto" />
                            </div>
                        </div>

                        {/* Assistant Message */}
                        <div className="flex gap-3">
                            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Input Area Skeleton */}
                    <div className="border-t border-gray-100 p-4">
                        <div className="flex gap-2">
                            <div className="flex-1 h-12 bg-gray-200 rounded-xl animate-pulse" />
                            <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
