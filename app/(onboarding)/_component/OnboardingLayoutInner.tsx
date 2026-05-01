"use client"

import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { AuthSidebarWrapper } from "@/components/auth-sidebar-wrapper"

export function OnboardingLayoutInner({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams()
    const showSidebar = searchParams.get("sidebar") !== "false"

    return (
        <div className="min-h-screen">
            <div className="flex">
                {showSidebar && (
                    <aside className={cn(
                        "hidden lg:flex flex-col sticky top-0 h-screen overflow-hidden",
                        "transition-all duration-500 ease-in-out",
                        "lg:w-1/2"
                    )}>
                        <AuthSidebarWrapper />
                    </aside>
                )}
                <main className={cn(
                    "lg:p-4 w-full min-w-0 min-h-screen",
                    showSidebar ? "lg:w-1/2" : ""
                )}>
                    {children}
                </main>
            </div>
        </div>
    )
}
