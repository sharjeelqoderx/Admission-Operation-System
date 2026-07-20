import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { Role } from "@/types/enums/role"

export default async function DocumentLayout({
    children,
    modal,
}: {
    children: ReactNode
    modal: ReactNode
}) {
    const role = await getDashboardRole()

    if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
        redirect("/dashboard")
    }

    return (
        <>
            {children}
            {modal}
        </>
    )
}
