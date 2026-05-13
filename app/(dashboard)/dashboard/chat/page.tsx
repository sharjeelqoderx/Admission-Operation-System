"use client"

import { MessageSquare } from "lucide-react"
import { Typography } from "@/components/shared/Typography"

export default function ChatPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="size-20 bg-brand-byzantine/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <MessageSquare size={36} className="text-brand-byzantine" />
            </div>
            <Typography as="h2" font="heading" className="text-2xl font-bold mb-2">
                Your Messages
            </Typography>
            <Typography font="text" className="text-gray-500 max-w-sm">
                Select a student from the left to view the conversation and share updates.
            </Typography>
        </div>
    )
}
