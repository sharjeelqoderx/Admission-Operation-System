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
                'bg-[#f4f3f7] border-r border-border h-screen flex flex-col relative overflow-hidden',
                'transition-all duration-300 ease-in-out',
                'md:w-64 md:static md:translate-x-0',
                'fixed inset-y-0 left-0 z-50 w-64',
                isOpen ? 'translate-x-0' : '-translate-x-full',
                className
            )}
        >
            {/* Logo Section */}
            <nav className="flex-1 space-y-0.5 relative z-10 bg-[rgba(153,51,255,0.1)]">
                <div className="px-6 py-6 flex items-center justify-center">
                    <Image
                        src="/logo-dark.png"
                        alt="Logo"
                        width={180}
                        height={60}
                        className="w-auto h-auto object-contain"
                        priority
                    />
                </div>

                {/* Navigation Section */}
                {children}
            </nav>

            {/* Bottom Pattern Image (Decorative Background) */}

        </aside>
    );
}
