"use client";

import { useState } from "react";
import { Typography } from "@/components/shared/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, CheckSquare, Square, FileText, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreateApplicationForm() {
    const [step, setStep] = useState(1);

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="space-y-2">
                <Typography as="h1" className="text-[32px] font-extrabold text-[#0a1e42] tracking-tight">
                    {step === 1 ? "Create Application" : "Choose Your Path"}
                </Typography>
                <Typography as="p" className="text-[13px] font-medium text-gray-500 leading-relaxed max-w-2xl">
                    {step === 1 
                        ? "Initiate a new student application and link them to global academic programs.\nEnsure all mandatory fields are verified before submission." 
                        : "Select the academic program that aligns with your professional aspirations. Browse\nour curated selection of undergraduate and graduate degrees."}
                </Typography>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between relative max-w-3xl pt-4 pb-8">
                {/* Connecting Lines */}
                <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
                <div 
                    className="absolute top-8 left-0 h-0.5 bg-[#0a1e42] -z-10 transition-all duration-300"
                    style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                />

                {/* Step 1 */}
                <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                        "size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                        step >= 1 ? "bg-[#0a1e42] text-white" : "bg-[#e2e8f0] text-gray-500"
                    )}>
                        1
                    </div>
                    <span className="text-[10px] font-bold tracking-widest text-[#0a1e42] uppercase">Student Profile</span>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                        "size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                        step >= 2 ? "bg-[#0a1e42] text-white" : "bg-[#e2e8f0] text-gray-500"
                    )}>
                        2
                    </div>
                    <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Program Selection</span>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                        "size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                        step >= 3 ? "bg-[#0a1e42] text-white" : "bg-[#e2e8f0] text-gray-500"
                    )}>
                        3
                    </div>
                    <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Review & Submit</span>
                </div>
            </div>

            {/* Content Area */}
            {step === 1 && <Step1 setStep={setStep} />}
            {step === 2 && <Step2 setStep={setStep} />}
            {step === 3 && <Step3 setStep={setStep} />}
        </div>
    );
}

function Step1({ setStep }: { setStep: (s: number) => void }) {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Typography as="h3" className="text-[16px] font-extrabold text-[#0a1e42]">Select Student</Typography>
                <div className="bg-white/40 backdrop-blur-md rounded-xl border border-white/60 p-1 shadow-sm">
                    <Input placeholder="Enter Student ID" className="border-0 bg-transparent h-12 focus-visible:ring-0 text-sm" />
                </div>
            </div>

            <div className="space-y-4">
                <Typography as="h3" className="text-[16px] font-extrabold text-[#0a1e42]">Personal Information</Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
                        <div className="bg-white/40 backdrop-blur-md rounded-xl border border-white/60 shadow-sm">
                            <Input placeholder="e.g. Elena Rodriguez" className="border-0 bg-transparent h-11 text-sm" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                        <div className="bg-white/40 backdrop-blur-md rounded-xl border border-white/60 shadow-sm">
                            <Input placeholder="student@example.com" className="border-0 bg-transparent h-11 text-sm" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nationality</label>
                        <div className="relative bg-white/40 backdrop-blur-md rounded-xl border border-white/60 shadow-sm">
                            <select className="w-full h-11 px-4 appearance-none bg-transparent border-0 text-sm outline-none">
                                <option>Spain</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date of Birth</label>
                        <div className="bg-white/40 backdrop-blur-md rounded-xl border border-white/60 shadow-sm">
                            <Input type="date" className="border-0 bg-transparent h-11 text-sm" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-6 space-y-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="size-5 text-blue-600" />
                        <Typography as="h3" className="text-[16px] font-extrabold text-[#0a1e42]">Supporting Documents</Typography>
                    </div>
                    <button className="text-[12px] font-bold text-[#0a1e42] hover:underline">Manage All</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { title: "Undergrad_Transcript...", sub: "OFFICIAL DOCUMENT", checked: true },
                        { title: "CV_Academic_2024.pdf", sub: "PERSONAL STATEMENT", checked: false },
                        { title: "Passport_Julian_S.jpg", sub: "IDENTIFICATION", checked: true },
                        { title: "Recommendation_Prof...", sub: "REFERENCE", checked: false },
                    ].map((doc, i) => (
                        <div key={i} className="bg-[#f8f9fc] rounded-xl p-3 space-y-3 relative border border-gray-100 group hover:border-gray-300 transition-colors cursor-pointer">
                            <div className="absolute top-3 left-3 z-10">
                                {doc.checked ? <CheckSquare className="size-4 text-green-500" /> : <Square className="size-4 text-[#0a1e42]/30" />}
                            </div>
                            <div className="aspect-square bg-gray-400/20 rounded-lg flex items-center justify-center p-4">
                                <div className="w-full h-full bg-gray-500/10 rounded shadow-sm border border-gray-200/50" />
                            </div>
                            <div>
                                <Typography as="p" className="text-[11px] font-bold text-gray-900 truncate">{doc.title}</Typography>
                                <Typography as="p" className="text-[8px] font-bold tracking-widest text-gray-500 uppercase mt-1">{doc.sub}</Typography>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-200/50">
                <Button variant="outline" className="h-12 px-8 border-gray-300 text-[#0a1e42] font-bold rounded-xl">Save as Draft</Button>
                <Button onClick={() => setStep(2)} className="h-12 px-8 bg-[#0a1e42] hover:bg-[#0a1e42]/90 text-white font-bold rounded-xl shadow-lg">Next Step: Program Selection</Button>
            </div>
        </div>
    );
}

function Step2({ setStep }: { setStep: (s: number) => void }) {
    const programs = [
        { name: "MSc Global Business Management", intake: "Fall 2024 Intake", fee: "€522.00", status: "SELECT PROGRAM", date: "Oct 12, 2023" },
        { name: "BA International Relations", intake: "Spring 2024 Intake", fee: "€522.00", status: "SELECTED", date: "Oct 10, 2023" },
        { name: "PhD Artificial Intelligence", intake: "Fall 2024 Intake", fee: "€522.00", status: "SELECT PROGRAM", date: "Oct 09, 2023" },
        { name: "LLM Corporate Law", intake: "Fall 2024 Intake", fee: "€522.00", status: "SELECT PROGRAM", date: "Oct 05, 2023" },
        { name: "BEng Civil Engineering", intake: "Fall 2024 Intake", fee: "€522.00", status: "SELECT PROGRAM", date: "Oct 02, 2023" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="relative bg-white rounded-xl shadow-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input placeholder="Search programs by name or keywords..." className="border-0 bg-transparent h-12 pl-10 text-sm focus-visible:ring-0" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Programs</label>
                            <div className="relative bg-white rounded-xl shadow-sm">
                                <select className="w-full h-11 px-4 appearance-none bg-transparent border-0 text-sm outline-none font-bold text-gray-700">
                                    <option>All Programs</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Semester Fee</label>
                            <div className="relative bg-white rounded-xl shadow-sm">
                                <select className="w-full h-11 px-4 appearance-none bg-transparent border-0 text-sm outline-none font-bold text-gray-700">
                                    <option>€522.00</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Last Date For Submission</label>
                            <div className="relative bg-white rounded-xl shadow-sm">
                                <select className="w-full h-11 px-4 appearance-none bg-transparent border-0 text-sm outline-none font-bold text-gray-700">
                                    <option>Oct 2024</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-80 bg-black/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <Typography as="h3" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Selected Student</Typography>
                    <div className="flex gap-4">
                        <div className="size-16 rounded-2xl bg-orange-500 border-2 border-white shadow-md overflow-hidden shrink-0">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Julian" alt="Julian" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                                <span className="text-gray-500">Nationality</span>
                                <span className="font-bold text-[#0a1e42]">British</span>
                                <span className="text-gray-500 mt-1">Education</span>
                                <span className="font-bold text-[#0a1e42] mt-1 leading-tight">BSc<br/>Economics</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Typography as="h4" className="text-[16px] font-bold text-[#0a1e42]">Julian Thorne</Typography>
                        <Typography as="p" className="text-[11px] text-gray-500 font-bold mt-0.5">ID: 2024-8842</Typography>
                    </div>
                </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/30 rounded-[24px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-gray-500 uppercase">Program</th>
                                <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-gray-500 uppercase">Semester Fees</th>
                                <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-gray-500 uppercase">Status</th>
                                <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-gray-500 uppercase">Last Date</th>
                                <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {programs.map((p, i) => (
                                <tr key={i} className="hover:bg-white/20 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <Typography as="span" className="text-[13px] font-bold text-gray-900 leading-snug">{p.name}</Typography>
                                            <Typography as="span" className="text-[10px] text-gray-500 font-medium mt-0.5">{p.intake}</Typography>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Typography as="span" className="text-[13px] font-bold text-gray-700">{p.fee}</Typography>
                                    </td>
                                    <td className="px-8 py-6">
                                        <button className={cn(
                                            "h-7 px-4 rounded-full text-[9px] font-bold tracking-widest uppercase transition-colors",
                                            p.status === "SELECTED" ? "bg-[#0a1e42] text-white" : "bg-blue-500 text-white hover:bg-blue-600"
                                        )}>
                                            {p.status}
                                        </button>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Typography as="span" className="text-[12px] font-medium text-gray-600">{p.date}</Typography>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Button variant="outline" className="h-8 px-5 bg-white/40 border-white/60 text-[#0a1e42] hover:bg-white/60 rounded-lg font-bold text-[11px] transition-all shadow-sm">
                                            View
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between px-8 py-4 border-t border-white/20">
                    <div className="text-[11px] text-gray-500">
                        Showing <span className="font-bold text-[#0a1e42]">5</span> of <span className="font-bold text-[#0a1e42]">1,284</span> entries
                    </div>
                    <div className="flex gap-2">
                        <button className="size-7 rounded bg-white/40 hover:bg-white/60 flex items-center justify-center text-gray-600"><ChevronLeft className="size-4" /></button>
                        <button className="size-7 rounded bg-white/40 hover:bg-white/60 flex items-center justify-center text-gray-600"><ChevronRight className="size-4" /></button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={() => setStep(3)} className="h-12 px-10 bg-[#0a1e42] hover:bg-[#0a1e42]/90 text-white font-bold rounded-xl shadow-lg">Next step: Finalize</Button>
            </div>
        </div>
    );
}

function Step3({ setStep }: { setStep: (s: number) => void }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <GraduationCap className="size-5 text-[#0a1e42]" />
                        <Typography as="h3" className="text-[16px] font-extrabold text-[#0a1e42]">Selected Program Details</Typography>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between gap-6">
                        <div className="space-y-1">
                            <Typography as="h4" className="text-[18px] font-extrabold text-gray-900 leading-tight">Ph.D. in Computational<br/>Neuroscience</Typography>
                            <Typography as="p" className="text-[11px] text-gray-500 leading-relaxed">Focus Area: Neural Network Modeling<br/>& Plasticity</Typography>
                        </div>
                        <div className="space-y-1.5 w-full sm:w-64">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Academic Session</label>
                            <div className="relative bg-[#f8f9fc] rounded-xl border border-gray-200">
                                <div className="px-4 py-2">
                                    <Typography as="p" className="text-[13px] font-bold text-gray-900">Fall 2024 Semester</Typography>
                                    <Typography as="p" className="text-[10px] text-gray-500">Full-Time Residency Required</Typography>
                                </div>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="size-6 rounded-md bg-[#0a1e42]/5 flex items-center justify-center">
                            <svg className="size-3.5 text-[#0a1e42]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <Typography as="h3" className="text-[15px] font-extrabold text-[#0a1e42]">Student Info</Typography>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <Typography as="p" className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Full Name</Typography>
                            <Typography as="p" className="text-[13px] font-bold text-gray-900 mt-0.5">Julian A. Sterling</Typography>
                        </div>
                        <div>
                            <Typography as="p" className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Email Address</Typography>
                            <Typography as="p" className="text-[13px] font-bold text-gray-900 mt-0.5">j.sterling@example.edu</Typography>
                        </div>
                        <div>
                            <Typography as="p" className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Nationality</Typography>
                            <Typography as="p" className="text-[13px] font-bold text-gray-900 mt-0.5">Canada</Typography>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <FileText className="size-5 text-blue-600" />
                        <Typography as="h3" className="text-[16px] font-extrabold text-[#0a1e42]">Supporting Documents</Typography>
                    </div>
                    <button className="text-[12px] font-bold text-[#0a1e42] hover:underline">Manage All</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { title: "Undergrad_Transcript...", sub: "OFFICIAL DOCUMENT" },
                        { title: "Passport_Julian_S.jpg", sub: "IDENTIFICATION" },
                    ].map((doc, i) => (
                        <div key={i} className="bg-[#f8f9fc] rounded-xl p-3 space-y-3 border border-gray-100">
                            <div className="aspect-square bg-gray-400/20 rounded-lg flex items-center justify-center p-4">
                                <div className="w-full h-full bg-gray-500/10 rounded shadow-sm border border-gray-200/50" />
                            </div>
                            <div>
                                <Typography as="p" className="text-[11px] font-bold text-gray-900 truncate">{doc.title}</Typography>
                                <Typography as="p" className="text-[8px] font-bold tracking-widest text-gray-500 uppercase mt-1">{doc.sub}</Typography>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <div className="size-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <CheckSquare className="size-3.5 text-blue-600" />
                    </div>
                    <Typography as="h3" className="text-[16px] font-extrabold text-[#0a1e42]">Final Declarations</Typography>
                </div>
                <div className="space-y-4">
                    {[
                        "I confirm that all information provided in this application is true, complete, and accurate to the best of my knowledge. I understand that misrepresentation may lead to rejection.",
                        "I authorize Academic Portal to verify my academic credentials and contact the listed references for the purposes of this application.",
                        "I have read and agree to the Institutional Data Privacy Policy and Terms of Enrollment for the Fall 2024 Cycle."
                    ].map((text, i) => (
                        <div key={i} className="flex gap-3 items-start">
                            <div className="mt-0.5">
                                <div className="size-4 rounded border border-gray-300 bg-white shadow-sm flex items-center justify-center cursor-pointer hover:border-blue-400">
                                    {/* <CheckSquare className="size-3 text-blue-500" /> */}
                                </div>
                            </div>
                            <Typography as="p" className="text-[12px] text-gray-600 leading-relaxed pt-0.5">{text}</Typography>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button className="h-12 px-10 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all">Send Your Application</Button>
            </div>
        </div>
    );
}
