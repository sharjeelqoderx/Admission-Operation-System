'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarGroupProps {
    icon: ReactNode;
    label: string;
    children: ReactNode;
    defaultOpen?: boolean;
}

export function SidebarGroup({
    icon,
    label,
    children,
    defaultOpen = false,
}: SidebarGroupProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={cn("relative transition-all duration-300 bg-white/40", isOpen && "text-white bg-brand-byzantine")}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'w-full flex items-center gap-3 px-6 py-2 transition-all duration-200',
                    'text-[14px] font-semibold cursor-pointer',
                    isOpen ? 'text-white border-transparent' : 'text-[#333]'
                )}
            >
                <span className="w-6 h-6 flex items-center justify-center opacity-80">{icon}</span>
                <span className="flex-1 text-left">{label}</span>
                <ChevronDown
                    className={cn('w-4 h-4 transition-transform duration-200 opacity-60', isOpen && 'rotate-180 opacity-100')}
                />
            </button>

            {isOpen && (
                <div className="animate-in slide-in-from-top-1 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}
