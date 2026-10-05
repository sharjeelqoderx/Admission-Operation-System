export default function Loading() {
    return (
        <div className="min-h-[60vh] animate-in fade-in duration-300">
            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                    <div className={`bg-gray-200/60 rounded animate-pulse h-10 w-32 rounded-lg`} />
                    <div className={`bg-gray-200/60 rounded animate-pulse h-10 min-w-[200px] flex-1 rounded-lg`} />
                    <div className={`bg-gray-200/60 rounded animate-pulse h-10 w-28 rounded-lg`} />
                </div>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="min-h-[480px] space-y-4 rounded-xl border border-white/60 bg-white/40 p-6 backdrop-blur-lg">
                        <div className={`bg-gray-200/60 rounded animate-pulse h-6 w-48`} />
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className={`bg-gray-200/40 rounded animate-pulse h-4 w-full`} />
                        ))}
                    </div>
                    <div className="space-y-4 rounded-xl border border-white/60 bg-white/40 p-6 backdrop-blur-lg">
                        <div className={`bg-gray-200/60 rounded animate-pulse h-6 w-40`} />
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className={`bg-gray-200/60 rounded animate-pulse h-12 w-full rounded-lg`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
