import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
    ArrowRight,
    Award,
    Briefcase,
    Building2,
    Check,
    ChevronRight,
    Clock,
    FileText,
    Globe,
    GraduationCap,
    Landmark,
    Layers,
    MapPin,
    Menu,
    MessageSquare,
    Monitor,
    Phone,
    Plane,
    Search,
    Share2,
    Shield,
    Star,
    Users,
    X,
} from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"

/* ── shared styles ── */
const gridSection =
    "relative overflow-hidden bg-gradient-to-b from-brand-byzantine/[0.04] via-white to-brand-blue/[0.04] before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(rgba(99,51,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,51,255,0.05)_1px,transparent_1px)] before:bg-[size:40px_40px]"
const sectionInner = "relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
const labelCaps = "text-xs font-bold uppercase tracking-[0.2em] text-brand-byzantine"
const serifHeading = "font-serif text-brand-primary"
const cardWhite = "rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
const gradBtn = "rounded-xl bg-gradient-to-r from-brand-blue to-brand-byzantine font-semibold text-white hover:opacity-90"

/* ── data ── */
const navLinks = [
    { label: "Programs", href: "#programs" },
    { label: "Study in Germany", href: "#study-germany" },
    { label: "India Offices", href: "#india-offices" },
    { label: "Scholarships", href: "#scholarships" },
    { label: "Stories", href: "#stories" },
    { label: "FAQ", href: "#faq" },
    { label: "Apply", href: "#apply" },
]

const tickerItems = [
    "Partnerships",
    "Global Alumni Network",
    "Berlin • Düren • Köln • Bielefeld • Waldshut",
    "State-Recognised Degrees",
    "English-Taught Programmes",
    "Small Class Sizes",
]

const whyChooseCards = [
    {
        icon: Layers,
        color: "bg-brand-blue/15 text-brand-blue",
        title: "Practice-Oriented Education",
        description:
            "Curricula developed with industry partners. Every programme integrates internships, live projects and company visits — preparation beyond the classroom.",
    },
    {
        icon: Users,
        color: "bg-brand-byzantine/15 text-brand-byzantine",
        title: "Small Study Groups",
        description:
            "Seminars of 20–25 students. Professors know you personally, provide direct mentorship and the individual attention that large universities cannot replicate.",
    },
    {
        icon: Globe,
        color: "bg-brand-success/15 text-brand-success",
        title: "International Career Access",
        description:
            "A German degree opens doors worldwide. Our career services, industry network and German Mittelstand connections give you a decisive competitive edge.",
    },
    {
        icon: Star,
        color: "bg-brand-byzantine/15 text-brand-byzantine",
        title: "50+ Global University Network",
        description:
            "Partners across Asia, Europe and the Americas. Benefit from exchange programmes, dual degrees and a truly international academic community.",
    },
]

const programTabs = ["Master Programmes", "Bachelor Programmes", "Study College / PSP", "Healthcare BSc"]

const featuredPrograms = [
    {
        badge: "M.SC.",
        title: "International Technology Transfer Management",
        tags: ["Berlin", "2 Years", "English", "120 ECTS"],
        tuition: "€18,830 total tuition",
        intakes: "February · June · October",
        extra: null,
    },
    {
        badge: "MBA",
        title: "General Technology Management",
        tags: ["Berlin", "18 Months", "English", "90 ECTS"],
        tuition: "€16,520 total tuition",
        intakes: "February · June · October",
        extra: "3 Specialisations: Automotive & Mobility · Data Science · Energy & Environment",
    },
    {
        badge: "M.A.",
        title: "International Management",
        tags: ["Berlin", "2 Years", "English", "120 ECTS"],
        tuition: "€22,500 total tuition",
        intakes: "June · October",
        extra: null,
    },
]

const journeySteps = [
    {
        title: "Choose Programme",
        description:
            "Browse 22+ programmes across 5 cities. Check eligibility and get personalised advice from our team.",
    },
    {
        title: "Submit Application",
        description:
            "Complete the online form and upload documents. Our International Office reviews every application within 5 business days.",
    },
    {
        title: "Receive Offer & Visa Letter",
        description:
            "Get your conditional or unconditional offer. Full visa guidance and official letters provided by our admissions team.",
    },
    {
        title: "Arrive & Begin Studies",
        description:
            "Our WelcomeCenter supports you on arrival with registration, accommodation, bank account and campus orientation.",
    },
]

const studentBenefits = [
    {
        icon: Globe,
        title: "International Campus Life",
        description:
            "Study alongside students from 30+ countries. FHM's WelcomeCenter provides dedicated support for housing, registration, language integration and city orientation.",
    },
    {
        icon: Monitor,
        title: "Industry Partnerships & Internships",
        description:
            "Strong links with German Mittelstand companies. Integrated internship semesters, live projects and regular guest lectures connect academic study with real-world business.",
    },
    {
        icon: Shield,
        title: "Global Career Preparation",
        description:
            "CV clinics, interview coaching, LinkedIn optimisation, career fairs and employer events. Our careers team ensures you graduate competitive for international roles.",
    },
    {
        icon: Star,
        title: "Modern Learning Environment",
        description:
            "VR labs for immersive skill development, AI-integrated platforms, digital library access and state-of-the-art seminar rooms designed for collaborative, future-ready learning.",
    },
]

const universityStats = [
    { value: "1999", label: "Founded in Bielefeld" },
    { value: "5,000+", label: "Students Enrolled" },
    { value: "5", label: "German Campuses" },
    { value: "22+", label: "Degree Programmes" },
    { value: "500+", label: "Industry Partners" },
    { value: "50+", label: "Global University Partners" },
]

const whyFhmFeatures = [
    {
        icon: "🎯",
        title: "Practice Before Theory",
        description:
            "FHM was founded on a radical premise — that what matters most is not what you know, but what you can do. Every degree integrates company internships, industry visits, live projects and practitioner-led seminars. Students graduate with a portfolio, not just a certificate.",
    },
    {
        icon: "🏛️",
        title: "State Accreditation & Recognition",
        description:
            "FHM holds full state recognition from the German Ministry of Education, is FIBAA-accredited and fully compliant with the Bologna Process. Your FHM degree is recognised in every EU country, Australia, Canada and beyond — it carries the full weight of a German university qualification.",
    },
    {
        icon: "👥",
        title: "Small Groups, Big Results",
        description:
            "FHM deliberately limits seminar sizes to 20–25 students. This isn't just a policy — it's a philosophy. When your professor knows your name, your background and your ambitions, the quality of feedback, mentorship and networking changes completely. No anonymous lectures here.",
    },
    {
        icon: "🌍",
        title: "Built for International Students",
        description:
            "The Campus.International programme is specifically designed around the needs of students coming from abroad. The dedicated WelcomeCenter handles visa letters, registration, accommodation and city orientation. You won't navigate Germany alone — FHM walks with you from application to graduation.",
    },
    {
        icon: "🔗",
        title: "German Mittelstand Network",
        description:
            "FHM's name — Fachhochschule des Mittelstands — reflects its unique relationship with Germany's 3.5 million SMEs. These hidden champions drive 60% of Germany's economy and 80% of its apprenticeships. FHM graduates don't just study about the Mittelstand — they get jobs in it.",
    },
    {
        icon: "🚀",
        title: "Multiple Intakes — Start Anytime",
        description:
            "Unlike most European universities that only admit once a year, FHM offers up to 3 intake windows per year — February, June and October. You don't have to wait 12 months for your life to begin. When you're ready, FHM is ready.",
    },
]

const campuses = [
    { icon: "🏙️", name: "Berlin", location: "Ernst-Reuter-Platz", programs: "MBA · M.Sc. ITTM · M.A. Int'l Mgmt · B.A. IBA" },
    { icon: "🌿", name: "Düren", location: "Near Cologne/Aachen", programs: "M.Sc. AI · Finance · Digital Transformation · B.A. Digital Business" },
    { icon: "🎨", name: "Köln", location: "Hohenstaufenring", programs: "B.Eng. Mechanical · Energy & Environment · Marketing" },
    { icon: "🏛️", name: "Bielefeld", location: "Headquarters · Ravensberger Str.", programs: "Pre-Studies Program · Studienkolleg (PSP English & German)" },
    { icon: "🏥", name: "Waldshut", location: "Baden-Württemberg", programs: "Healthcare BSc: Physiotherapy · Occupational Therapy · Care & Mgmt" },
]

const germanyFeatures = [
    {
        icon: GraduationCap,
        title: "18-Month Job Seeker Visa",
        description:
            "After graduation, you get 18 months to find a job in Germany — the longest post-study work right in Europe.",
    },
    {
        icon: Briefcase,
        title: "Work 20 hrs/week During Studies",
        description:
            "International students can legally work 20 hours per week while studying, plus full-time during semester breaks.",
    },
    {
        icon: Shield,
        title: "EU Blue Card After Graduation",
        description:
            "A German degree qualifies you for the EU Blue Card — a fast-track to permanent residency and European citizenship pathway.",
    },
    {
        icon: Users,
        title: "Family Can Join You",
        description:
            "Once you're enrolled, your spouse and dependent family members can apply for a family reunion visa to join you in Germany.",
    },
]

const compareRows = [
    { label: "Avg. Tuition/yr", de: "€9,000–15,000", uk: "£20,000–30,000", au: "A$25,000–40,000" },
    { label: "Living Costs/mo", de: "€700–1,000", uk: "£1,500–2,200", au: "A$2,000–2,800" },
    { label: "Post-Study Visa", de: "18 Months", uk: "2 Years", au: "2–4 Years" },
    { label: "Work While Studying", de: "20 hrs/week", uk: "20 hrs/week", au: "24 hrs/week" },
    { label: "PR Pathway", de: "EU Blue Card ✓", uk: "Points-based", au: "Points-based" },
    { label: "Avg. Graduate Salary", de: "€40,000–55,000", uk: "£28,000–38,000", au: "A$55,000–70,000" },
]

const budgetCards = [
    { icon: "🏠", price: "€350–650", title: "Accommodation / month", text: "Student dorms €350–450 · Shared flat €450–650 · All major cities covered", highlight: false },
    { icon: "🍴", price: "€200–250", title: "Food & Groceries / month", text: "University canteen meals from €3–5 · Supermarkets affordable · Free tap water everywhere", highlight: false },
    { icon: "🚆", price: "€29–58", title: "Transport / month", text: "Germany's Deutschlandticket gives unlimited local transport for €58/month · Students get discounts", highlight: false },
    { icon: "📱", price: "€15–30", title: "Phone & Internet / month", text: "SIM from €15 · Campus WiFi free · Most student dorms include internet", highlight: false },
    { icon: "🎭", price: "€50–100", title: "Leisure & Social / month", text: "Museums often free · Student discounts everywhere · Rich cultural life in every city", highlight: false },
    { icon: "💶", price: "€700–1,050", title: "Total Monthly Budget", text: "Work 20 hrs/week at min. wage (€12.82/hr) = ~€1,025/month to cover your entire living costs", highlight: true },
]

const scholarships = [
    { icon: "🏆", title: "DAAD Scholarships", description: "The German Academic Exchange Service offers scholarships for international students in Germany. Covers tuition, monthly stipend and health insurance.", link: "Learn More →", border: "from-pink-500 to-brand-byzantine" },
    { icon: "📚", title: "FHM Merit Scholarships", description: "FHM offers merit-based tuition reductions for academically strong applicants. Speak to our admissions team about eligibility when you apply.", link: "Enquire Now →", border: "from-brand-blue to-cyan-500" },
    { icon: "💳", title: "Instalment Payment Plans", description: "FHM offers flexible payment plans so tuition is not required upfront. Break fees into manageable monthly or semester instalments.", link: "Discuss Options →", border: "from-cyan-500 to-teal-500" },
    { icon: "🌐", title: "Erasmus+ Funding", description: "FHM is an Erasmus+ partner. Students from eligible countries can access EU mobility grants for part of their studies or exchange semesters.", link: "Learn More →", border: "from-red-400 to-pink-500" },
    { icon: "💼", title: "Work While You Study", description: "Work legally up to 20 hrs/week at Germany's minimum wage (€12.82/hr). This covers €1,000+/month — enough to fund your entire living costs.", link: "Learn More →", border: "from-brand-byzantine to-indigo-600" },
    { icon: "🏦", title: "Education Loans", description: "Many banks in India, Nigeria, Pakistan and other countries offer education loans specifically for German universities. Our team can guide you to partner lenders.", link: "Get Guidance →", border: "from-green-400 to-brand-blue" },
]

const testimonials = [
    { quote: "I was worried about studying in a foreign country, but FHM's WelcomeCenter handled everything — registration, accommodation and bank account in the first week. Small class sizes meant my professors actually knew my name. I got a job offer in Berlin before I even graduated.", name: "Priya Sharma", degree: "M.Sc. AI & Data Science · India", role: "Now: Data Analyst at SAP, Berlin", avatar: "PS" },
    { quote: "Choosing Germany over the UK was the best financial decision of my life. I paid a third of what my friends spent in London, worked part-time to cover living costs, and now hold an EU Blue Card. My MBA gave me exactly the Automotive network I was looking for.", name: "Chukwuemeka Obi", degree: "MBA General Tech Management · Nigeria", role: "Now: Business Dev Manager, BMW Group", avatar: "CO" },
    { quote: "The International Management programme was entirely in English — no German required. The 12-week internship placed me at a Frankfurt consulting firm. Within 8 months of graduation I had permanent residence and a salary I could only dream of back home.", name: "Fatima Al-Hassan", degree: "M.A. International Management · Egypt", role: "Now: Strategy Consultant, Frankfurt", avatar: "FA" },
    { quote: "The Finance & Fintech programme opened doors I didn't expect. FHM's connections with Berlin's startup ecosystem meant I was networking with fintech founders while still a student. I launched my own payment startup six months after graduation.", name: "Arjun Mehta", degree: "M.Sc. Finance & Fintech · India", role: "Now: Co-founder, FinTech Startup, Berlin", avatar: "AM" },
    { quote: "As a Nigerian student, I was nervous about the visa process. FHM's admissions team guided me step by step. They issued my offer letter within 5 days and I got my visa in 8 weeks. The WelcomeCenter team even picked me up from the airport on my first day.", name: "Amaka Nwosu", degree: "B.A. Digital Business Management · Nigeria", role: "Now: Marketing Analyst, Zalando, Berlin", avatar: "AN" },
    { quote: "I chose Düren for the AI & Data Science programme because the cost of living is much lower than Berlin. I worked 20 hours a week at a local tech company which paid my rent entirely. The professors had industry backgrounds — no theory-only lecturers.", name: "Wei Zhong", degree: "M.Sc. AI & Data Science · China", role: "Now: Data Scientist, Tech Solutions, Aachen", avatar: "WZ" },
]

const accreditations = [
    { icon: "🏛️", text: "State-Recognised University" },
    { icon: "🇩🇪", text: "German Ministry of Education" },
    { icon: "🎓", text: "Bologna Process Compliant" },
    { icon: "🌍", text: "FIBAA Accredited" },
    { icon: "📋", text: "ECTS Credit System" },
    { icon: "🏆", text: "50+ University Partners" },
]

const indiaOffices = [
    {
        city: "Chandigarh",
        title: "FHM WelcomeCenter Chandigarh",
        region: "Serving Punjab · Haryana · Himachal Pradesh · J&K · Delhi NCR",
        address: "Sector 34A, Chandigarh — 160022, India",
        phone: "+91 98320 00090",
        email: "chandigarh@fhm-international.de",
        hours: "Mon–Sat, 10:00 AM — 6:00 PM IST",
        whatsapp: "WhatsApp Chandigarh Office",
    },
    {
        city: "Surat",
        title: "FHM WelcomeCenter Surat",
        region: "Serving Gujarat · Rajasthan · Maharashtra · Mumbai · Pune",
        address: "Ring Road, Surat — 395002, Gujarat, India",
        phone: "+91 98320 00090",
        email: "surat@fhm-international.de",
        hours: "Mon–Sat, 10:00 AM — 6:00 PM IST",
        whatsapp: "WhatsApp Surat Office",
    },
]

const welcomeServices = [
    { icon: GraduationCap, color: "bg-brand-blue/15 text-brand-blue", title: "Free Programme Counselling", description: "Our counsellors analyse your academic profile, career goals and budget to recommend the exact FHM programme that fits you best — no generic advice, fully personalised." },
    { icon: FileText, color: "bg-brand-byzantine/15 text-brand-byzantine", title: "Document Preparation Help", description: "We guide you through every document: transcripts, bank statements, Statement of Purpose, CV, IELTS/TOEFL preparation and translations — checklist provided, nothing missed." },
    { icon: Plane, color: "bg-teal-500/15 text-teal-600", title: "German Visa Application Support", description: "We prepare your complete visa file, book your VFS/Embassy appointment, review your cover letter and financial proof, and give you a mock interview — maximising your visa success rate." },
    { icon: Building2, color: "bg-red-400/15 text-red-500", title: "Accommodation Assistance", description: "We connect you with student housing near your FHM campus before you arrive — student dormitories, shared flats and private rooms. You land with a confirmed address, not uncertainty." },
    { icon: Landmark, color: "bg-amber-400/15 text-amber-600", title: "Blocked Account & Bank Setup", description: "Germany requires a blocked account (Sperrkonto) of ~€11,208 for your visa. We guide you to the right providers (Fintiba, Expatrio), help with setup and explain exactly how it works." },
    { icon: Globe, color: "bg-brand-byzantine/15 text-brand-byzantine", title: "Pre-Departure Orientation", description: "Before you fly, we run a detailed session covering German culture, transport, SIM cards, health insurance, Anmeldung (city registration) and what to do in your first 7 days in Germany." },
    { icon: Users, color: "bg-brand-success/15 text-brand-success", title: "Post-Arrival Support", description: "Our Germany-based WelcomeCenter team meets you on arrival, helps open your German bank account, register at the city office (Einwohnermeldeamt) and settle into campus life." },
    { icon: Phone, color: "bg-orange-400/15 text-orange-500", title: "Ongoing Student Helpline", description: "Questions don't stop after you land. Our India counsellors stay reachable via WhatsApp, call and email throughout your entire degree — whether it's about extensions, family visas or job hunting." },
]

const faqItems = [
    "Do I need to speak German for English-taught programmes?",
    "How long does the German student visa take?",
    "Can I work while studying in Germany?",
    "What is the minimum academic score required?",
    "Is IELTS mandatory? What if I don't have a score yet?",
    "What happens after I graduate — can I stay in Germany?",
    "How much does it cost in total to study at FHM?",
    "How long does the application process take?",
]

const applyFeatures = ["Free Application", "5-Day Response", "Visa Support Included", "WelcomeCenter On Arrival", "Dedicated Counsellor", "Multiple Intakes / Year"]

const applySteps = [
    { title: "Fill in the application form", description: "Name, country, programme interest — takes 3 minutes" },
    { title: "Counsellor contacts you within 24 hrs", description: "Personalised programme advice and eligibility check" },
    { title: "Submit documents & receive offer letter", description: "Official offer issued for your German student visa application" },
    { title: "Arrive in Germany — we welcome you!", description: "WelcomeCenter support from day one on campus" },
]

export const metadata: Metadata = {
    title: "FHM International — Study in Germany",
    description:
        "Study in Germany at FHM University. Practice-oriented Bachelor, Master and Healthcare programmes for international students.",
}

export default function LandingPage() {
    return (
        <div className="relative min-h-screen bg-white text-brand-primary">
            {/* ── Navbar ── */}
            <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                    <Link href="/" className="flex shrink-0 items-center gap-2">
                        <Image src="/logo-dark.png" alt="FHM International" width={160} height={48} priority className="h-10 w-auto" />
                    </Link>
                    <nav className="hidden items-center gap-5 xl:flex">
                        {navLinks.map((link) => (
                            <Link key={link.label} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-brand-byzantine">
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                    <Link href="#apply" className="hidden sm:block">
                        <Button className={`${gradBtn} px-5`}>Apply Now →</Button>
                    </Link>
                    <details className="group relative xl:hidden">
                        <summary className="flex cursor-pointer list-none items-center rounded-lg p-2 hover:bg-muted [&::-webkit-details-marker]:hidden">
                            <Menu className="size-6 group-open:hidden" />
                            <X className="hidden size-6 group-open:block" />
                        </summary>
                        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-white p-4 shadow-lg">
                            {navLinks.map((link) => (
                                <Link key={link.label} href={link.href} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-byzantine/5">{link.label}</Link>
                            ))}
                            <Link href="#apply" className="mt-3 block"><Button className={`w-full ${gradBtn}`}>Apply Now →</Button></Link>
                        </div>
                    </details>
                </div>
            </header>

            {/* ── 1. Hero ── */}
            <section id="home" className={`${gridSection} max-h-[calc(100svh-4rem)] min-h-[calc(100svh-4rem)] flex flex-col overflow-hidden max-lg:min-h-0 max-lg:max-h-none`}>
                <div className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-10">
                    <div className="space-y-4 lg:space-y-5">
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-brand-byzantine/30 bg-white px-3 py-1 text-xs font-semibold text-brand-primary">
                                <span className="size-2 rounded-full bg-red-500" />
                                Next Intake: October 2026 — Closes in <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-600">52</span> days
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-brand-byzantine/30 bg-white px-3 py-1 text-xs font-semibold text-brand-byzantine">
                                <span className="size-2 rounded-full bg-brand-byzantine" />
                                DIRECT APPLICATION PORTAL — INTAKE 2025/26 OPEN
                            </span>
                        </div>
                        <Typography as="h1" font="heading" className={`${serifHeading} bg-gradient-to-r from-brand-primary to-brand-byzantine bg-clip-text text-transparent lg:text-[40px]`}>
                            Study in Germany at FHM University
                        </Typography>
                        <Typography as="p" font="text-lg" className="max-w-lg text-muted-foreground">
                            Practice-oriented Bachelor, Master and Healthcare programmes for international students. Earn a state-recognised German degree and launch a global career.
                        </Typography>
                        <div className="flex flex-wrap gap-3">
                            <Link href="#apply"><Button size="lg" className={gradBtn}>Apply Now →</Button></Link>
                            <Link href="#programs"><Button variant="outline" size="lg" className="rounded-xl border-gray-200 bg-white font-semibold text-brand-primary">Explore All Programmes</Button></Link>
                        </div>
                        <div className="flex flex-wrap gap-6 border-t border-gray-100 pt-4 sm:gap-10">
                            {[{ v: "22+", l: "Programmes Offered" }, { v: "6", l: "Campus Locations" }, { v: "50+", l: "Global Partners" }].map((s, i) => (
                                <div key={s.l} className={`${i > 0 ? "border-l border-gray-200 pl-6 sm:pl-10" : ""}`}>
                                    <Typography as="p" font="heading" className="text-brand-primary">{s.v}</Typography>
                                    <Typography as="p" font="sub-text" className="text-muted-foreground">{s.l}</Typography>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative min-h-0">
                        <div className="overflow-hidden rounded-2xl shadow-xl">
                            <Image src="/assets/german-uni.png" alt="FHM University campus" width={640} height={480} className="h-auto max-h-[min(340px,42vh)] w-full object-cover lg:max-h-[min(420px,52vh)]" priority />
                        </div>
                        <div className="absolute -right-2 top-4 rounded-xl bg-gradient-to-r from-brand-blue to-brand-byzantine p-3 text-white shadow-lg sm:-right-4">
                            <GraduationCap className="mb-1 size-5" />
                            <Typography as="p" font="small" className="text-white">Top Private University</Typography>
                            <Typography as="p" font="sub-text" className="text-white/80">5 German Campuses</Typography>
                        </div>
                        <div className="absolute -bottom-4 -left-4 rounded-xl border border-gray-100 bg-white p-4 shadow-lg sm:-left-6">
                            <Typography as="p" font="sub-text" className="text-muted-foreground">Accreditation</Typography>
                            <Typography as="p" font="title" className={`${serifHeading}`}>State-Recognised</Typography>
                            <Typography as="p" font="sub-text" className="text-muted-foreground">Bologna-Compliant · Germany</Typography>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 2. Ticker + Why Choose ── */}
            <section id="about" className={gridSection}>
                <div className="relative overflow-hidden border-y border-brand-byzantine/10 bg-brand-byzantine/5 py-3">
                    <style>{`
                        @keyframes landing-ticker-marquee {
                            from { transform: translateX(0); }
                            to { transform: translateX(-50%); }
                        }
                    `}</style>
                    <div
                        className="flex w-max gap-8 hover:[animation-play-state:paused]"
                        style={{ animation: "landing-ticker-marquee 35s linear infinite" }}
                    >
                        {[...tickerItems, ...tickerItems].map((item, i) => (
                            <span key={`${item}-${i}`} className="flex shrink-0 items-center gap-4 px-2 text-xs font-semibold text-brand-byzantine">
                                <span className="size-1.5 rounded-full bg-brand-byzantine" />
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
                <div className={sectionInner}>
                    <Typography as="p" className={`${labelCaps} mb-3`}>Why Choose FHM International</Typography>
                    <Typography as="h2" font="sub-heading" className={`${serifHeading} mb-4 max-w-2xl`}>A University Built for Your Global Future</Typography>
                    <Typography as="p" font="text" className="mb-12 max-w-3xl text-muted-foreground">
                        FHM combines the rigour of German higher education with practice-oriented, internationally focused curricula designed for today&apos;s job market.
                    </Typography>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {whyChooseCards.map((item) => (
                            <div key={item.title} className={`${cardWhite} rounded-3xl p-6`}>
                                <div className={`mb-4 inline-flex rounded-xl p-3 ${item.color}`}><item.icon className="size-6" /></div>
                                <Typography as="h3" font="title" className="mb-2 text-brand-primary">{item.title}</Typography>
                                <Typography as="p" font="sub-text" className="text-muted-foreground">{item.description}</Typography>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 3. Academic Programmes ── */}
            <section id="programs" className={gridSection}>
                <div className={sectionInner}>
                    <Typography as="p" className={`${labelCaps} mb-3 text-center`}>Academic Programmes 2025/26</Typography>
                    <Typography as="h2" font="sub-heading" className={`${serifHeading} mb-4 text-center`}>Find Your Programme at FHM</Typography>
                    <Typography as="p" font="text" className="mx-auto mb-10 max-w-3xl text-center text-muted-foreground">
                        22+ state-accredited programmes across 5 German cities, mostly English-taught, with up to 3 intakes per year.
                    </Typography>
                    <div className="mb-10 flex flex-wrap justify-center gap-2">
                        {programTabs.map((tab, i) => (
                            <button key={tab} type="button" className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${i === 0 ? `${gradBtn}` : "border border-gray-200 bg-white text-brand-primary hover:border-brand-byzantine/30"}`}>{tab}</button>
                        ))}
                    </div>
                    <div className="grid items-stretch gap-6 lg:grid-cols-3">
                        {featuredPrograms.map((prog) => (
                            <div
                                key={prog.title}
                                className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                            >
                                <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-brand-blue to-brand-byzantine" />
                                <div className="flex flex-1 flex-col items-start p-6">
                                    <span className="mb-3 w-fit rounded-full bg-brand-byzantine px-3 py-0.5 text-xs font-bold text-white">{prog.badge}</span>
                                    <Typography as="h3" font="title" className="mb-4 min-h-[56px] w-full text-brand-primary">{prog.title}</Typography>
                                    <div className="mb-4 flex w-full flex-wrap gap-2">
                                        {prog.tags.map((tag) => (
                                            <span key={tag} className="rounded-full bg-brand-input px-3 py-1 text-xs text-muted-foreground">{tag}</span>
                                        ))}
                                    </div>
                                    <Typography as="p" font="sub-text" className="mb-2 w-full font-semibold text-brand-primary">{prog.tuition}</Typography>
                                    <Typography as="p" font="sub-text" className="mb-4 w-full text-muted-foreground">
                                        Intakes: <span className="text-brand-byzantine">{prog.intakes}</span>
                                    </Typography>
                                    {prog.extra && <Typography as="p" font="sub-text" className="mb-4 w-full text-muted-foreground">{prog.extra}</Typography>}
                                    <Typography as="p" font="sub-text" className="mb-4 w-full text-brand-primary">▸ Entry Requirements</Typography>
                                    <div className="mt-auto flex w-full gap-2 pt-2">
                                        <Button variant="secondary" className="flex-1 rounded-xl bg-brand-byzantine/10 text-brand-byzantine">View Full Details ↗</Button>
                                        <Link href="#apply" className="flex-1"><Button className={`w-full ${gradBtn}`}>Apply Now →</Button></Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 4. Student Journey ── */}
            <section id="journey" className={gridSection}>
                <div className={`${sectionInner} text-center`}>
                    <Typography as="p" className={`${labelCaps} mb-3`}>Student Journey</Typography>
                    <Typography as="h2" font="sub-heading" className={`${serifHeading} mb-4`}>4 Steps to Start Your Life in Germany</Typography>
                    <Typography as="p" font="text" className="mx-auto mb-14 max-w-2xl text-muted-foreground">
                        From your first enquiry to your first day on campus — full support at every stage.
                    </Typography>
                    <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="absolute left-[12%] right-[12%] top-8 hidden h-0.5 bg-brand-byzantine/20 lg:block" />
                        {journeySteps.map((step, i) => (
                            <div key={step.title} className="relative flex flex-col items-center">
                                <div className="relative z-10 mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-byzantine to-brand-blue text-xl font-bold text-white shadow-md">{i + 1}</div>
                                <Typography as="h3" font="title" className="mb-2 text-brand-primary">{step.title}</Typography>
                                <Typography as="p" font="sub-text" className="text-muted-foreground">{step.description}</Typography>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 5. Student Benefits ── */}
            <section className={gridSection}>
                <div className={sectionInner}>
                    <Typography as="p" className={`${labelCaps} mb-3`}>Student Benefits</Typography>
                    <Typography as="h2" font="sub-heading" className={`${serifHeading} mb-12 max-w-xl`}>
                        Everything You Need to Thrive in Germany<span className="ml-2 inline-block h-1 w-6 bg-red-500" />
                    </Typography>
                    <div className="grid gap-6 md:grid-cols-2">
                        {studentBenefits.map((item) => (
                            <div key={item.title} className={`${cardWhite} flex gap-5 rounded-3xl`}>
                                <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-byzantine text-white shadow-lg shadow-brand-byzantine/30">
                                    <item.icon className="size-6" />
                                </div>
                                <div>
                                    <Typography as="h3" font="title" className="mb-2 text-brand-primary">{item.title}</Typography>
                                    <Typography as="p" font="sub-text" className="text-muted-foreground">{item.description}</Typography>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 6. Why FHM University ── */}
            <section className={gridSection}>
                <div className={sectionInner}>
                    <div className="mb-12 text-center">
                        <Typography as="p" className={`${labelCaps} mb-3`}>Why FHM University</Typography>
                        <Typography as="h2" font="sub-heading" className={`${serifHeading} mb-4`}>25 Years of Building International Careers</Typography>
                        <Typography as="p" font="text" className="mx-auto max-w-3xl text-muted-foreground">
                            Fachhochschule des Mittelstands (FHM) has been shaping business and technology leaders since 1999 — with a relentless focus on practice, personality and global impact.
                        </Typography>
                    </div>
                    <div className="mb-14 grid grid-cols-2 divide-x divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm lg:grid-cols-6">
                        {universityStats.map((stat) => (
                            <div key={stat.label} className="px-4 py-6 text-center">
                                <Typography as="p" font="heading" className={`${serifHeading} text-brand-primary`}>{stat.value}</Typography>
                                <Typography as="p" font="sub-text" className="mt-1 text-muted-foreground">{stat.label}</Typography>
                            </div>
                        ))}
                    </div>
                    <div className="mb-14 grid gap-8 lg:grid-cols-2">
                        {whyFhmFeatures.map((item) => (
                            <div key={item.title} className="flex gap-4">
                                <span className="text-2xl">{item.icon}</span>
                                <div>
                                    <Typography as="h3" font="title" className="mb-2 text-brand-primary">{item.title}</Typography>
                                    <Typography as="p" font="sub-text" className="text-muted-foreground">{item.description}</Typography>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Typography as="p" className={`${labelCaps} mb-8 text-center`}>Our Campus Locations</Typography>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {campuses.map((c) => (
                            <div key={c.name} className={`${cardWhite} text-center`}>
                                <span className="mb-2 block text-2xl">{c.icon}</span>
                                <Typography as="h3" font="title" className="text-brand-primary">{c.name}</Typography>
                                <Typography as="p" font="sub-text" className="text-brand-byzantine">{c.location}</Typography>
                                <Typography as="p" font="sub-text" className="mt-2 text-muted-foreground">{c.programs}</Typography>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 7. Why Study in Germany ── */}
            <section id="study-germany" className={gridSection}>
                <div className={`${sectionInner} grid items-start gap-12 lg:grid-cols-2`}>
                    <div>
                        <Typography as="p" className={`${labelCaps} mb-3`}>Why Study in Germany</Typography>
                        <Typography as="h2" font="sub-heading" className={`${serifHeading} mb-4`}>The Smartest Country Choice You&apos;ll Make</Typography>
                        <Typography as="p" font="text" className="mb-8 text-muted-foreground">
                            Germany combines world-class education with Europe&apos;s strongest economy, affordable living costs and the most generous post-study work rights on the continent.
                        </Typography>
                        <div className="space-y-4">
                            {germanyFeatures.map((item) => (
                                <div key={item.title} className={`${cardWhite} flex gap-4`}>
                                    <item.icon className="mt-0.5 size-5 shrink-0 text-brand-byzantine" />
                                    <div>
                                        <Typography as="h3" font="title" className="mb-1 text-brand-primary">{item.title}</Typography>
                                        <Typography as="p" font="sub-text" className="text-muted-foreground">{item.description}</Typography>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={`${cardWhite} overflow-hidden rounded-2xl p-0 shadow-lg`}>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[320px] border-collapse text-[11px] leading-snug sm:text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-brand-input/70">
                                        <th className="px-3 py-2.5 text-left align-middle">
                                            <Typography as="span" font="small" className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                                                Compare Countries
                                            </Typography>
                                        </th>
                                        <th className="bg-brand-byzantine/[0.08] px-2 py-2.5 text-center align-middle">
                                            <span className="inline-block rounded-full bg-brand-byzantine px-2 py-0.5 text-[10px] font-bold text-white sm:text-[11px]">
                                                🇩🇪 Germany
                                            </span>
                                        </th>
                                        <th className="px-2 py-2.5 text-center align-middle">
                                            <Typography as="span" font="small" className="text-[10px] font-semibold text-muted-foreground sm:text-[11px]">🇬🇧 UK</Typography>
                                        </th>
                                        <th className="px-2 py-2.5 text-center align-middle">
                                            <Typography as="span" font="small" className="text-[10px] font-semibold text-muted-foreground sm:text-[11px]">🇦🇺 Australia</Typography>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {compareRows.map((row, i) => (
                                        <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                                            <td className="border-b border-gray-100 px-3 py-2 align-middle">
                                                <Typography as="p" font="sub-text" className="text-[11px] text-muted-foreground sm:text-xs">{row.label}</Typography>
                                            </td>
                                            <td className="border-b border-brand-byzantine/10 bg-brand-byzantine/[0.06] px-2 py-2 text-center align-middle">
                                                <Typography as="p" font="sub-text" className="text-[11px] font-semibold text-brand-blue sm:text-xs">{row.de}</Typography>
                                            </td>
                                            <td className="border-b border-gray-100 px-2 py-2 text-center align-middle">
                                                <Typography as="p" font="sub-text" className="text-[11px] text-muted-foreground sm:text-xs">{row.uk}</Typography>
                                            </td>
                                            <td className="border-b border-gray-100 px-2 py-2 text-center align-middle">
                                                <Typography as="p" font="sub-text" className="text-[11px] text-muted-foreground sm:text-xs">{row.au}</Typography>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t border-gray-100 bg-white p-3 sm:p-4">
                            <Link href="#apply" className="block">
                                <Button className={`w-full ${gradBtn} py-2.5 text-sm`}>Apply for Germany Now →</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 8. Cost of Living ── */}
            <section className={gridSection}>
                <div className={`${sectionInner} text-center`}>
                    <Typography as="p" className={`${labelCaps} mb-3`}>Cost of Living in Germany</Typography>
                    <Typography as="h2" font="sub-heading" className={`${serifHeading} mb-4`}>Your Monthly Budget as a Student</Typography>
                    <Typography as="p" font="text" className="mx-auto mb-12 max-w-2xl text-muted-foreground">
                        Germany is one of Europe&apos;s most affordable countries for international students. Here&apos;s what to expect.
                    </Typography>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {budgetCards.map((card) => (
                            <div key={card.title} className={`rounded-3xl p-6 text-left ${card.highlight ? "border-2 border-brand-byzantine/30 bg-brand-byzantine/5" : cardWhite}`}>
                                <span className="mb-3 block text-2xl">{card.icon}</span>
                                <Typography as="p" font="heading" className={`${serifHeading} mb-2 ${card.highlight ? "text-brand-primary" : "bg-gradient-to-r from-brand-byzantine to-pink-500 bg-clip-text text-transparent"}`}>{card.price}</Typography>
                                <Typography as="h3" font="title" className={`mb-2 ${card.highlight ? "text-brand-byzantine" : "text-brand-primary"}`}>{card.title}</Typography>
                                <Typography as="p" font="sub-text" className="text-muted-foreground">{card.text}</Typography>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 9. Scholarships ── */}
            <section id="scholarships" className={gridSection}>
                <div className={`${sectionInner} text-center`}>
                    <Typography as="p" className={`${labelCaps} mb-3`}>Scholarships & Funding</Typography>
                    <Typography as="h2" font="sub-heading" className={`${serifHeading} mb-4`}>Don&apos;t Let Finance Stop Your Dream</Typography>
                    <Typography as="p" font="text" className="mx-auto mb-12 max-w-2xl text-muted-foreground">
                        Multiple funding options are available for international students at FHM — you don&apos;t have to bear the full cost alone.
                    </Typography>
                    <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {scholarships.map((item) => (
                            <div key={item.title} className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm">
                                <div className={`h-[3px] w-full shrink-0 bg-gradient-to-r ${item.border}`} />
                                <div className="flex flex-1 flex-col p-6">
                                    <span className="mb-3 block text-2xl">{item.icon}</span>
                                    <Typography as="h3" font="title" className="mb-2 text-brand-primary">{item.title}</Typography>
                                    <Typography as="p" font="sub-text" className="mb-4 flex-1 text-muted-foreground">{item.description}</Typography>
                                    <Typography as="p" font="sub-text" className="mt-auto font-semibold text-brand-byzantine">{item.link}</Typography>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 10. Student Stories ── */}
            <section id="stories" className={gridSection}>
                <div className={`${sectionInner} text-center`}>
                    <Typography as="p" className={`${labelCaps} mb-3`}>Student Stories</Typography>
                    <Typography as="h2" font="sub-heading" className={`${serifHeading} mb-4`}>Real Students. Real Experiences.</Typography>
                    <Typography as="p" font="text" className="mx-auto mb-8 max-w-3xl text-muted-foreground">
                        Hear directly from international students who chose FHM and built their careers in Germany — in their own words and on video.
                    </Typography>
                    <div className="mb-10 inline-flex rounded-full border border-gray-200 bg-white p-1">
                        <button type="button" className={`rounded-full px-5 py-2 text-sm font-semibold ${gradBtn}`}>💬 Written Reviews</button>
                        <button type="button" className="rounded-full px-5 py-2 text-sm font-semibold text-muted-foreground">▶ Video Stories</button>
                    </div>
                    <div className="grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
                        {testimonials.map((item) => (
                            <div key={item.name} className={`${cardWhite} rounded-2xl`}>
                                <div className="mb-3 flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-4 fill-amber-400 text-amber-400" />)}</div>
                                <Typography as="p" font="sub-text" className="mb-6 italic text-muted-foreground">&ldquo;{item.quote}&rdquo;</Typography>
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-brand-byzantine/10 text-sm font-bold text-brand-byzantine">{item.avatar}</div>
                                    <div>
                                        <Typography as="p" font="small" className="text-brand-primary">{item.name}</Typography>
                                        <Typography as="p" font="sub-text" className="text-brand-byzantine">{item.degree}</Typography>
                                        <Typography as="p" font="sub-text" className="text-muted-foreground">{item.role}</Typography>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 11. Accreditation ── */}
            <section className={gridSection}>
                <div className={`${sectionInner} text-center`}>
                    <Typography as="p" className={`${labelCaps} mb-8`}>Accreditation & Recognition</Typography>
                    <div className="flex flex-wrap justify-center gap-4">
                        {accreditations.map((item) => (
                            <span key={item.text} className="inline-flex items-center gap-2 rounded-full border border-gray-100 bg-white px-5 py-2.5 text-sm font-medium text-brand-primary shadow-sm">
                                <span>{item.icon}</span>{item.text}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 12. India Offices ── */}
            <section id="india-offices" className={gridSection}>
                <div className={`${sectionInner} text-center`}>
                    <Typography as="p" className={`${labelCaps} mb-3`}>FHM WelcomeCenter India</Typography>
                    <Typography as="h2" font="sub-heading" className={`${serifHeading} mb-4`}>Your Germany Journey Starts Right Here in India</Typography>
                    <Typography as="p" font="text" className="mx-auto mb-12 max-w-3xl text-muted-foreground">
                        FHM International has dedicated WelcomeCenter offices in India — so you get face-to-face guidance, document support and visa counselling from our trained team before you even leave the country.
                    </Typography>
                    <div className="grid gap-8 text-left lg:grid-cols-2">
                        {indiaOffices.map((office) => (
                            <div key={office.city} className={`${cardWhite} overflow-hidden rounded-2xl p-0`}>
                                <div className="h-1 bg-gradient-to-r from-orange-400 to-green-500" />
                                <div className="p-6">
                                    <div className="mb-4 flex items-start justify-between gap-4">
                                        <div>
                                            <Typography as="p" font="title" className={`${serifHeading} mb-1`}>IN</Typography>
                                            <Typography as="h3" font="title" className={`${serifHeading} text-brand-primary`}>{office.title}</Typography>
                                            <Typography as="p" font="sub-text" className="text-brand-byzantine">{office.region}</Typography>
                                        </div>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700"><MapPin className="size-3" />{office.city}</span>
                                    </div>
                                    <div className="mb-6 space-y-3 rounded-xl bg-brand-input/80 p-4">
                                        <Typography as="p" font="sub-text" className="flex items-start gap-2 text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0 text-red-500" />{office.address}</Typography>
                                        <Typography as="p" font="sub-text" className="flex items-center gap-2 text-muted-foreground"><Phone className="size-4 shrink-0 text-red-500" />{office.phone}</Typography>
                                        <Typography as="p" font="sub-text" className="text-muted-foreground">✉ {office.email}</Typography>
                                        <Typography as="p" font="sub-text" className="flex items-center gap-2 text-muted-foreground"><Clock className="size-4 shrink-0" />{office.hours}</Typography>
                                    </div>
                                    <Button className="w-full rounded-xl bg-green-500 font-semibold text-white hover:bg-green-600">💬 {office.whatsapp}</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 13. WelcomeCenter Services ── */}
            <section className={gridSection}>
                <div className={`${sectionInner} text-center`}>
                    <Typography as="p" className={`${labelCaps} mb-3`}>What Our WelcomeCenter Does For You</Typography>
                    <Typography as="h2" font="sub-heading" className={`${serifHeading} mb-12`}>End-to-End Support — From First Meeting to First Day of Class</Typography>
                    <div className="grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-4">
                        {welcomeServices.map((item) => (
                            <div key={item.title} className={`${cardWhite} rounded-3xl`}>
                                <div className={`mb-4 inline-flex rounded-xl p-3 ${item.color}`}><item.icon className="size-5" /></div>
                                <Typography as="h3" font="title" className="mb-2 text-brand-primary">{item.title}</Typography>
                                <Typography as="p" font="sub-text" className="text-muted-foreground">{item.description}</Typography>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 14. India CTA ── */}
            <section className={gridSection}>
                <div className={`${sectionInner} py-10`}>
                    <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-brand-blue/20 bg-brand-byzantine/5 p-8 lg:flex-row lg:items-center">
                        <div>
                            <Typography as="p" font="small" className="mb-2 font-bold text-brand-primary">IN</Typography>
                            <Typography as="h2" font="text-xl" className={`${serifHeading} mb-2`}>Based in India? Visit Your Nearest Office Today.</Typography>
                            <Typography as="p" font="sub-text" className="max-w-xl text-muted-foreground">
                                Walk in, call us or WhatsApp — our Chandigarh and Surat counsellors are available 6 days a week to guide you towards your German degree.
                            </Typography>
                        </div>
                        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto">
                            <Link href="#apply"><Button className={`w-full sm:w-56 ${gradBtn}`}>Apply Online Now →</Button></Link>
                            <Button className="w-full rounded-xl bg-green-500 font-semibold text-white hover:bg-green-600 sm:w-56">💬 WhatsApp Us Now</Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 15. FAQ ── */}
            <section id="faq" className={gridSection}>
                <div className={`${sectionInner} text-center`}>
                    <Typography as="p" className={`${labelCaps} mb-3`}>Frequently Asked Questions</Typography>
                    <Typography as="h2" font="sub-heading" className={`${serifHeading} mx-auto mb-12 max-w-md`}>Everything You Want to Know</Typography>
                    <div className="mx-auto max-w-3xl space-y-3 text-left">
                        {faqItems.map((question) => (
                            <details key={question} className={`${cardWhite} group rounded-xl`}>
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-brand-primary [&::-webkit-details-marker]:hidden">
                                    <Typography as="span" font="sub-text" className="font-semibold">{question}</Typography>
                                    <ChevronRight className="size-4 shrink-0 text-brand-byzantine transition-transform group-open:rotate-90" />
                                </summary>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 16. Application Portal ── */}
            <section id="apply" className={gridSection}>
                <div className={`${sectionInner} grid items-start gap-12 lg:grid-cols-2`}>
                    <div>
                        <Typography as="p" className={`${labelCaps} mb-3`}>Direct Application Portal</Typography>
                        <Typography as="h2" font="sub-heading" className={`${serifHeading} mb-4`}>Start Your Journey to Germany Today</Typography>
                        <Typography as="p" font="text" className="mb-8 text-muted-foreground">
                            Apply directly to FHM International. Our admissions counsellors review every application personally and guide you step-by-step from documents to visa support.
                        </Typography>
                        <div className="mb-8 grid grid-cols-2 gap-3">
                            {applyFeatures.map((f) => (
                                <div key={f} className="flex items-center gap-2">
                                    <span className="flex size-5 items-center justify-center rounded-full bg-brand-blue/15"><Check className="size-3 text-brand-blue" /></span>
                                    <Typography as="p" font="sub-text" className="text-brand-primary">{f}</Typography>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3">
                            {applySteps.map((step, i) => (
                                <div key={step.title} className={`${cardWhite} flex gap-4 rounded-xl py-4`}>
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-byzantine text-sm font-bold text-white">{i + 1}</span>
                                    <div>
                                        <Typography as="h3" font="title" className="text-brand-primary">{step.title}</Typography>
                                        <Typography as="p" font="sub-text" className="text-muted-foreground">{step.description}</Typography>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                        <div className="bg-gradient-to-r from-brand-primary to-brand-byzantine p-6 text-white">
                            <div className="mb-2 flex items-center gap-2">
                                <GraduationCap className="size-6" />
                                <Typography as="h3" font="title" className={`${serifHeading} text-white`}>Begin Your Application</Typography>
                            </div>
                            <Typography as="p" font="sub-text" className="mb-4 text-white/80">
                                Fill in your details — our India admissions counsellor contacts you within 24 hours.
                            </Typography>
                            <div className="flex flex-wrap gap-2">
                                {["✓ Free to apply", "🔒 Secure & private", "⚡ 24hr response", "🎓 Official FHM portal"].map((b) => (
                                    <span key={b} className="rounded-full bg-white/15 px-3 py-1 text-xs">{b}</span>
                                ))}
                            </div>
                        </div>
                        <form className="space-y-4 p-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div><label htmlFor="fname"><Typography as="span" font="sub-text" className="text-muted-foreground">First name *</Typography></label><input id="fname" className="mt-1 w-full border-b border-gray-200 bg-transparent py-2 text-sm outline-none focus:border-brand-byzantine" /></div>
                                <div><label htmlFor="lname"><Typography as="span" font="sub-text" className="text-muted-foreground">Last name</Typography></label><input id="lname" className="mt-1 w-full border-b border-gray-200 bg-transparent py-2 text-sm outline-none focus:border-brand-byzantine" /></div>
                            </div>
                            {[
                                { id: "email", label: "E-mail" },
                                { id: "phone", label: "Phone *", prefix: "+91" },
                                { id: "country", label: "Country" },
                                { id: "program", label: "Intrested Program" },
                                { id: "intake", label: "Intake" },
                            ].map((field) => (
                                <div key={field.id}>
                                    <label htmlFor={field.id}><Typography as="span" font="sub-text" className="text-muted-foreground">{field.label}</Typography></label>
                                    <div className="mt-1 flex border-b border-gray-200">
                                        {field.prefix && <span className="py-2 pr-2 text-sm text-muted-foreground">{field.prefix}</span>}
                                        <input id={field.id} className="w-full bg-transparent py-2 text-sm outline-none focus:border-brand-byzantine" />
                                    </div>
                                </div>
                            ))}
                            <div>
                                <label htmlFor="comment"><Typography as="span" font="sub-text" className="text-muted-foreground">Comment *</Typography></label>
                                <textarea id="comment" rows={4} className="mt-1 w-full resize-none border-b border-gray-200 bg-transparent py-2 text-sm outline-none focus:border-brand-byzantine" />
                            </div>
                            <label className="flex items-start gap-2">
                                <input type="checkbox" className="mt-1 accent-brand-byzantine" />
                                <Typography as="span" font="sub-text" className="text-muted-foreground">I agree to the terms and privacy policy *</Typography>
                            </label>
                            <Button type="submit" className={`w-full py-3 ${gradBtn}`}>Apply Now</Button>
                        </form>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-gray-100 bg-brand-primary py-12 text-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                        <Image src="/logo.png" alt="FHM International" width={140} height={42} className="h-9 w-auto brightness-0 invert" />
                        <Typography as="p" font="sub-text" className="text-center text-white/70">
                            © 2024 FHM International. All Rights Reserved. Designed by admission system team.
                        </Typography>
                        <div className="flex gap-3">
                            {[Share2, MessageSquare, X, Users].map((Icon, i) => (
                                <Link key={i} href="#" className="flex size-9 items-center justify-center rounded-full border border-white/20 text-white/70 hover:border-white hover:text-white"><Icon className="size-4" /></Link>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
