"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Typography } from "@/components/shared/Typography"
import { useSidebarCollapse } from "@/components/shared/sidebar-collapse-context"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarItemProps {
    href: string
    icon: ReactNode
    label: string
    isActive?: boolean
    isChild?: boolean
}

export function SidebarItem({ href, icon, label, isActive, isChild }: SidebarItemProps) {
    const pathname = usePathname()
    const { collapsed } = useSidebarCollapse()
    const active = isActive ?? pathname === href

    const itemClasses = cn(
        "w-full flex items-center transition-all duration-200",
        collapsed
            ? "justify-center rounded-xl px-0 py-2.5"
            : cn("gap-3 pl-6 pr-0 py-3", isChild && "pl-12"),
        active
            ? "bg-brand-byzantine text-white"
            : isChild
              ? "hover:bg-white/60"
              : "text-[#333] bg-white/40 hover:bg-gray-50",
        collapsed && !active && "bg-transparent hover:bg-white/60",
        collapsed && active && "rounded-xl"
    )

    const content = (
        <div className={itemClasses} aria-current={active ? "page" : undefined}>
            <span
                className={cn(
                    "flex items-center justify-center opacity-80 shrink-0",
                    collapsed ? "size-5" : isChild ? "size-5" : "size-6"
                )}
            >
                {icon}
            </span>
            {!collapsed ? (
                <Typography
                    as="span"
                    className={cn(
                        "text-[14px] font-semibold truncate",
                        isChild && "text-[13px] font-medium"
                    )}
                >
                    {label}
                </Typography>
            ) : null}
        </div>
    )

    const wrapped =
        active && !isChild ? (
            content
        ) : (
            <Link href={href} className="block">
                {content}
            </Link>
        )

    if (!collapsed) {
        return wrapped
    }

    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex justify-center">{wrapped}</div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                    <Typography as="span" className="text-xs font-medium">
                        {label}
                    </Typography>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
