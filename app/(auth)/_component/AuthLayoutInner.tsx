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
                        "hidden lg:flex flex-col sticky top-0 h-screen overflow-hidden",
                        "transition-all duration-500 ease-in-out",
                        "lg:w-1/2"
                    )}>
                        <AuthSidebarWrapper />
                    </aside>
                )}

                <main className={cn("lg:p-4 w-full min-w-0 min-h-screen",
                    !noSidebar ? 'lg:w-1/2' : ''
                )}>
                    {children}
                </main>
            </div>
            {/* <AuthFooter /> */}
        </div>
    )
}
