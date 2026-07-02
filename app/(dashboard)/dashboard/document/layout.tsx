import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"

export default async function DocumentLayout({
    children,
    modal,
}: {
    children: ReactNode
    modal: ReactNode
}) {
    const role = await getDashboardRole()

    if (role === "UNIVERSITY") {
        redirect("/dashboard")
    }

    return (
        <>
            {children}
            {modal}
        </>
    )
}
