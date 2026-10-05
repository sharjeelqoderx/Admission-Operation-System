export default function Loading() {
    return (
        <div className="min-h-[60vh] animate-in fade-in duration-300">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-6 rounded-xl border border-white/60 bg-white/40 p-6 backdrop-blur-lg sm:p-8">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className={`bg-gray-200/40 rounded animate-pulse h-3 w-28`} />
                            <div className={`bg-gray-200/60 rounded animate-pulse h-11 w-full rounded-lg`} />
                        </div>
                    ))}
                    <div className="flex justify-end gap-3 pt-4">
                        <div className={`bg-gray-200/60 rounded animate-pulse h-10 w-28 rounded-lg`} />
                        <div className={`bg-gray-200/60 rounded animate-pulse h-10 w-36 rounded-lg`} />
                    </div>
                </div>
            </div>
        </div>
    )
}
