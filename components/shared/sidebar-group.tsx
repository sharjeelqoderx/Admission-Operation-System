"use client"

import { ReactNode, useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Typography } from "@/components/shared/Typography"
import { useSidebarCollapse } from "@/components/shared/sidebar-collapse-context"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

type SidebarGroupChild = {
    href: string
    label: string
    icon?: ReactNode
    isActive?: boolean
}

interface SidebarGroupProps {
    icon: ReactNode
    label: string
    children: ReactNode
    defaultOpen?: boolean
    /** Used in collapsed mode for the flyout menu */
    menuItems?: SidebarGroupChild[]
}

export function SidebarGroup({
    icon,
    label,
    children,
    defaultOpen = false,
    menuItems = [],
}: SidebarGroupProps) {
    const { collapsed } = useSidebarCollapse()
    const [isOpen, setIsOpen] = useState(defaultOpen)
    const isGroupActive = defaultOpen

    if (collapsed) {
        return (
            <TooltipProvider delayDuration={150}>
                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    aria-label={label}
                                    className={cn(
                                        "mx-auto flex size-10 items-center justify-center rounded-xl transition-all duration-200",
                                        isGroupActive
                                            ? "bg-brand-byzantine text-white"
                                            : "text-[#333] hover:bg-white/60"
                                    )}
                                >
                                    <span className="flex size-5 items-center justify-center opacity-90">
                                        {icon}
                                    </span>
                                </button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                            <Typography as="span" className="text-xs font-medium">
                                {label}
                            </Typography>
                        </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent side="right" align="start" className="min-w-48 ml-1">
                        {menuItems.map((item) => (
                            <DropdownMenuItem key={item.href} asChild className="cursor-pointer">
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2",
                                        item.isActive && "bg-brand-byzantine/10 text-brand-byzantine"
                                    )}
                                >
                                    {item.icon ? (
                                        <span className="size-4 shrink-0 opacity-80">{item.icon}</span>
                                    ) : null}
                                    <Typography as="span" className="text-sm font-medium">
                                        {item.label}
                                    </Typography>
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </TooltipProvider>
        )
    }

    return (
        <div
            className={cn(
                "relative transition-all duration-300 bg-white/40 text-[#333]",
                isGroupActive && "text-white bg-brand-byzantine"
            )}
        >
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center gap-3 pl-6 pr-3 py-3 transition-all duration-200",
                    "text-[14px] font-semibold cursor-pointer"
                )}
            >
                <span className="flex size-6 shrink-0 items-center justify-center opacity-80">
                    {icon}
                </span>
                <Typography as="span" className="flex-1 text-left text-[14px] font-semibold truncate">
                    {label}
                </Typography>
                <ChevronDown
                    className={cn(
                        "size-4 shrink-0 transition-transform duration-200 opacity-60",
                        isOpen && "rotate-180 opacity-100"
                    )}
                />
            </button>

            {isOpen ? (
                <div className="animate-in slide-in-from-top-1 duration-200">{children}</div>
            ) : null}
        </div>
    )
}
