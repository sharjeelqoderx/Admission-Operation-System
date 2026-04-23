// import { redirect } from "next/navigation"
// import { headers } from "next/headers"
// import Image from "next/image"
// import {
//     LayoutDashboard, Users, FileText, Settings,
//     Bell, Search, TrendingUp, GraduationCap,
//     ClipboardList, CheckCircle, Clock, ChevronRight,
//     BarChart3, Globe, BookOpen, Menu
// } from "lucide-react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Avatar, AvatarFallback } from "@/components/ui/avatar"
// import { Button } from "@/components/ui/button"
// import { Separator } from "@/components/ui/separator"
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
// import { LogoutButton } from "./_component/LogoutButton"

// const stats = [
//     { label: "Total Applications", value: "1,284", change: "+12%", up: true, icon: FileText },
//     { label: "Active Students", value: "847", change: "+8%", up: true, icon: GraduationCap },
//     { label: "Pending Reviews", value: "63", change: "-3%", up: false, icon: Clock },
//     { label: "Approved This Month", value: "219", change: "+21%", up: true, icon: CheckCircle },
// ]

// const recentApplications = [
//     { name: "Ali Hassan", program: "MBA", campus: "Berlin", status: "Approved", initials: "AH" },
//     { name: "Sara Khan", program: "Computer Science", campus: "Hamburg", status: "Pending", initials: "SK" },
//     { name: "John Müller", program: "Business Admin", campus: "Cologne", status: "Under Review", initials: "JM" },
//     { name: "Fatima Noor", program: "Data Science", campus: "Munich", status: "Approved", initials: "FN" },
//     { name: "Usman Tariq", program: "Engineering", campus: "Bielefeld", status: "Rejected", initials: "UT" },
// ]

// const campusData = [
//     { campus: "Berlin", count: 342, pct: 85 },
//     { campus: "Hamburg", count: 218, pct: 54 },
//     { campus: "Munich", count: 196, pct: 49 },
//     { campus: "Cologne", count: 167, pct: 42 },
//     { campus: "Bielefeld", count: 89, pct: 22 },
// ]

// const navItems = [
//     { icon: LayoutDashboard, label: "Dashboard", active: true },
//     { icon: Users, label: "Students" },
//     { icon: FileText, label: "Applications" },
//     { icon: GraduationCap, label: "Programs" },
//     { icon: Globe, label: "Agents" },
//     { icon: BookOpen, label: "Reports" },
//     { icon: Settings, label: "Settings" },
// ]

// const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
//     Approved: "default",
//     Pending: "secondary",
//     "Under Review": "outline",
//     Rejected: "destructive",
// }

// function NavContent({ fullName, email, initials }: { fullName: string; email: string; initials: string }) {
//     return (
//         <div className="flex flex-col h-full">
//             <div className="px-6 py-5">
//                 <Image src="/logo-dark.png" alt="FHM" width={110} height={32} className="brightness-0 invert" />
//             </div>
//             <Separator className="bg-white/10" />
//             <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
//                 {navItems.map(({ icon: Icon, label, active }) => (
//                     <button key={label} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
//                         <Icon className="size-4 shrink-0" />
//                         {label}
//                     </button>
//                 ))}
//             </nav>
//             <Separator className="bg-white/10" />
//             <div className="px-4 py-4 space-y-3">
//                 <div className="flex items-center gap-3 min-w-0">
//                     <Avatar className="size-8 shrink-0">
//                         <AvatarFallback className="bg-brand-byzantine text-white text-xs">{initials}</AvatarFallback>
//                     </Avatar>
//                     <div className="min-w-0">
//                         <p className="text-white text-xs font-medium truncate">{fullName}</p>
//                         <p className="text-white/50 text-xs truncate">{email}</p>
//                     </div>
//                 </div>
//                 <LogoutButton />
//             </div>
//         </div>
//     )
// }

// export default async function HomePage() {
//     const headersList = await headers()
//     const cookie = headersList.get("cookie") ?? ""
//     const host = headersList.get("host") ?? "localhost:3000"
//     const protocol = process.env.NODE_ENV === "production" ? "https" : "http"

//     const res = await fetch(`${protocol}://${host}/api/me`, {
//         headers: { cookie },
//         cache: "no-store",
//     })

//     if (!res.ok) redirect("/login")

//     const { data: user } = await res.json()
//     const fullName: string = user.fullName
//     const email: string = user.email
//     const initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()

//     return (
//         <div className="flex h-screen overflow-hidden bg-background">

//             {/* ── Desktop Sidebar ──────────────────────────────── */}
//             <aside className="hidden lg:flex w-56 xl:w-60 shrink-0 flex-col bg-brand h-full">
//                 <NavContent fullName={fullName} email={email} initials={initials} />
//             </aside>

//             {/* ── Main ─────────────────────────────────────────── */}
//             <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

//                 {/* Topbar */}
//                 <header className="h-14 shrink-0 border-b flex items-center justify-between px-4 md:px-6 bg-background gap-4">
//                     <div className="flex items-center gap-3">
//                         {/* Mobile menu */}
//                         <Sheet>
//                             <SheetTrigger asChild>
//                                 <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
//                                     <Menu className="size-5" />
//                                 </Button>
//                             </SheetTrigger>
//                             <SheetContent side="left" className="w-56 p-0 bg-brand border-none">
//                                 <NavContent fullName={fullName} email={email} initials={initials} />
//                             </SheetContent>
//                         </Sheet>

//                         <div className="hidden sm:flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 w-52 md:w-64">
//                             <Search className="size-4 text-muted-foreground shrink-0" />
//                             <input placeholder="Search..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
//                         </div>
//                     </div>

//                     <div className="flex items-center gap-2">
//                         <Button variant="ghost" size="icon" className="relative">
//                             <Bell className="size-4" />
//                             <span className="absolute top-2 right-2 size-1.5 rounded-full bg-brand-byzantine" />
//                         </Button>
//                         <Avatar className="size-8">
//                             <AvatarFallback className="bg-brand text-white text-xs">{initials}</AvatarFallback>
//                         </Avatar>
//                     </div>
//                 </header>

//                 {/* Content */}
//                 <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

//                     {/* Page header */}
//                     <div className="flex items-center justify-between">
//                         <div>
//                             <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
//                             <p className="text-sm text-muted-foreground">Welcome back, {fullName.split(" ")[0]}</p>
//                         </div>
//                         <Button size="sm" className="gap-2 bg-brand hover:bg-brand/90">
//                             <ClipboardList className="size-4" />
//                             <span className="hidden sm:inline">New Application</span>
//                         </Button>
//                     </div>

//                     {/* Stats */}
//                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//                         {stats.map(({ label, value, change, up, icon: Icon }) => (
//                             <Card key={label}>
//                                 <CardContent className="p-4 md:p-5">
//                                     <div className="flex items-center justify-between mb-3">
//                                         <p className="text-xs text-muted-foreground font-medium">{label}</p>
//                                         <Icon className="size-4 text-muted-foreground" />
//                                     </div>
//                                     <p className="text-2xl font-bold tracking-tight">{value}</p>
//                                     <p className={`text-xs mt-1 font-medium ${up ? "text-emerald-600" : "text-red-500"}`}>
//                                         {change} from last month
//                                     </p>
//                                 </CardContent>
//                             </Card>
//                         ))}
//                     </div>

//                     {/* Bottom grid */}
//                     <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

//                         {/* Recent Applications */}
//                         <Card className="xl:col-span-2">
//                             <CardHeader className="px-5 py-4 flex-row items-center justify-between space-y-0">
//                                 <CardTitle className="text-sm font-semibold">Recent Applications</CardTitle>
//                                 <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-auto p-0 hover:bg-transparent hover:text-brand-byzantine">
//                                     View all <ChevronRight className="size-3" />
//                                 </Button>
//                             </CardHeader>
//                             <CardContent className="px-5 pb-4">
//                                 <div className="space-y-1">
//                                     {/* Header row */}
//                                     <div className="grid grid-cols-4 pb-2 border-b">
//                                         {["Student", "Program", "Campus", "Status"].map(h => (
//                                             <p key={h} className="text-xs text-muted-foreground font-medium">{h}</p>
//                                         ))}
//                                     </div>
//                                     {recentApplications.map((app) => (
//                                         <div key={app.name} className="grid grid-cols-4 py-2.5 items-center hover:bg-muted/30 rounded-md transition-colors -mx-2 px-2">
//                                             <div className="flex items-center gap-2 min-w-0">
//                                                 <Avatar className="size-7 shrink-0">
//                                                     <AvatarFallback className="text-xs bg-muted">{app.initials}</AvatarFallback>
//                                                 </Avatar>
//                                                 <span className="text-xs font-medium truncate">{app.name}</span>
//                                             </div>
//                                             <p className="text-xs text-muted-foreground truncate">{app.program}</p>
//                                             <p className="text-xs text-muted-foreground">{app.campus}</p>
//                                             <Badge variant={statusVariant[app.status]} className="text-xs w-fit">
//                                                 {app.status}
//                                             </Badge>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </CardContent>
//                         </Card>

//                         {/* Right column */}
//                         <div className="space-y-4">
//                             {/* Campus breakdown */}
//                             <Card>
//                                 <CardHeader className="px-5 py-4 space-y-0">
//                                     <CardTitle className="text-sm font-semibold flex items-center gap-2">
//                                         <BarChart3 className="size-4 text-muted-foreground" />
//                                         By Campus
//                                     </CardTitle>
//                                 </CardHeader>
//                                 <CardContent className="px-5 pb-4 space-y-3">
//                                     {campusData.map(({ campus, count, pct }) => (
//                                         <div key={campus}>
//                                             <div className="flex justify-between text-xs mb-1.5">
//                                                 <span className="text-muted-foreground">{campus}</span>
//                                                 <span className="font-medium tabular-nums">{count}</span>
//                                             </div>
//                                             <div className="h-1.5 bg-muted rounded-full overflow-hidden">
//                                                 <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${pct}%` }} />
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </CardContent>
//                             </Card>

//                             {/* Acceptance rate */}
//                             <Card>
//                                 <CardContent className="p-5 flex items-center gap-4">
//                                     <div className="size-10 rounded-lg bg-brand-byzantine/10 flex items-center justify-center shrink-0">
//                                         <TrendingUp className="size-5 text-brand-byzantine" />
//                                     </div>
//                                     <div>
//                                         <p className="text-xs text-muted-foreground">Acceptance Rate</p>
//                                         <p className="text-2xl font-bold tracking-tight">68.4%</p>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         </div>
//                     </div>
//                 </main>
//             </div>
//         </div>
//     )
// }import { Construction, Home } from "lucide-react"


import { Construction, Home } from "lucide-react"
import { LogoutButton } from "./_component/LogoutButton"

export default function HomeUnderDevelopment() {
    return (
        <div className="flex flex-col items-center justify-center text-center h-full min-h-[60vh] px-4">

            {/* Icon */}
            <div className="size-16 rounded-full bg-brand/10 flex items-center justify-center mb-4">
                <Home className="size-6 text-brand mr-1" />
                <Construction className="size-6 text-brand" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold tracking-tight">
                Home Page Under Development
            </h2>

            {/* Description */}
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                Welcome! This is your home dashboard, and it's currently under development.
                We're working to bring you a better experience soon.
            </p>

            {/* Logout */}
            <div className="mt-6">
                <LogoutButton />
            </div>
        </div>
    )
}