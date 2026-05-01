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
                'bg-[#f4f3f7] border-r border-border overflow-y-auto',
                'flex flex-col transition-all duration-300 ease-in-out',
                'md:w-64 md:h-screen md:static md:translate-x-0',
                'fixed inset-y-0 left-0 z-50 w-64 h-screen',
                'md:inset-auto md:border-r',
                isOpen ? 'translate-x-0' : '-translate-x-full',
                className
            )}
        >
            <div className="p-0 py-6 space-y-8">
                <div className="p-2 flex items-center gap-2">
                    <Image
                        src="/logo-dark.png"
                        alt="Logo"
                        width={200}
                        height={200}
                        className="rounded-lg"
                    />
                </div>

                <nav className="space-y-4">{children}</nav>
            </div>
        </aside>
    );
}
