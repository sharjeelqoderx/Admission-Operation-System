import type { ReactNode } from "react"

export default async function DocumentLayout({
    children,
    modal,
}: {
    children: ReactNode
    modal: ReactNode
}) {
    return (
        <>
            {children}
            {modal}
        </>
    )
}
