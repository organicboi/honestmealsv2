export default function ClientDetailLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="h-24 bg-gray-200 rounded-2xl" />
            <div className="flex gap-2">
                {[...Array(7)].map((_, i) => (
                    <div key={i} className="h-9 w-24 bg-gray-200 rounded-lg" />
                ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
    );
}
