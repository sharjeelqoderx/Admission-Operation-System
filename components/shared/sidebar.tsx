"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"
import { useSidebarCollapse } from "@/components/shared/sidebar-collapse-context"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import appleIcon from "@/app/apple-icon.png"

interface SidebarProps {
    children: ReactNode
    className?: string
    isOpen?: boolean
}

export function Sidebar({ children, className, isOpen = true }: SidebarProps) {
    const { collapsed, toggleCollapsed } = useSidebarCollapse()

    return (
        <aside
            className={cn(
                "border-r border-border border-r-1 border-r-brand-byzantine/30 h-screen flex flex-col relative overflow-hidden",
                "transition-[width,transform] duration-300 ease-in-out",
                collapsed ? "md:w-[72px]" : "md:w-64",
                "md:static md:translate-x-0",
                "fixed inset-y-0 left-0 z-50 w-64",
                isOpen ? "translate-x-0" : "-translate-x-full",
                "bg-[#f0e4ff]",
                className
            )}
        >
            <div
                className={cn(
                    "shrink-0 relative z-10 flex items-center",
                    collapsed
                        ? "flex-col gap-3 px-2 py-5"
                        : "justify-between gap-2 px-4 py-5"
                )}
            >
                <div
                    className={cn(
                        "flex items-center justify-center overflow-hidden",
                        collapsed ? "h-9 w-9" : "h-12 flex-1"
                    )}
                >
                    <Image
                        src={collapsed ? appleIcon : "/logo-dark.png"}
                        alt="Logo"
                        width={collapsed ? 36 : 180}
                        height={collapsed ? 36 : 60}
                        className={cn(
                            "object-contain",
                            collapsed ? "h-8 w-8" : "h-auto w-auto max-h-12"
                        )}
                        priority
                    />
                </div>

                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={toggleCollapsed}
                                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                                className={cn(
                                    "hidden md:inline-flex size-9 shrink-0 rounded-xl text-brand-byzantine",
                                    "hover:bg-brand-byzantine/10 hover:text-brand-byzantine"
                                )}
                            >
                                {collapsed ? (
                                    <PanelLeftOpen className="size-5" />
                                ) : (
                                    <PanelLeftClose className="size-5" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <Typography as="span" className="text-xs">
                                {collapsed ? "Expand sidebar" : "Collapse sidebar"}
                            </Typography>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <nav
                className={cn(
                    "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
                    "relative z-10",
                    collapsed ? "px-2 space-y-1" : "space-y-0.5 pr-0"
                )}
                aria-label="Dashboard navigation"
            >
                {children}
            </nav>
        </aside>
    )
}
