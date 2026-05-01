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
}

export function SidebarItem({ href, icon, label, isActive }: SidebarItemProps) {
    const pathname = usePathname();
    const active = isActive ?? pathname === href;

    const itemClasses = cn(
        "w-full flex items-center gap-4 px-6 h-11 text-sm font-medium transition-colors",
        active
            ? "bg-[#9B51E0] text-white"
            : "text-gray-700 hover:bg-[#e0dceb] hover:text-[#9B51E0]"
    );

    const content = (
        <div className={itemClasses} aria-current={active ? "page" : undefined}>
            <span className="w-5 h-5 flex items-center justify-center">
                {icon}
            </span>
            <span>{label}</span>
        </div>
    );

    if (active) return content;

    return <Link href={href}>{content}</Link>;
}