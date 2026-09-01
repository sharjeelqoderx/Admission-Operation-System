import { Suspense, type ReactNode } from "react"
import { DashboardPageSkeleton } from "@/components/shared/page-skeleton"

export default function DashboardPagesLayout({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={<DashboardPageSkeleton />}>
            {children}
        </Suspense>
    )
}
