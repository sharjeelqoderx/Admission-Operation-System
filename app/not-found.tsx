"use client";

import Link from "next/link";
import { MoveLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/shared/Typography";
import { BluryCard } from "@/components/shared/blury-card";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#f0f4ff] relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-byzantine/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />

            <div className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in duration-500">
                <BluryCard 
                    isCentered={true} 
                    className="p-8 md:p-12 border-white/40 shadow-2xl"
                    blurAmount="backdrop-blur-xl"
                >
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="size-20 rounded-2xl bg-brand-byzantine/10 flex items-center justify-center mb-2">
                            <FileQuestion className="size-10 text-brand-byzantine" />
                        </div>
                        
                        <div className="space-y-2">
                            <Typography as="h1" className="text-[64px] font-black text-brand-byzantine leading-none tracking-tighter">
                                404
                            </Typography>
                            <Typography as="h2" font="sub-heading" className="text-gray-900">
                                Page Not Found
                            </Typography>
                        </div>

                        <Typography as="p" className="text-gray-500 max-w-[280px]">
                            The page you are looking for doesn't exist or has been moved to a new location.
                        </Typography>

                        <div className="pt-4 w-full">
                            <Link href="/dashboard" className="block w-full">
                                <Button className="w-full h-12 gap-2 bg-[#0a1e42] hover:bg-[#0a1e42]/90 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
                                    <MoveLeft className="size-4" />
                                    Back to Dashboard
                                </Button>
                            </Link>
                        </div>
                    </div>
                </BluryCard>
            </div>
        </div>
    );
}
