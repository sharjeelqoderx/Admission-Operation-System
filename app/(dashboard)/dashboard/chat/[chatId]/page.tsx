"use client"

import React, { useState, useRef, useEffect } from "react"
import {
    Send,
    Paperclip,
    Camera,
    Image as ImageIcon,
    X,
    Smile,
    MoreVertical,
    Phone,
    Video
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Typography } from "@/components/shared/Typography"
import { cn } from "@/lib/utils"

// Mock data for messages
const MOCK_MESSAGES = [
    { id: 1, text: "Hello! I have a question about my application.", sender: "student", time: "10:30 AM" },
    { id: 2, text: "Sure, Ahmed. How can I help you today?", sender: "me", time: "10:32 AM" },
    { id: 3, text: "I uploaded my passport but it says it's pending review. How long does it usually take?", sender: "student", time: "10:33 AM" },
    { id: 4, text: "Usually it takes 24-48 hours. I'll check it for you right now.", sender: "me", time: "10:35 AM" },
]

export default function ChatIdPage({ params }: { params: { chatId: string } }) {
    const [message, setMessage] = useState("")
    const [attachments, setAttachments] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Auto scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [MOCK_MESSAGES])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments([...attachments, ...Array.from(e.target.files)])
        }
    }

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index))
    }

    const handleSend = () => {
        if (!message.trim() && attachments.length === 0) return
        // In a real app, send data to API
        console.log("Sending:", { message, attachments })
        setMessage("")
        setAttachments([])
    }

    return (
        <div className="flex flex-col h-full bg-white/20 relative">
            {/* ── Chat Header ── */}
            <header className="h-[80px] border-b border-gray-100 flex items-center justify-between px-8 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <Avatar className="size-11 border-2 border-brand-byzantine/10 shadow-sm">
                        <AvatarFallback className="bg-brand-byzantine text-white font-bold">A</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <Typography font="heading" className="text-lg font-bold text-gray-900 leading-tight">
                            Ahmed Khan
                        </Typography>
                        <div className="flex items-center gap-1.5">
                            <div className="size-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[11px] font-bold text-green-600 uppercase tracking-wider">Online</span>
                        </div>
                    </div>
                </div>

                {/* <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-brand-byzantine hover:bg-brand-byzantine/5 rounded-xl">
                        <Phone size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-brand-byzantine hover:bg-brand-byzantine/5 rounded-xl">
                        <Video size={20} />
                    </Button>
                    <div className="w-[1px] h-6 bg-gray-100 mx-1" />
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-brand-byzantine hover:bg-brand-byzantine/5 rounded-xl">
                        <MoreVertical size={20} />
                    </Button>
                </div> */}
            </header>

            {/* ── Messages List ── */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                {MOCK_MESSAGES.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex flex-col max-w-[70%] group",
                            msg.sender === "me" ? "ml-auto items-end" : "items-start"
                        )}
                    >
                        <div
                            className={cn(
                                "p-4 rounded-2xl text-[15px] shadow-sm transition-all duration-200",
                                msg.sender === "me"
                                    ? "bg-brand-byzantine text-white rounded-tr-none"
                                    : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                            )}
                        >
                            {msg.text}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest px-1">
                            {msg.time}
                        </span>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* ── Input Area ── */}
            <div className="p-6 bg-white/40 border-t border-gray-100">
                {/* Attachments Preview */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-4 animate-in slide-in-from-bottom-2 duration-300">
                        {attachments.map((file, i) => (
                            <div key={i} className="relative group overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2 flex items-center gap-2 pr-8 shadow-sm">
                                <div className="size-10 bg-brand-byzantine/10 rounded-lg flex items-center justify-center text-brand-byzantine">
                                    {file.type.startsWith("image/") ? <ImageIcon size={20} /> : <Paperclip size={20} />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-gray-700 truncate max-w-[120px]">{file.name}</span>
                                    <span className="text-[9px] text-gray-400 font-medium uppercase">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <button
                                    onClick={() => removeAttachment(i)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-end gap-3 bg-gray-50/80 p-2 rounded-[24px] border border-gray-100 focus-within:border-brand-byzantine/30 focus-within:ring-4 focus-within:ring-brand-byzantine/5 transition-all shadow-sm">
                    <div className="flex items-center pb-1 pl-2">
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-full text-gray-400 hover:text-brand-byzantine hover:bg-white"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip size={20} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-full text-gray-400 hover:text-brand-byzantine hover:bg-white"
                        >
                            <Camera size={20} />
                        </Button>
                    </div>

                    <textarea
                        rows={1}
                        placeholder="Type your message here..."
                        className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-[15px] py-3.5 resize-none max-h-[150px] scrollbar-hide text-gray-800 placeholder:text-gray-400 font-medium"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                    />

                    <div className="flex items-center pb-1 pr-2">
                        {/* <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-10 rounded-full text-gray-400 hover:text-brand-byzantine hover:bg-white mr-1"
                        >
                            <Smile size={20} />
                        </Button> */}
                        <Button
                            className="size-11 rounded-full bg-brand-byzantine hover:bg-brand-byzantine/90 shadow-lg shadow-brand-byzantine/20 transition-all active:scale-95"
                            size="icon"
                            onClick={handleSend}
                        >
                            <Send size={18} className="text-white" />
                        </Button>
                    </div>
                </div>
                {/* <p className="text-[10px] text-gray-400 mt-3 text-center font-bold uppercase tracking-[0.1em]">
                    Press <span className="text-gray-900">Enter</span> to send message
                </p> */}
            </div>
        </div>
    )
}
