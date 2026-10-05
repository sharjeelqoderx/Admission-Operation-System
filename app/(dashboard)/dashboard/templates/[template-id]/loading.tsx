export default function Loading() {
    return (
        <div className="min-h-[60vh] animate-in fade-in duration-300">
            <div className="space-y-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <div className="space-y-4 rounded-xl border border-white/60 bg-white/40 p-6 backdrop-blur-lg">
                            <div className={`bg-gray-200/60 rounded animate-pulse h-6 w-48`} />
                            {[0, 1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex gap-4">
                                    <div className={`bg-gray-200/40 rounded animate-pulse h-4 w-28 shrink-0`} />
                                    <div className={`bg-gray-200/60 rounded animate-pulse h-4 flex-1`} />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-4 rounded-xl border border-white/60 bg-white/40 p-6 backdrop-blur-lg">
                            <div className={`bg-gray-200/60 rounded animate-pulse h-6 w-40`} />
                            {[0, 1, 2].map((i) => (
                                <div key={i} className={`bg-gray-200/60 rounded animate-pulse h-14 w-full rounded-lg`} />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-4 rounded-xl border border-white/60 bg-white/40 p-6 backdrop-blur-lg">
                            <div className={`bg-gray-200/60 rounded animate-pulse h-6 w-32`} />
                            <div className="flex items-center gap-3">
                                <div className={`bg-gray-200/60 rounded animate-pulse size-12 rounded-full`} />
                                <div className="flex-1 space-y-2">
                                    <div className={`bg-gray-200/60 rounded animate-pulse h-4 w-32`} />
                                    <div className={`bg-gray-200/40 rounded animate-pulse h-3 w-24`} />
                                </div>
                            </div>
                            {[0, 1, 2].map((i) => (
                                <div key={i} className={`bg-gray-200/40 rounded animate-pulse h-4 w-full`} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
