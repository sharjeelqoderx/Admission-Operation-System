import { Suspense, type ReactNode } from "react"
import { DashboardPageSkeleton } from "@/components/shared/page-skeleton"

export default function DashboardPagesLayout({
    children,
    modal,
}: {
    children: ReactNode
    modal: ReactNode
}) {
    return (
        <Suspense fallback={<DashboardPageSkeleton />}>
            {children}
            {modal}
        </Suspense>
    )
}
