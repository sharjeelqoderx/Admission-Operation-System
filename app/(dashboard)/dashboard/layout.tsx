import { Suspense, type ReactNode } from "react"
import Loading from "./loading"

export default function DashboardPagesLayout({
    children,
    modal,
}: {
    children: ReactNode
    modal: ReactNode
}) {
    return (
        <Suspense fallback={<Loading />}>
            {children}
            {modal}
        </Suspense>
    )
}
