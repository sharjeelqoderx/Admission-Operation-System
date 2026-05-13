"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    FileText,
    BookOpen,
    Files,
    Award,
    CreditCard,
    BadgeDollarSign,
    MessageSquare,
    UserCircle,
    UserPlus,
    User,
    type LucideIcon
} from "lucide-react"
import { Typography } from "@/components/shared/Typography"

type NavItem = {
    icon: LucideIcon
    label: string
    href?: string
    subItems?: { icon: LucideIcon; label: string; href: string }[]
}

const navItems: NavItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    {
        icon: Users,
        label: "All Students",
        href: "/dashboard/student",
        subItems: [
            { icon: UserPlus, label: "Add Student", href: "/student/new" },
            { icon: User, label: "View Profile", href: "/student" },
        ]
    },
    { icon: FileText, label: "All Applications", href: "/application" },
    { icon: BookOpen, label: "Programs", href: "/program" },
    { icon: Files, label: "All Documents", href: "/document" },
    { icon: Award, label: "Offers", href: "/offer" },
    { icon: CreditCard, label: "Payments", href: "/payment" },
    { icon: BadgeDollarSign, label: "Commissions", href: "/commission" },
    { icon: MessageSquare, label: "Messages", href: "/chat" },
    { icon: UserCircle, label: "Agent Profile", href: "/profile" },
]

export function NavContent() {
    const pathname = usePathname()
    // Open the dropdown by default if we are on any of its sub-pages
    const [openMenu, setOpenMenu] = useState<string | null>(
        pathname?.startsWith("/student") ? "All Students" : null
    )

    const toggleMenu = (label: string) => {
        setOpenMenu(prev => prev === label ? null : label)
    }

    return (
        <div className="flex flex-col h-full bg-[#f4f3f7] relative overflow-hidden">
            {/* Sidebar Background Image */}
            <div
                className="absolute inset-0 pointer-events-none z-0 opacity-[0.15] mix-blend-luminosity"
                style={{
                    // backgroundImage: `url('/Mask group (3).png')`,
                    backgroundRepeat: 'repeat-y',
                    backgroundSize: '100% auto'
                }}
            />

            <div className="px-6 py-6 flex items-center h-[72px] relative z-10 shrink-0">
                <Image
                    src="/logo-dark.png"
                    alt="FHM"
                    width={140}
                    height={48}
                    className="object-contain"
                    priority
                />
            </div>
            <nav className="flex-1 py-4 overflow-y-auto relative z-10">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const isExpanded = openMenu === item.label
                    const hasSubItems = !!item.subItems

                    return (
                        <div key={item.label} className="w-full">
                            {/* Main Item Row */}
                            <button
                                onClick={() => {
                                    if (hasSubItems) toggleMenu(item.label)
                                    if (item.href) {
                                        // Navigate directly using window.location or router
                                        // But we can also just wrap it in a Link or use router.push. Let's use Link wrapper around the content
                                    }
                                }}
                                className={`w-full flex items-center gap-4 px-6 py-3.5 text-sm font-medium transition-colors ${isActive || isExpanded
                                    ? "bg-[#9B51E0] text-white"
                                    : "text-gray-700 hover:bg-[#e0dceb] hover:text-[#9B51E0]"
                                    }`}
                                type="button"
                            >
                                {hasSubItems ? (
                                    <Link href={item.href || "#"} className="flex items-center gap-4 w-full">
                                        <item.icon className="size-5 shrink-0" />
                                        <Typography as="span" className="text-inherit">
                                            {item.label}
                                        </Typography>
                                    </Link>
                                ) : (
                                    <Link href={item.href || "#"} className="flex items-center gap-4 w-full">
                                        <item.icon className="size-5 shrink-0" />
                                        <Typography as="span" className="text-inherit">
                                            {item.label}
                                        </Typography>
                                    </Link>
                                )}
                            </button>

                            {/* Dropdown Sub-items */}
                            {hasSubItems && isExpanded && (
                                <div className="bg-[#9B51E0] pb-2 flex flex-col">
                                    {item.subItems!.map((subItem) => {
                                        const isSubActive = pathname === subItem.href
                                        return (
                                            <Link key={subItem.label} href={subItem.href}>
                                                <div
                                                    className={`w-full flex items-center gap-3 pl-12 pr-6 py-2.5 text-sm transition-colors ${isSubActive
                                                        ? "text-white font-semibold"
                                                        : "text-white/70 hover:text-white"
                                                        }`}
                                                >
                                                    <subItem.icon className="size-[18px] shrink-0" />
                                                    <Typography as="span" className="text-inherit">
                                                        {subItem.label}
                                                    </Typography>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </nav>
        </div>
    )
}
