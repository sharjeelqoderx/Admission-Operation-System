import { redirect } from "next/navigation"
import { headers } from "next/headers"
import Image from "next/image"
import Link from "next/link"
import {
    Bell,
    Search,
    ChevronDown,
    Menu,
    Mail,
    MapPin,
    Building2
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Typography } from "@/components/shared/Typography"
import { NavContent } from "@/components/shared/NavContent"
import { ViewStudentProfile } from "@/components/ViewStudentProfile"
import { Suspense } from "react"

export default async function ViewStudentPage() {
    const headersList = await headers()
    const cookie = headersList.get("cookie") ?? ""
    const host = headersList.get("host") ?? "localhost:3000"
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http"

    let fullName = "Benson Ronald"
    let role = "Agent"
    let initials = "BR"

    try {
        const res = await fetch(`${protocol}://${host}/api/me`, {
            headers: { cookie },
            cache: "no-store",
        })
        if (res.ok) {
            const { data: user } = await res.json()
            fullName = user.fullName || "Benson Ronald"
            role = user.role || "Agent"
            initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
        }
    } catch (e) {
        console.error("Auth fetch failed, using fallback data for UI rendering.")
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#eef0f8]">
            <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r h-full bg-[#f4f3f7]/95 relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <NavContent />
            </aside>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Seamless Tiled Background (Restricted to Main Content Area) */}
                <div className="absolute top-[72px] inset-x-0 bottom-0 pointer-events-none z-0 bg-[#eef4ff] overflow-hidden">
                    <div 
                        className="absolute inset-0 opacity-[0.12] mix-blend-luminosity"
                        style={{
                            // backgroundImage: `url('/Rectangle 955704.png')`,
                            backgroundRepeat: 'repeat',
                            backgroundSize: '400px auto'
                        }}
                    />
                    <div 
                        className="absolute inset-0 opacity-[0.12] mix-blend-luminosity"
                        style={{
                            // backgroundImage: `url('/Mask group (3).png')`,
                            backgroundRepeat: 'repeat',
                            backgroundSize: '500px auto',
                            backgroundPosition: '100px 100px'
                        }}
                    />
                    <div className="absolute inset-0 bg-blue-400/5 mix-blend-color" />
                </div>

                <header className="h-[72px] shrink-0 flex items-center justify-between px-6 lg:px-10 z-10 relative bg-[#f4f3f7] border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                                    <Menu className="size-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-64 p-0 border-none">
                                <NavContent />
                            </SheetContent>
                        </Sheet>

                        <Typography as="h1" className="text-2xl font-bold text-gray-900 hidden sm:block">
                            Dashboard
                        </Typography>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-2 bg-white rounded-lg px-4 py-2 w-[300px] border border-gray-200">
                            <Search className="size-4 text-gray-400 shrink-0" />
                            <input 
                                placeholder="Search for services" 
                                className="bg-transparent text-sm outline-none w-full placeholder:text-gray-500" 
                            />
                        </div>

                        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-gray-100">
                            <Bell className="size-5 text-gray-700" />
                            <div className="absolute top-2 right-2.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
                        </Button>

                        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-1.5 pr-3 cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="text-right ml-2">
                                <Typography as="p" className="text-sm font-semibold text-gray-900 leading-tight">
                                    {fullName}
                                </Typography>
                                <Typography as="p" className="text-xs text-gray-500 leading-tight">
                                    {role}
                                </Typography>
                            </div>
                            <Avatar className="size-9 border-2 border-white shadow-sm">
                                <AvatarImage src="https://i.pravatar.cc/150?u=benson" alt={fullName} />
                                <AvatarFallback className="bg-brand text-white text-xs">
                                    <Typography as="span" className="text-inherit">
                                        {initials}
                                    </Typography>
                                </AvatarFallback>
                            </Avatar>
                            <ChevronDown className="size-4 text-gray-500 ml-1" />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 lg:p-10 z-10">
                    <div className="max-w-5xl space-y-10 pb-10">
                        <Suspense fallback={<div className="py-10 text-center"><Typography as="p">Loading...</Typography></div>}>
                            <ViewStudentProfile />
                        </Suspense>
                    </div>
                </main>
            </div>
        </div>
    )
}
