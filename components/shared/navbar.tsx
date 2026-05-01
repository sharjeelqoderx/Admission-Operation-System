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

    return segments[segments.length - 1]
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
                'h-16 bg-background border-b border-border',
                'flex items-center justify-between px-4 sm:px-6',
                'sticky top-0 z-40'
            )}
        >
            <div className="flex items-center gap-4">
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

                <h1 className="text-lg sm:text-xl font-semibold truncate">{title}</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                {/* <div className="hidden lg:block relative w-48 xl:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 rounded-lg bg-accent text-sm"
                    />
                </div> */}

                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="Notifications"
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-2 pl-1 sm:pl-2 pr-2 sm:pr-3">
                            <div className="hidden sm:flex flex-col items-start">
                                <span className="text-xs sm:text-sm font-medium">{userName}</span>
                                <span className="text-xs text-muted-foreground">{userRole}</span>
                            </div>
                            <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                                <AvatarImage src={userImage} alt={userName} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                                    {userName
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')}
                                </AvatarFallback>
                            </Avatar>
                            <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
                            <span className="font-medium">{userName}</span>
                            <span className="text-xs capitalize text-muted-foreground">{userRole.toLowerCase().replace(' ', '_')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600"
                            disabled={logout.isPending}
                            onClick={handleLogout}
                        >
                            {logout.isPending ? 'Logging out...' : 'Logout'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    );
}
