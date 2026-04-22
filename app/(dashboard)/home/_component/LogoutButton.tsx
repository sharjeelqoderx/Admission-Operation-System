"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { useLogout } from "@/lib/hooks/useAuth"

export function LogoutButton() {
    const router = useRouter()
    const logout = useLogout()

    const handleLogout = async () => {
        await logout.mutateAsync()
        router.push("/login")
        router.refresh()
    }

    return (
        <button
            onClick={handleLogout}
            disabled={logout.isPending}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white text-sm font-medium transition-colors"
        >
            <LogOut className="size-4 shrink-0" />
            {logout.isPending ? "Signing out..." : "Sign out"}
        </button>
    )
}
