"use client"

import React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import {
    Download,
    Eye,
    Mail,
    Phone,
    User,
    GraduationCap,
    Calendar,
    ArrowLeft,
    FileText
} from "lucide-react"
import Image from "next/image"

export default function OfferDetailsPage() {
    const params = useParams()
    const offerId = params?.["offer-id"] as string

    // Static Data
    const offer = {
        id: offerId || "OFFER-2024-001",
        status: "SIGNED",
        issueDate: "May 10, 2024",
        expiryDate: "June 10, 2024",
        student: {
            name: "John Doe",
            code: "STU-12345",
            email: "john.doe@example.com",
            phone: "+1 (555) 0123",
            nationality: "United States",
            gender: "Male"
        },
        program: {
            name: "Bachelor of Computer Science",
            university: "Global University of Excellence",
            degree: "Bachelor's",
            campus: "Main Campus",
            duration: "4 Years",
            intake: "September 2024"
        }
    }

    return (
        <main className="space-y-8">
            {/* ── Top Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/offer">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="size-5" />
                        </Button>
                    </Link>
                    <div className="space-y-1">
                        <Typography font="small" className="text-gray-500 uppercase tracking-widest">
                            Offer Details
                        </Typography>
                        <div className="flex items-center gap-3">
                            <Typography font="text-xl" as="h1">
                                {offer.id}
                            </Typography>
                            <StatusBadge status={offer.status} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2">
                        <Eye className="size-4" />
                        <Typography font="small" as="span">View Letter</Typography>
                    </Button>
                    <Button className="gap-2 bg-brand-byzantine hover:bg-brand-byzantine/80">
                        <Download className="size-4" />
                        <Typography font="small" as="span">Download PDF</Typography>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Left Column: Details ── */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Student Info */}
                    <BluryCard isCentered={false} blurAmount="backdrop-blur-2xl" childClass="space-y-6" className="rounded-2xl">
                        <div className="flex items-center gap-3 border-b border-white/20 pb-4">
                            <User className="size-5 text-gray-700" />
                            <Typography font="title">Student Information</Typography>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[
                                { label: "Full Name", value: offer.student.name, icon: User },
                                { label: "Student ID", value: offer.student.code, icon: FileText },
                                { label: "Email Address", value: offer.student.email, icon: Mail },
                                { label: "Phone Number", value: offer.student.phone, icon: Phone },
                                { label: "Nationality", value: offer.student.nationality, icon: FileText },
                                { label: "Gender", value: offer.student.gender, icon: User },
                            ].map((item, idx) => (
                                <div key={idx} className="space-y-1">
                                    <Typography font="small" className="text-gray-400 uppercase tracking-wider">
                                        {item.label}
                                    </Typography>
                                    <div className="flex items-center gap-2">
                                        <Typography font="text" className="font-semibold text-gray-800">
                                            {item.value}
                                        </Typography>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </BluryCard>

                    {/* Program Info */}
                    <BluryCard isCentered={false} childClass="space-y-6" className="rounded-2xl">
                        <div className="flex items-center gap-3 border-b border-white/20 pb-4">
                            <GraduationCap className="size-5 text-gray-700" />
                            <Typography font="title">Program Information</Typography>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[
                                { label: "Program Name", value: offer.program.name },
                                { label: "University", value: offer.program.university },
                                { label: "Degree Level", value: offer.program.degree },
                                { label: "Campus", value: offer.program.campus },
                                { label: "Duration", value: offer.program.duration },
                                { label: "Intake", value: offer.program.intake },
                            ].map((item, idx) => (
                                <div key={idx} className="space-y-1">
                                    <Typography font="small" className="text-gray-400 uppercase tracking-wider">
                                        {item.label}
                                    </Typography>
                                    <Typography font="text" className="font-semibold text-gray-800">
                                        {item.value}
                                    </Typography>
                                </div>
                            ))}
                        </div>
                    </BluryCard>
                </div>

                {/* ── Right Column: Offer & Letter Preview ── */}
                <div className="space-y-8">
                    {/* Offer Summary */}
                    <BluryCard isCentered={false} childClass="space-y-6" className="rounded-2xl bg-white/30 border-white/40">
                        <div className="flex items-center gap-3 border-b border-white/20 pb-4">
                            <Calendar className="size-5 text-gray-700" />
                            <Typography font="title">Offer Timeline</Typography>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-xl bg-white/40 border border-white/60">
                                <Typography font="sub-text" className="text-gray-500">Issue Date</Typography>
                                <Typography font="small">{offer.issueDate}</Typography>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-xl bg-red-50/30 border border-red-100/50">
                                <Typography font="sub-text" className="text-gray-500">Expiry Date</Typography>
                                <Typography font="small" className="text-red-600">{offer.expiryDate}</Typography>
                            </div>
                        </div>
                    </BluryCard>

                    {/* Letter Preview Mock */}
                    <div className="space-y-4">
                        <Typography font="title" className="px-1">Offer Letter Preview</Typography>
                        <BluryCard isCentered={false} childClass="p-0!" className="rounded-2xl overflow-hidden shadow-2xl border-white/40">
                            <div className="bg-white p-8 aspect-[1/1.4] flex flex-col space-y-6 text-gray-800 shadow-inner overflow-hidden relative">
                                {/* Watermark or Logo */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none rotate-[-35deg]">
                                    <Typography font="heading" className="text-black scale-[3]">OFFICIAL</Typography>
                                </div>

                                <Image src={"/logo-dark.png"} width={120} height={80} alt="logo" />
                                {/* <div className="border-b-2 border-gray-100 pb-4 flex justify-between items-start">
                                    <div className="space-y-1">
                                        <Typography font="small" className="text-[#9B51E0]">OFFER OF ADMISSION</Typography>
                                        <Typography font="sub-text" className="font-bold">{offer.program.university}</Typography>
                                    </div>
                                    <Typography font="small" className="text-gray-400">{offer.issueDate}</Typography>
                                </div> */}

                                <div className="space-y-4">
                                    <Typography font="sub-text">Dear <span className="font-bold">{offer.student.name}</span>,</Typography>
                                    <Typography font="small" className="leading-relaxed text-gray-600 font-light">
                                        We are pleased to offer you admission to the <span className="font-bold">{offer.program.name}</span> at our <span className="font-bold">{offer.program.campus}</span> for the <span className="font-bold">{offer.program.intake}</span> intake.
                                    </Typography>
                                    <Typography font="small" className="leading-relaxed text-gray-600 font-light">
                                        Your academic achievement and potential make you an excellent candidate for our program. This offer is subject to the terms and conditions outlined in the full admission package.
                                    </Typography>
                                </div>

                                {/* <div className="mt-auto space-y-4 pt-6 border-t border-gray-100">
                                    <div className="flex justify-between text-[10px] text-gray-400">
                                        <span>Reference: {offer.id}</span>
                                        <span>Page 1 of 3</span>
                                    </div>
                                </div> */}
                            </div>

                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <Button variant="secondary" className="rounded-full shadow-lg">
                                    <Eye className="size-4 mr-2" /> View
                                </Button>
                                <Button variant="secondary" className="rounded-full shadow-lg">
                                    <Download className="size-4 mr-2" /> PDF
                                </Button>
                            </div>
                        </BluryCard>
                    </div>
                </div>
            </div>
        </main>
    )
}
