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
        <div className="space-y-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    'text-foreground hover:bg-brand-byzantine/20 hover:text-accent-foreground',
                    'text-sm font-medium cursor-pointer',
                    isOpen && 'bg-brand-byzantine/20'
                )}
            >
                <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
                <span className="flex-1 text-left">{label}</span>
                <ChevronDown
                    className={cn('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180')}
                />
            </button>

            {isOpen && (
                <div className="pl-4 space-y-2 animate-in fade-in duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}
