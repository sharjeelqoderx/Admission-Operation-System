"use client"

import React, { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Search, MoreVertical, MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Typography } from "@/components/shared/Typography"
import { cn } from "@/lib/utils"

// Mock data for static UI
const MOCK_USERS = [
    { id: "1", name: "Ahmed Khan", studentCode: "STU-2024-001", lastMessage: "Can I get an update on my application?", time: "10:30 AM", avatar: "" },
    { id: "2", name: "Sara Wilson", studentCode: "STU-2024-002", lastMessage: "Thank you for the help!", time: "Yesterday", avatar: "" },
    { id: "3", name: "John Doe", studentCode: "STU-2024-003", lastMessage: "Sent the documents.", time: "2 days ago", avatar: "" },
    { id: "4", name: "Maria Garcia", studentCode: "STU-2024-004", lastMessage: "When is the deadline?", time: "3 days ago", avatar: "" },
    { id: "5", name: "David Chen", studentCode: "STU-2024-005", lastMessage: "I need assistance with my visa.", time: "1 week ago", avatar: "" },
]

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [searchQuery, setSearchQuery] = useState("")

    const filteredUsers = MOCK_USERS.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.studentCode.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex h-[calc(100vh-140px)] rounded-3xl overflow-hidden border border-gray-200 shadow-xl m-1">
            {/* ── Left Sidebar ── */}
            <div className="w-[380px] border-r border-gray-100 flex flex-col bg-white/60">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-gray-50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Typography as="h2" font="heading" className="text-2xl font-bold">
                                Messages
                            </Typography>
                            <span className="bg-brand-byzantine/10 text-brand-byzantine px-2.5 py-0.5 rounded-full text-xs font-bold">
                                {MOCK_USERS.length}
                            </span>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <MoreVertical size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Search chats..."
                            className="pl-10 h-11 bg-gray-50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-brand-byzantine/20 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredUsers.map((user) => {
                        const isActive = pathname.includes(`/chat/${user.id}`)
                        return (
                            <Link
                                key={user.id}
                                href={`/dashboard/chat/${user.id}`}
                                className={cn(
                                    "flex items-center gap-4 p-4 mx-3 my-1 rounded-2xl transition-all duration-200 hover:bg-gray-50 group",
                                    isActive && "bg-brand-byzantine/5 hover:bg-brand-byzantine/5 border border-brand-byzantine/10"
                                )}
                            >
                                <div className="relative">
                                    <Avatar className="size-12 border-2 border-white shadow-sm">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback className="bg-brand-byzantine text-white font-bold">
                                            {user.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute bottom-0 right-0 size-3.5 bg-green-500 border-2 border-white rounded-full" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <Typography font="text" className="font-bold text-[15px] truncate text-gray-900">
                                            {user.name}
                                        </Typography>
                                        <span className="text-[11px] text-gray-400 font-medium">
                                            {user.time}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[11px] font-bold text-brand-byzantine/70 tracking-wider">
                                                {user.studentCode}
                                            </span>
                                            <p className="text-[13px] text-gray-500 truncate pr-2">
                                                {user.lastMessage}
                                            </p>
                                        </div>
                                        {isActive && (
                                            <div className="size-2 bg-brand-byzantine rounded-full" />
                                        )}
                                    </div>
                                </div>
                            </Link>
                        )
                    })}

                    {filteredUsers.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 h-full">
                            <Search size={40} className="mb-3 opacity-20" />
                            <p className="text-sm font-medium">No messages found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Main Chat Area ── */}
            <main className="flex-1 overflow-hidden relative">
                {children}
            </main>
        </div>
    )
}
