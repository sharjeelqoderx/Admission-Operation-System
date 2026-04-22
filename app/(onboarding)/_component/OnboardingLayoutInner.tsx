"use client"

import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { AuthSidebarWrapper } from "@/components/auth-sidebar-wrapper"

export function OnboardingLayoutInner({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams()
    const noSidebar = searchParams.get("noSidebar") === "true"

    return (
        <div className="flex h-screen overflow-hidden">
            {!noSidebar && (
                <aside className={cn(
                    "hidden lg:flex flex-col shrink-0 sticky top-0 h-screen overflow-hidden",
                    "transition-all duration-500 ease-in-out",
                    "md:w-[420px] lg:w-[480px] xl:w-[655px]"
                )}>
                    <AuthSidebarWrapper />
                </aside>
            )}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
