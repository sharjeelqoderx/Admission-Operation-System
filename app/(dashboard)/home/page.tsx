import { redirect } from "next/navigation"
import { headers } from "next/headers"
import Image from "next/image"
import {
    LayoutDashboard, Users, FileText, Settings,
    Bell, Search, TrendingUp, GraduationCap,
    ClipboardList, CheckCircle, Clock, ChevronRight,
    BarChart3, Globe, BookOpen
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogoutButton } from "./_component/LogoutButton"

const stats = [
    { label: "Total Applications", value: "1,284", change: "+12%", icon: FileText, color: "bg-brand/10 text-brand" },
    { label: "Active Students", value: "847", change: "+8%", icon: GraduationCap, color: "bg-brand-byzantine/10 text-brand-byzantine" },
    { label: "Pending Reviews", value: "63", change: "-3%", icon: Clock, color: "bg-amber-500/10 text-amber-600" },
    { label: "Approved This Month", value: "219", change: "+21%", icon: CheckCircle, color: "bg-emerald-500/10 text-emerald-600" },
]

const recentApplications = [
    { name: "Ali Hassan", program: "MBA", campus: "Berlin", status: "Approved", avatar: "AH" },
    { name: "Sara Khan", program: "Computer Science", campus: "Hamburg", status: "Pending", avatar: "SK" },
    { name: "John Müller", program: "Business Admin", campus: "Cologne", status: "Under Review", avatar: "JM" },
    { name: "Fatima Noor", program: "Data Science", campus: "Munich", status: "Approved", avatar: "FN" },
    { name: "Usman Tariq", program: "Engineering", campus: "Bielefeld", status: "Rejected", avatar: "UT" },
]

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Users, label: "Students" },
    { icon: FileText, label: "Applications" },
    { icon: GraduationCap, label: "Programs" },
    { icon: Globe, label: "Agents" },
    { icon: BookOpen, label: "Reports" },
    { icon: Settings, label: "Settings" },
]

const statusColor: Record<string, string> = {
    Approved: "bg-emerald-100 text-emerald-700",
    Pending: "bg-amber-100 text-amber-700",
    "Under Review": "bg-blue-100 text-blue-700",
    Rejected: "bg-red-100 text-red-700",
}

export default async function HomePage() {
    const headersList = await headers()
    const cookie = headersList.get("cookie") ?? ""
    const host = headersList.get("host") ?? "localhost:3000"
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http"

    const res = await fetch(`${protocol}://${host}/api/me`, {
        headers: { cookie },
        cache: "no-store",
    })

    if (!res.ok) redirect("/login")

    const { data: user } = await res.json()
    const fullName: string = user.fullName
    const email: string = user.email
    const initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()

    return (
        <div className="flex h-screen overflow-hidden bg-background">

            {/* ── Sidebar ─────────────────────────────────────── */}
            <aside className="w-[220px] shrink-0 flex flex-col bg-brand h-full">
                <div className="px-6 py-5 border-b border-white/10">
                    <Image src="/logo-dark.png" alt="FHM" width={120} height={36} className="brightness-0 invert" />
                </div>

                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {navItems.map(({ icon: Icon, label, active }) => (
                        <button key={label} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
                            <Icon className="size-4 shrink-0" />
                            {label}
                        </button>
                    ))}
                </nav>

                <div className="px-4 py-4 border-t border-white/10 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-brand-byzantine flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-white text-xs font-medium truncate">{fullName}</p>
                            <p className="text-white/50 text-xs truncate">{email}</p>
                        </div>
                    </div>
                    <LogoutButton />
                </div>
            </aside>

            {/* ── Main ────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                <header className="h-14 shrink-0 border-b flex items-center justify-between px-6 bg-background">
                    <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 w-64">
                        <Search className="size-4 text-muted-foreground shrink-0" />
                        <input placeholder="Search..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                            <Bell className="size-4" />
                            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand-byzantine" />
                        </button>
                        <div className="size-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold">
                            {initials}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-hidden p-5 flex flex-col gap-4">

                    <div className="flex items-center justify-between shrink-0">
                        <div>
                            <h1 className="text-lg font-bold">Dashboard</h1>
                            <p className="text-xs text-muted-foreground">Welcome back, {fullName.split(" ")[0]}</p>
                        </div>
                        <button className="flex items-center gap-2 bg-brand text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors">
                            <ClipboardList className="size-3.5" />
                            New Application
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-3 shrink-0">
                        {stats.map(({ label, value, change, icon: Icon, color }) => (
                            <Card key={label} className="py-3">
                                <CardContent className="px-4 flex items-center gap-3">
                                    <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                                        <Icon className="size-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground truncate">{label}</p>
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-lg font-bold leading-tight">{value}</p>
                                            <span className={`text-xs font-medium ${change.startsWith("+") ? "text-emerald-600" : "text-red-500"}`}>{change}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
                        <Card className="col-span-2 flex flex-col min-h-0">
                            <CardHeader className="px-4 py-3 shrink-0 flex-row items-center justify-between">
                                <CardTitle className="text-sm font-semibold">Recent Applications</CardTitle>
                                <button className="text-xs text-brand-byzantine flex items-center gap-0.5 hover:underline">
                                    View all <ChevronRight className="size-3" />
                                </button>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 flex-1 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left text-xs text-muted-foreground font-medium pb-2">Student</th>
                                            <th className="text-left text-xs text-muted-foreground font-medium pb-2">Program</th>
                                            <th className="text-left text-xs text-muted-foreground font-medium pb-2">Campus</th>
                                            <th className="text-left text-xs text-muted-foreground font-medium pb-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {recentApplications.map((app) => (
                                            <tr key={app.name} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-7 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold shrink-0">{app.avatar}</div>
                                                        <span className="font-medium text-xs">{app.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 text-xs text-muted-foreground">{app.program}</td>
                                                <td className="py-2.5 text-xs text-muted-foreground">{app.campus}</td>
                                                <td className="py-2.5">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[app.status]}`}>{app.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-3 min-h-0">
                            <Card className="flex-1">
                                <CardHeader className="px-4 py-3 shrink-0">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <BarChart3 className="size-4 text-brand-byzantine" />
                                        Applications by Campus
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-3 space-y-2.5">
                                    {[
                                        { campus: "Berlin", count: 342, pct: 85 },
                                        { campus: "Hamburg", count: 218, pct: 54 },
                                        { campus: "Munich", count: 196, pct: 49 },
                                        { campus: "Cologne", count: 167, pct: 42 },
                                        { campus: "Bielefeld", count: 89, pct: 22 },
                                    ].map(({ campus, count, pct }) => (
                                        <div key={campus}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-muted-foreground">{campus}</span>
                                                <span className="font-medium">{count}</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-brand-byzantine rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="shrink-0">
                                <CardContent className="px-4 py-3 flex items-center gap-3">
                                    <div className="size-9 rounded-lg bg-brand-byzantine/10 flex items-center justify-center shrink-0">
                                        <TrendingUp className="size-4 text-brand-byzantine" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Acceptance Rate</p>
                                        <p className="text-xl font-bold">68.4%</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
