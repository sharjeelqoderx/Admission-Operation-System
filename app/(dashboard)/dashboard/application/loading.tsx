export default function Loading() {
    return (
        <div className="min-h-[60vh] animate-in fade-in duration-300">
            <div className="space-y-8">
                <div className="flex flex-wrap items-center gap-3">
                    <div className={`bg-gray-200/60 rounded animate-pulse h-10 w-48 rounded-lg`} />
                    <div className={`bg-gray-200/60 rounded animate-pulse h-10 w-36 rounded-lg`} />
                    <div className={`bg-gray-200/60 rounded animate-pulse h-10 w-36 rounded-lg`} />
                </div>
                <div className="overflow-hidden rounded-xl border border-white/60 bg-white/40 backdrop-blur-lg">
                    <div className="border-b border-brand-secondary/20 bg-brand-secondary/10 px-6 py-4">
                        <div className="flex gap-4">
                            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className={`bg-gray-200/40 rounded animate-pulse h-3 w-20`} />
                            ))}
                        </div>
                    </div>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-4 border-b border-brand-secondary/15 px-6 py-5">
                            {[0, 1, 2, 3, 4, 5, 6].map((c) => (
                                <div key={c} className={`bg-gray-200/60 rounded animate-pulse h-4 flex-1`} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
