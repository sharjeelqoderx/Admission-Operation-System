"use client"

import { useSearchParams } from "next/navigation"
import { AuthFooter } from "./AuthFooter"
import { AuthSidebarWrapper } from "@/components/auth-sidebar-wrapper"
import { cn } from "@/lib/utils"

export function AuthLayoutInner({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams()
    const noSidebar = searchParams.get("noSidebar") === "true"

    return (
        <div className="min-h-screen">
            <div className="flex">
                {!noSidebar && (
                    <aside className={cn(
                        "hidden lg:flex flex-col shrink-0 sticky top-0 h-screen overflow-hidden",
                        "transition-all duration-500 ease-in-out",
                        "md:w-[420px] lg:w-[480px] xl:w-[655px]"
                    )}>
                        <AuthSidebarWrapper />
                    </aside>
                )}
                <main className="flex-1 size-full min-h-screen">
                    {children}
                </main>
            </div>
            <AuthFooter />
        </div>
    )
}
