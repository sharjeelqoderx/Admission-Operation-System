import { Typography } from "@/components/shared/Typography";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ProgramDetailsPage() {
    return (
        <div className="max-w-[1200px] mx-auto space-y-12 pb-20 px-6 lg:px-12 pt-8">

            {/* Header */}
            <div className="space-y-2">
                <Typography as="h1" className="text-[32px] font-extrabold text-[#0a1e42] tracking-tight leading-tight">
                    AI & Data Science Management (M.Sc.)
                </Typography>
                <div className="flex flex-wrap items-center gap-2 text-[12px] font-bold text-gray-900">
                    <span>AI Management Study</span>
                    <span className="text-[#a855f7]">•</span>
                    <span>Master</span>
                    <span className="text-[#a855f7]">•</span>
                    <span>Full-Time Study</span>
                </div>
            </div>

            {/* Intro Card */}
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 space-y-6">
                    <Typography as="p" className="text-[13px] text-gray-700 leading-relaxed font-medium">
                        The Master's programme in AI & Data Science Management (M.Sc.) combines business, management and artificial
                        intelligence into a practical, interdisciplinary programme. It equips you to develop data-driven strategies, solve
                        complex problems analytically and actively guide organisations through digital transformation. Ideal for anyone
                        who wants to drive innovation and take on leadership roles in international, technology-oriented environments.
                    </Typography>
                    <Typography as="p" className="text-[12px] text-gray-500 italic">
                        *The degree programme is currently undergoing accreditation.
                    </Typography>
                    <div>
                        <Link href="/dashboard/application/new">
                            <Button className="bg-[#0a1e42] hover:bg-[#0a1e42]/90 text-white h-12 px-12 text-[14px] font-bold rounded-xl shadow-lg">
                                Apply now
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="w-full md:w-72 aspect-square rounded-2xl overflow-hidden shrink-0 border-4 border-white shadow-md">
                    <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=400" alt="Student" className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Admission Requirements */}
            <div className="space-y-4">
                <Typography as="h2" className="text-[20px] font-extrabold text-gray-900">Admission Requirements</Typography>
                <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-sm space-y-4">
                    <Typography as="h3" className="text-[16px] font-bold text-gray-900">
                        Admission requirements AI & Data Science Management (M.Sc.)*
                    </Typography>
                    <Typography as="p" className="text-[13px] text-gray-700 leading-relaxed">
                        The formal entry requirement for the M.Sc. AI & Data Science Management postgraduate programme is a relevant university degree with a foundation
                        in business administration or an equivalent academic qualification (e.g. a Master's or Diplom degree) comprising at least 180 ECTS credits.
                    </Typography>
                    <Typography as="p" className="text-[13px] text-gray-700 leading-relaxed mt-4">
                        The following documents are required for your application:
                    </Typography>
                    <ul className="text-[13px] text-gray-700 leading-relaxed space-y-1 pl-4 list-none">
                        <li>CV</li>
                        <li>Proof of university entrance qualification (General Higher Education Entrance Qualification, etc.)</li>
                        <li>Proof of a university degree</li>
                        <li>1 year of professional experience</li>
                    </ul>
                </div>
            </div>

            {/* Perspectives */}
            <div className="space-y-4">
                <Typography as="h2" className="text-[20px] font-extrabold text-gray-900">Perspectives</Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <Typography as="h3" className="text-[18px] font-bold text-gray-900">What to expect during your studies</Typography>
                        <Typography as="p" className="text-[13px] text-gray-700 leading-relaxed">
                            In this Master's programme, you will develop skills in data analysis, artificial intelligence
                            and management. You will learn to make data-driven decisions, optimise business
                            processes and develop innovative solutions for organisations.
                        </Typography>
                        <Typography as="p" className="text-[13px] text-gray-700 leading-relaxed">
                            The programme combines technical, analytical and business management knowledge
                            whilst strengthening leadership, communication and intercultural skills – ideal for
                            actively guiding organisations through digital transformation.
                        </Typography>
                    </div>
                    <div className="space-y-3">
                        {[
                            "Our Competency Model",
                            "Professional. Skills",
                            "Management.Skills",
                            "Smart.Skills"
                        ].map((item, i) => (
                            <div key={i} className="bg-white/60 backdrop-blur-md border border-white/60 rounded-xl px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-white/80 transition-colors shadow-sm">
                                <Typography as="span" className="text-[14px] font-bold text-gray-900">{item}</Typography>
                                <Plus className="size-5 text-gray-600" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Prospects */}
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                    <Typography as="h3" className="text-[18px] font-bold text-gray-900">Your prospects after graduation</Typography>
                    <Typography as="p" className="text-[13px] text-gray-700 leading-relaxed">
                        As a graduate of the AI & Data Science Management (M.Sc.) programme, you will play an active role in shaping
                        data-driven business models and developing innovative solutions at the intersection of management, artificial
                        intelligence and data science. You will analyse complex economic relationships, utilise modern data analysis
                        methods and strategically guide organisations through digital transformation. The demand for qualified
                        specialists and managers with data-driven expertise is growing steadily – in companies across all sectors, public
                        institutions and international organisations.
                    </Typography>
                    <Typography as="p" className="text-[13px] text-gray-700 mt-2">
                        Typical career paths and fields of activity include:
                    </Typography>
                    <ul className="text-[12px] text-gray-700 leading-relaxed space-y-1.5 pl-5 list-disc marker:text-gray-400">
                        <li>"AI & Data Science Manager", who develops and implements data-driven strategies</li>
                        <li>"Data Analyst" or "Data Scientist", who analyses data and provides the basis for decision-making</li>
                        <li>"Chief Data Officer" (CDO) or "Business Intelligence Manager"</li>
                        <li>Specialist and management roles in data-driven business units</li>
                        <li>Management consultancies, international companies and public sector organisations</li>
                    </ul>
                </div>
                <div className="w-full md:w-64 aspect-square rounded-2xl overflow-hidden shrink-0 border-4 border-white shadow-md">
                    <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=400" alt="AI Brain" className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Footer Facts */}
            <div className="space-y-4 pt-4">
                <Typography as="h3" className="text-[18px] font-extrabold text-gray-900">AI & Data Science Management (M.Sc.)* Full-Time Study</Typography>
                <Typography as="h4" className="text-[16px] font-bold text-gray-900">All The Facts About Your Studies</Typography>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="bg-[#1e1e2d]/10 backdrop-blur-md rounded-xl py-4 px-6 text-center border border-gray-200/50">
                        <Typography as="span" className="text-[13px] font-bold text-gray-900">Creditpoints: 120 ECTS</Typography>
                    </div>
                    <div className="bg-[#1e1e2d]/10 backdrop-blur-md rounded-xl py-4 px-6 text-center border border-gray-200/50">
                        <Typography as="span" className="text-[13px] font-bold text-gray-900">Duration: 24 Months</Typography>
                    </div>
                    <div className="bg-[#1e1e2d]/10 backdrop-blur-md rounded-xl py-4 px-6 text-center border border-gray-200/50">
                        <Typography as="span" className="text-[13px] font-bold text-gray-900">Start of studies: October</Typography>
                    </div>
                </div>
            </div>

        </div>
    )
}
