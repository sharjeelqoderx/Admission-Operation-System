'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SidebarProps {
    children: ReactNode;
    className?: string;
    isOpen?: boolean;
}

export function Sidebar({ children, className, isOpen = true }: SidebarProps) {
    return (
        <aside
            className={cn(
                'border-r border-border h-screen flex flex-col relative overflow-hidden',
                'transition-all duration-300 ease-in-out',
                'md:w-64 md:static md:translate-x-0',
                'fixed inset-y-0 left-0 z-50 w-64',
                isOpen ? 'translate-x-0' : '-translate-x-full',
                'bg-[rgba(153,51,255,0.1)]',
                className
            )}
        >
            {/* Logo — fixed at top */}
            <div className="shrink-0 px-6 py-6 flex items-center justify-center relative z-10">
                <Image
                    src="/logo-dark.png"
                    alt="Logo"
                    width={180}
                    height={60}
                    className="w-auto h-auto object-contain"
                    priority
                />
            </div>

            {/* Nav list — scrolls when zoomed or viewport is short */}
            <nav
                className={cn(
                    'flex-1 min-h-0 overflow-y-auto overflow-x-hidden',
                    'relative z-10 space-y-0.5',
                    '[scrollbar-gutter:stable]'
                )}
                aria-label="Dashboard navigation"
            >
                {children}
            </nav>
        </aside>
    );
}
