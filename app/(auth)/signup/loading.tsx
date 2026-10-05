export default function Loading() {
    return (
        <div className="min-h-[60vh] animate-in fade-in duration-300">
            <div className="flex min-h-[50vh] items-center justify-center p-6">
                <div className="w-full max-w-md space-y-6 rounded-xl border border-white/60 bg-white/40 p-8 backdrop-blur-lg">
                    <div className="space-y-2 text-center">
                        <div className={`bg-gray-200/60 rounded animate-pulse mx-auto h-8 w-40`} />
                        <div className={`bg-gray-200/40 rounded animate-pulse mx-auto h-4 w-56`} />
                    </div>
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className={`bg-gray-200/40 rounded animate-pulse h-3 w-24`} />
                            <div className={`bg-gray-200/60 rounded animate-pulse h-11 w-full rounded-lg`} />
                        </div>
                    ))}
                    <div className={`bg-gray-200/60 rounded animate-pulse h-11 w-full rounded-lg`} />
                </div>
            </div>
        </div>
    )
}
