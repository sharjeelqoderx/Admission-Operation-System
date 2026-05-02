'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
    href: string;
    icon: ReactNode;
    label: string;
    isActive?: boolean;
    isChild?: boolean;
}

export function SidebarItem({ href, icon, label, isActive, isChild }: SidebarItemProps) {
    const pathname = usePathname();
    const active = isActive ?? pathname === href;

    const itemClasses = cn(
        "w-full flex items-center gap-3 px-6 py-2 transition-all duration-200 mt-1",
        isChild ? "border-none pl-12" : "",
        active
            ? "bg-[#9B51E0] text-white border-transparent"
            : isChild ? "text-white/70 hover:text-white" : "text-[#333] bg-white/40 hover:bg-gray-50",
        isChild && active && "text-white"
    );

    const content = (
        <div className={itemClasses} aria-current={active ? "page" : undefined}>
            <span className={cn("w-6 h-6 flex items-center justify-center opacity-80", isChild && "w-5 h-5")}>
                {icon}
            </span>
            <span className={cn("text-[14px] font-semibold", isChild && "text-[13px] font-medium")}>{label}</span>
        </div>
    );

    if (active && !isChild) return content;

    return <Link href={href} className="block">{content}</Link>;
}