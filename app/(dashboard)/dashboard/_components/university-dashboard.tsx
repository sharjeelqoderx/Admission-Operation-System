"use client"

import { Typography } from '@/components/shared/Typography';

export function UniversityDashboard() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="space-y-1 max-w-2xl">
                <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                    University Dashboard
                </Typography>
                <Typography as="p" font="sub-text" className="text-gray-500 font-medium max-w-2xl leading-relaxed">
                    Welcome to the University portal.
                </Typography>
            </div>
        </div>
    );
}
