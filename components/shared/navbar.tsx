'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, ChevronDown, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface NavbarProps {
    userName?: string;
    userRole?: string;
    userImage?: string;
    onMenuToggle?: () => void;
    isSidebarOpen?: boolean;
}

const getTitleFromPathname = (pathname: string): string => {
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) return 'Dashboard';

    const lastSegment = segments[segments.length - 1];
    
    if (pathname.includes('/dashboard/student/') && segments.length >= 3) {
        if (segments[segments.length - 2] === 'student' || segments.includes('[student-id]')) {
             return 'Student Profile';
        }
    }

    return lastSegment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export function Navbar({
    userName = 'John Doe',
    userRole = 'STUDENT',
    userImage,
    onMenuToggle,
    isSidebarOpen = false,
}: NavbarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();
    const title = getTitleFromPathname(pathname);

    const handleLogout = async () => {
        try {
            await logout.mutateAsync();
            router.push('/login');
            router.refresh();
        } catch (e) {
            console.error('Logout failed');
        }
    };

    return (
        <nav
            className={cn(
                'h-20 bg-background/10 backdrop-blur-md border-b border-border/50',
                'flex items-center justify-between px-4 sm:px-8',
                'sticky top-0 z-40'
            )}
        >
            <div className="flex items-center gap-6">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={onMenuToggle}
                    aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
                >
                    {isSidebarOpen ? (
                        <X className="w-5 h-5" />
                    ) : (
                        <Menu className="w-5 h-5" />
                    )}
                </Button>

                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h1>
            </div>

            <div className="flex items-center gap-4 sm:gap-8">
                <div className="hidden lg:flex relative w-64 xl:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search for services"
                        className="pl-10 pr-4 py-2 h-10 rounded-lg bg-gray-100 border-none text-sm focus-visible:ring-1 focus-visible:ring-purple-400"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative text-gray-600 hover:text-brand-byzantine"
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-brand-byzantine rounded-full" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-14 gap-3 px-4 py-2 border-brand-byzantine rounded-xl hover:bg-brand-byzantine/10 bg-brand-byzantine/5 transition-colors">
                                <div className="hidden sm:flex flex-col items-end">
                                    <span className="text-sm font-bold text-gray-800 leading-tight">{userName}</span>
                                    <span className="text-xs text-brand-byzantine font-medium">{userRole}</span>
                                </div>
                                <Avatar className="w-9 h-9 border-2 border-purple-100">
                                    <AvatarImage src={userImage} alt={userName} />
                                    <AvatarFallback className="bg-brand-byzantine text-white text-xs font-bold">
                                        {userName
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2">
                            <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
                                <span className="font-bold text-gray-800">{userName}</span>
                                <span className="text-xs text-brand-byzantine font-medium">{userRole}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">Agent Profile</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
                                disabled={logout.isPending}
                                onClick={handleLogout}
                            >
                                {logout.isPending ? 'Logging out...' : 'Logout'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    );
}
