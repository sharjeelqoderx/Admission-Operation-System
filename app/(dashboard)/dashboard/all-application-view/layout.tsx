import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getDashboardRole } from "@/lib/dashboard/server"
import { Role } from "@/types/enums/role"

export default async function AllApplicationViewLayout({
    children,
}: {
    children: ReactNode
}) {
    const role = await getDashboardRole()

    if (!role) {
        redirect("/login")
    }

    if (role === Role.STUDENT || role === Role.ADMIN || role === Role.SUPER_ADMIN) {
        redirect("/dashboard")
    }

    return children
}
