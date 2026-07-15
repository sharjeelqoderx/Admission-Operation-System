import { Suspense, type ReactNode } from "react"
import { PageLoader } from "@/components/shared/page-loader"

export default function DashboardPagesLayout({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={<PageLoader className="min-h-[60vh]" />}>
            {children}
        </Suspense>
    )
}
