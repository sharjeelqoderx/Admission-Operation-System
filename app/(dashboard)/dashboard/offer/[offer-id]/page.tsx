"use client"

import React, { useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PageLoader } from "@/components/shared/page-loader"
import {
    Download,
    Eye,
    Mail,
    GraduationCap,
    Calendar,
    ChevronLeft,
    Building2,
    Clock,
    MessageSquare,
    FileCheck,
    AlertCircle,
    CheckCircle2,
    X,
    CreditCard,
    Copy,
    Check
} from "lucide-react"
import { toast } from "sonner"
import { Role } from "@/types/enums/role"
import { useAuth } from "@/hooks/useAuth"
import {
    formatIntakeDate,
    formatProgramDate,
    formatStudyMode,
} from "@/lib/utils/program"
import {
    buildLegacyLetterHeadHtml,
    buildSignatureBlockHtml,
    buildTemplateOfferLetterHtml,
} from "@/lib/offer/offer-letter-html"


function buildAdmissionDetailRows(
    course: { name?: string; deadline_date?: string | null } | null | undefined,
    degree: {
        name?: string
        duration?: string | null
        study_mode?: string | null
        intake_date?: string | null
        fees?: string | null
        location?: string | null
        language_of_study?: string | null
        credits?: number | null
    } | null | undefined
): [string, string][] {
    return [
        ["Course", course?.name],
        ["Degree", degree?.name],
        ["Duration", degree?.duration ?? undefined],
        ["Study Mode", degree?.study_mode ?? undefined],
        ["Intake Date", formatIntakeDate(degree?.intake_date) ?? undefined],
        ["Fees", degree?.fees ?? undefined],
        ["Location", degree?.location ?? undefined],
        ["Language of Study", degree?.language_of_study ?? undefined],
        ["Credits", degree?.credits != null ? String(degree.credits) : undefined],
        ["Application Deadline", formatProgramDate(course?.deadline_date) ?? undefined],
    ].filter((row): row is [string, string] => Boolean(row[1]))
}

function SectionHeader({
    icon: Icon,
    title,
    trailing,
}: {
    icon: React.ComponentType<{ className?: string }>
    title: string
    trailing?: React.ReactNode
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-white/25 pb-4">
            <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-byzantine/10">
                    <Icon className="size-4.5 text-brand-byzantine" />
                </div>
                <Typography font="title" className="text-base font-bold truncate">
                    {title}
                </Typography>
            </div>
            {trailing}
        </div>
    )
}

function DetailRow({
    label,
    value,
    icon,
}: {
    label: string
    value: React.ReactNode
    icon?: React.ReactNode
}) {
    return (
        <div className="grid grid-cols-1 gap-1 py-3.5 border-b border-white/15 last:border-0 sm:grid-cols-[minmax(0,140px)_1fr] sm:gap-4 sm:items-center">
            <Typography className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                {label}
            </Typography>
            <div className="flex items-center gap-2 min-w-0">
                {icon}
                {typeof value === "string" || value == null ? (
                    <Typography className="text-sm font-semibold text-gray-800 break-words">
                        {value || "—"}
                    </Typography>
                ) : (
                    value
                )}
            </div>
        </div>
    )
}

function SummaryMetric({
    label,
    value,
    icon,
}: {
    label: string
    value: React.ReactNode
    icon?: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-2 rounded-xl bg-white/30 border border-white/40 p-4 min-w-0">
            <div className="flex items-center gap-2 text-gray-500">
                {icon}
                <Typography className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {label}
                </Typography>
            </div>
            <div className="min-w-0">{value}</div>
        </div>
    )
}

export default function OfferDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const offerId = params?.["offer-id"] as string
    const { me } = useAuth()
    const isSessionReady = !me.isLoading

    const fetchOffer = useCallback(async () => {
        const res = await fetch(`/api/offer/${offerId}`, {
            credentials: "include",
            cache: "no-store",
        })
        if (!res.ok) {
            const json = await res.json().catch(() => ({}))
            throw new Error(json.error || "Failed to fetch offer")
        }
        const json = await res.json()
        return json.data
    }, [offerId])

    const { data: offer, isLoading, isError, refetch } = useQuery({
        queryKey: ["offer", offerId],
        queryFn: fetchOffer,
        enabled: Boolean(offerId) && isSessionReady,
        retry: false,
    })

    const [copied, setCopied] = React.useState(false)

    const [isSignModalOpen, setIsSignModalOpen] = React.useState(false)
    const [isDrawing, setIsDrawing] = React.useState(false)
    const [hasSigned, setHasSigned] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [isDownloadingLetterHead, setIsDownloadingLetterHead] = React.useState(false)
    const [isDownloadingConditionalLetter, setIsDownloadingConditionalLetter] =
        React.useState(false)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

    const handleCopySignLink = useCallback(async () => {
        if (!offer?.application?.student?.id) {
            toast.error("Student data not available for this offer")
            return
        }
        const signLink = `${window.location.origin}/sign?user_id=${offer.application.student.id}&offer_id=${offerId}`
        try {
            await navigator.clipboard.writeText(signLink)
            setCopied(true)
            toast.success("Sign link copied to clipboard!")
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy link:", err)
            toast.error("Failed to copy link")
        }
    }, [offer, offerId])

    React.useEffect(() => {
        if (isSignModalOpen) {
            setTimeout(() => {
                const canvas = canvasRef.current
                if (canvas) {
                    const rect = canvas.getBoundingClientRect()
                    canvas.width = rect.width
                    canvas.height = rect.height

                    const ctx = canvas.getContext("2d")
                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height)
                    }
                }
            }, 100)
        }
    }, [isSignModalOpen])

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 2.5
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        const rect = canvas.getBoundingClientRect()
        let clientX, clientY
        if ("touches" in e) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }

        const x = clientX - rect.left
        const y = clientY - rect.top

        ctx.beginPath()
        ctx.moveTo(x, y)
        setIsDrawing(true)
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        let clientX, clientY
        if ("touches" in e) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }

        const x = clientX - rect.left
        const y = clientY - rect.top

        ctx.lineTo(x, y)
        ctx.stroke()
        setHasSigned(true)
    }

    const stopDrawing = () => {
        setIsDrawing(false)
    }

    const clearCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setHasSigned(false)
    }

    const handleSaveSignature = useCallback(async () => {
        const canvas = canvasRef.current
        if (!canvas || !hasSigned) {
            toast.error("Please draw your signature first.")
            return
        }

        setIsSubmitting(true)
        try {
            const signatureDataUrl = canvas.toDataURL("image/png")
            const response = await fetch(`/api/offer/${offerId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ signatureDataUrl })
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.error || "Failed to save signature")
            }

            toast.success("Offer letter accepted and signed successfully!")
            setIsSignModalOpen(false)
            refetch()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "An error occurred while saving signature.")
        } finally {
            setIsSubmitting(false)
        }
    }, [hasSigned, offerId, refetch])

    const app = offer?.application
    const student = app?.student
    const course = app?.course
    const degree = course?.degree
    const university = app?.university
    const agent = app?.agent
    const reviews: any[] = app?.application_review ?? []
    const latestReview = reviews[reviews.length - 1]
    const admissionDetailRows = buildAdmissionDetailRows(course, degree)

    const issuedAt = offer?.created_at
        ? new Date(offer.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "—"
    const appCreatedAt = app?.created_at
        ? new Date(app.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "—"

    const acceptedAt = (offer as any)?.accepted_at
        ? new Date((offer as any).accepted_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : null

    const applicationRef = app?.application_no || `APP-${app?.id?.slice(0, 8).toUpperCase()}`
    const intakeDateFormatted = formatIntakeDate(degree?.intake_date) ?? "—"
    const feesFormatted = degree?.fees ?? "—"
    const courseDisplayName = [course?.name, degree?.name].filter(Boolean).join(" · ") || "—"

    const offerStatus = String(offer?.status ?? "PENDING").toUpperCase()
    const isOfferSigned = offerStatus === "ACCEPTED" && Boolean(offer?.file_url)
    const canAcceptAndSign = !isOfferSigned && offerStatus !== "REJECTED"
    const hasConditionalLetter = Boolean(offer?.rendered_body_html ?? offer?.body_html)
    const conditionalLetterBodyHtml = offer?.rendered_body_html ?? offer?.body_html ?? ""

    const openSignModal = useCallback(() => {
        setHasSigned(false)
        setIsSignModalOpen(true)
    }, [])

    const buildLetterHeadSignatureHtml = useCallback(
        (signatureSrc?: string) => {
            if (offer?.status === "ACCEPTED" && (signatureSrc || offer.file_url)) {
                const src = signatureSrc || offer.file_url
                return `<div style="margin-top:auto;border-top:1px dashed #e5e7eb;padding-top:24px;display:flex;flex-direction:column;align-items:flex-end;">
                 <img src="${src}" alt="Signature" style="width:140px;height:48px;object-fit:contain;background:transparent;mix-blend-mode:multiply;" />
                 <div style="font-size:10px;color:#9ca3af;margin-top:4px;text-align:right;">
                   <div style="font-weight:700;color:#374151;">${student?.name || ""}</div>
                   <div>Accepted &amp; Signed on ${acceptedAt || new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}</div>
                 </div>
               </div>`
            }

            return `<div style="margin-top:auto;border-top:1px dashed #f3f4f6;padding-top:24px;display:flex;flex-direction:column;align-items:flex-end;">
                 <div style="font-size:10px;color:#d1d5db;font-style:italic;">Signature Required</div>
                 <div style="font-size:10px;color:#9ca3af;margin-top:4px;">Pending Student Signature</div>
               </div>`
        },
        [acceptedAt, offer?.file_url, offer?.status, student?.name]
    )

    const handleViewLetterHead = useCallback(() => {
        if (!offer) return

        const html = buildLegacyLetterHeadHtml({
            studentName: student?.name,
            universityName: university?.name,
            courseName: course?.name,
            degreeName: degree?.name,
            issuedAt,
            applicationRef,
            admissionDetailRows,
            signatureHtml: buildLetterHeadSignatureHtml(),
            variant: "preview",
        })

        const win = window.open("", "_blank")
        if (win) {
            win.document.write(html)
            win.document.close()
        }
    }, [
        admissionDetailRows,
        applicationRef,
        buildLetterHeadSignatureHtml,
        course?.name,
        degree?.name,
        issuedAt,
        offer,
        student?.name,
        university?.name,
    ])

    const handleDownloadLetterHead = useCallback(async () => {
        if (!offer) return

        setIsDownloadingLetterHead(true)
        const toastId = toast.loading("Generating letter head PDF...")

        try {
            const { default: jsPDF } = await import("jspdf")
            const { default: html2canvas } = await import("html2canvas")

            let signatureBase64 = ""
            if (offer.status === "ACCEPTED" && offer.file_url) {
                try {
                    const response = await fetch(offer.file_url)
                    const blob = await response.blob()
                    signatureBase64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader()
                        reader.onload = () => resolve(reader.result as string)
                        reader.onerror = reject
                        reader.readAsDataURL(blob)
                    })
                } catch (e) {
                    console.error("Failed to fetch signature image:", e)
                }
            }

            const html = buildLegacyLetterHeadHtml({
                studentName: student?.name,
                universityName: university?.name,
                courseName: course?.name,
                degreeName: degree?.name,
                issuedAt,
                applicationRef,
                admissionDetailRows,
                signatureHtml: buildLetterHeadSignatureHtml(signatureBase64),
                variant: "pdf",
            })

            const iframe = document.createElement("iframe")
            iframe.style.position = "fixed"
            iframe.style.left = "-9999px"
            iframe.style.top = "-9999px"
            iframe.style.width = "794px"
            iframe.style.height = "1123px"
            iframe.style.border = "none"
            document.body.appendChild(iframe)

            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
            if (!iframeDoc) throw new Error("Could not access iframe document")

            iframeDoc.open()
            iframeDoc.write(html)
            iframeDoc.close()

            const images = iframeDoc.getElementsByTagName("img")
            if (images.length > 0) {
                await Promise.all(
                    Array.from(images).map((img) => {
                        if (img.complete) return Promise.resolve()
                        return new Promise<void>((resolve) => {
                            img.onload = () => resolve()
                            img.onerror = () => resolve()
                        })
                    })
                )
            } else {
                await new Promise((resolve) => setTimeout(resolve, 100))
            }

            const canvas = await html2canvas(iframeDoc.body, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                width: 794,
                height: 1123,
                windowWidth: 794,
                windowHeight: 1123,
            })

            document.body.removeChild(iframe)

            const imgData = canvas.toDataURL("image/png")
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
            pdf.addImage(imgData, "PNG", 0, 0, 210, 297)
            pdf.save(`letter-head-${applicationRef}.pdf`)

            toast.success("Letter head downloaded successfully!", { id: toastId })
        } catch (error) {
            console.error("Error generating letter head PDF:", error)
            toast.dismiss(toastId)
            toast.error("Failed to generate letter head PDF. Please try again.")
        } finally {
            setIsDownloadingLetterHead(false)
        }
    }, [
        admissionDetailRows,
        applicationRef,
        buildLetterHeadSignatureHtml,
        course?.name,
        degree?.name,
        issuedAt,
        offer,
        student?.name,
        university?.name,
    ])

    const handleViewConditionalLetter = useCallback(() => {
        if (!conditionalLetterBodyHtml) {
            toast.error("No conditional letter template is attached to this offer.")
            return
        }

        const signatureHtml = buildSignatureBlockHtml({
            status: offer?.status ?? "PENDING",
            fileUrl: offer?.file_url,
            studentName: student?.name,
            acceptedAt,
        })

        const html = buildTemplateOfferLetterHtml(conditionalLetterBodyHtml, {
            title: `Conditional Letter – ${student?.name || "Applicant"}`,
            signatureHtml,
            watermark: offer?.template_watermark ?? null,
        })

        const win = window.open("", "_blank")
        if (win) {
            win.document.write(html)
            win.document.close()
        }
    }, [acceptedAt, conditionalLetterBodyHtml, offer?.file_url, offer?.status, offer?.template_watermark, student?.name])

    const handleDownloadConditionalLetter = useCallback(async () => {
        if (!conditionalLetterBodyHtml) {
            toast.error("No conditional letter template is attached to this offer.")
            return
        }

        setIsDownloadingConditionalLetter(true)
        const toastId = toast.loading("Generating conditional letter PDF...")

        try {
            const { default: jsPDF } = await import("jspdf")
            const { default: html2canvas } = await import("html2canvas")

            let signatureBase64 = ""
            if (offer.status === "ACCEPTED" && offer.file_url) {
                try {
                    const response = await fetch(offer.file_url)
                    const blob = await response.blob()
                    signatureBase64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader()
                        reader.onload = () => resolve(reader.result as string)
                        reader.onerror = reject
                        reader.readAsDataURL(blob)
                    })
                } catch (e) {
                    console.error("Failed to fetch signature image:", e)
                }
            }

            const signatureHtml = signatureBase64
                ? `<div style="margin-top:32px;border-top:1px dashed #e5e7eb;padding-top:24px;display:flex;flex-direction:column;align-items:flex-end;">
                     <img src="${signatureBase64}" alt="Signature" style="width:140px;height:48px;object-fit:contain;background:transparent;mix-blend-mode:multiply;" />
                     <div style="font-size:10px;color:#9ca3af;margin-top:4px;text-align:right;">
                       <div style="font-weight:700;color:#374151;">${student?.name || ""}</div>
                       <div>Accepted &amp; Signed on ${acceptedAt || new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}</div>
                     </div>
                   </div>`
                : buildSignatureBlockHtml({
                      status: offer.status,
                      studentName: student?.name,
                      acceptedAt,
                  })

            const iframe = document.createElement("iframe")
            iframe.style.position = "fixed"
            iframe.style.left = "-9999px"
            iframe.style.top = "-9999px"
            iframe.style.width = "794px"
            iframe.style.height = "1123px"
            iframe.style.border = "none"
            document.body.appendChild(iframe)

            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
            if (!iframeDoc) throw new Error("Could not access iframe document")

            iframeDoc.open()
            iframeDoc.write(
                buildTemplateOfferLetterHtml(conditionalLetterBodyHtml, {
                    title: `Conditional Letter – ${student?.name || "Applicant"}`,
                    signatureHtml,
                    watermark: offer?.template_watermark ?? null,
                })
            )
            iframeDoc.close()

            await new Promise((resolve) => setTimeout(resolve, 300))

            const images = iframeDoc.getElementsByTagName("img")
            if (images.length > 0) {
                await Promise.all(
                    Array.from(images).map((img) => {
                        if (img.complete) return Promise.resolve()
                        return new Promise<void>((resolve) => {
                            img.onload = () => resolve()
                            img.onerror = () => resolve()
                        })
                    })
                )
            }

            const pageElements = Array.from(
                iframeDoc.querySelectorAll<HTMLElement>(".a4-page")
            )
            if (pageElements.length === 0) {
                throw new Error("Could not find conditional letter content")
            }

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            })

            for (let index = 0; index < pageElements.length; index += 1) {
                const pageElement = pageElements[index]
                const canvas = await html2canvas(pageElement, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: "#ffffff",
                    width: 794,
                    height: 1123,
                    windowWidth: 794,
                    windowHeight: 1123,
                })

                const imgData = canvas.toDataURL("image/png")
                if (index > 0) pdf.addPage()
                pdf.addImage(imgData, "PNG", 0, 0, 210, 297)
            }

            pdf.save(`conditional-letter-${applicationRef}.pdf`)

            document.body.removeChild(iframe)
            toast.success("Conditional letter downloaded successfully!", { id: toastId })
        } catch (error) {
            console.error("Error generating conditional letter PDF:", error)
            toast.dismiss(toastId)
            toast.error("Failed to generate conditional letter PDF. Please try again.")
        } finally {
            setIsDownloadingConditionalLetter(false)
        }
    }, [acceptedAt, applicationRef, conditionalLetterBodyHtml, offer, student?.name])

    if (isDownloadingLetterHead) {
        return <PageLoader />
    }

    if (isDownloadingConditionalLetter) {
        return <PageLoader />
    }

    if (!offerId || !isSessionReady || isLoading) {
        return <PageLoader />
    }

    if (isError || !offer) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Typography className="font-bold text-gray-700">Offer not found</Typography>
                <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    return (
        <main className="mx-auto max-w-7xl space-y-6 pb-10">
            {/* Page header */}
            <div className="flex flex-col gap-4 mt-12">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                        <Button
                            variant="outline"
                            size="icon"
                            asChild
                            className="rounded-xl shrink-0 size-10 border-white/40 bg-white/20"
                        >
                            <Link href="/dashboard/offer">
                                <ChevronLeft className="size-5" />
                            </Link>
                        </Button>
                        <div className="min-w-0 flex-1 space-y-1">
                            <Typography className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                                Admission Offer
                            </Typography>
                            <div className="flex flex-wrap items-center gap-2.5">
                                <Typography as="h1" font="title" className="text-xl sm:text-2xl font-bold truncate">
                                    {applicationRef}
                                </Typography>
                                <StatusBadge status={offer.status} />
                            </div>
                            <Typography font="sub-text" className="text-gray-500 text-sm">
                                {student?.name} · {courseDisplayName}
                            </Typography>
                        </div>
                    </div>

                    {canAcceptAndSign && me.data?.role === Role.AGENT ? (
                        <Button
                            type="button"
                            className="w-full sm:w-auto shrink-0 gap-2 bg-brand-byzantine hover:bg-brand-byzantine/90 text-white px-6"
                            onClick={handleCopySignLink}
                        >
                            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                            {copied ? "Copied!" : "Copy Sign Link"}
                        </Button>
                    ) : null}

                    {canAcceptAndSign && me.data?.role === Role.STUDENT ? (
                        <Button
                            type="button"
                            className="w-full sm:w-auto shrink-0 gap-2 bg-brand-byzantine hover:bg-brand-byzantine/90 text-white px-6"
                            onClick={openSignModal}
                        >
                            <FileCheck className="size-4" />
                            Accept & Sign
                        </Button>
                    ) : null}
                </div>
            </div>

            {/* At-a-glance summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mt-6">
                <SummaryMetric
                    label="University"
                    icon={<Building2 className="size-3.5" />}
                    value={
                        <Typography className="text-sm font-bold text-gray-900 line-clamp-2">
                            {university?.name || "—"}
                        </Typography>
                    }
                />
                <SummaryMetric
                    label="Course"
                    icon={<GraduationCap className="size-3.5" />}
                    value={
                        <Typography className="text-sm font-bold text-gray-900 line-clamp-2">
                            {course?.name || "—"}
                        </Typography>
                    }
                />
                <SummaryMetric
                    label="Intake"
                    icon={<Calendar className="size-3.5" />}
                    value={
                        <Typography className="text-sm font-bold text-gray-900">{intakeDateFormatted}</Typography>
                    }
                />
                <SummaryMetric
                    label="Fees"
                    icon={<CreditCard className="size-3.5" />}
                    value={
                        <Typography className="text-sm font-bold text-gray-900">{feesFormatted}</Typography>
                    }
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                {/* Main content */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                    <BluryCard isCentered={false} className="rounded-2xl" childClass="p-5 sm:p-6">
                        <SectionHeader icon={GraduationCap} title="Course & Degree Details" />
                        <div className="mt-2">
                            <DetailRow
                                label="University"
                                value={university?.name}
                                icon={<Building2 className="size-3.5 text-gray-400 shrink-0" />}
                            />
                            <DetailRow label="Course" value={course?.name} />
                            <DetailRow label="Degree" value={degree?.name} />
                            <DetailRow label="Duration" value={degree?.duration} />
                            <DetailRow label="Study Mode" value={formatStudyMode(degree?.study_mode)} />
                            <DetailRow
                                label="Intake Date"
                                value={intakeDateFormatted}
                            // icon={<Clock className="size-3.5 text-gray-400 shrink-0" />}
                            />
                            <DetailRow label="Fees" value={feesFormatted} />
                            <DetailRow label="Location" value={degree?.location} />
                            <DetailRow label="Language of Study" value={degree?.language_of_study} />
                            <DetailRow
                                label="Credits"
                                value={degree?.credits != null ? String(degree.credits) : undefined}
                            />
                            <DetailRow
                                label="Application Deadline"
                                value={formatIntakeDate(course?.deadline_date) ?? undefined}
                            // icon={<Calendar className="size-3.5 text-gray-400 shrink-0" />}
                            />
                        </div>
                    </BluryCard>

                    <BluryCard isCentered={false} className="rounded-2xl" childClass="p-5 sm:p-6 space-y-4">
                        <SectionHeader icon={Building2} title="Letter Head" />
                        <Typography font="sub-text" className="text-sm text-gray-600">
                            Official offer of admission with university branding and admission details for{" "}
                            {courseDisplayName}.
                        </Typography>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl gap-2 border-white/50 bg-white/30"
                                onClick={handleViewLetterHead}
                                disabled={isDownloadingLetterHead}
                            >
                                <Eye className="size-4" />
                                View
                            </Button>
                            <Button
                                className="flex-1 rounded-xl gap-2 bg-brand-byzantine hover:bg-brand-byzantine/90"
                                onClick={handleDownloadLetterHead}
                                disabled={isDownloadingLetterHead}
                            >
                                <Download className="size-4" />
                                Download
                            </Button>
                        </div>
                    </BluryCard>

                    <BluryCard isCentered={false} className="rounded-2xl" childClass="p-5 sm:p-6 space-y-4">
                        <SectionHeader icon={FileCheck} title="Conditional Letter" />
                        <Typography font="sub-text" className="text-sm text-gray-600">
                            {hasConditionalLetter
                                ? "Template-based conditional letter created from your saved document template."
                                : "No conditional letter template is attached to this offer yet."}
                        </Typography>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl gap-2 border-white/50 bg-white/30"
                                onClick={handleViewConditionalLetter}
                                disabled={!hasConditionalLetter || isDownloadingConditionalLetter}
                            >
                                <Eye className="size-4" />
                                View
                            </Button>
                            <Button
                                className="flex-1 rounded-xl gap-2 bg-brand-byzantine hover:bg-brand-byzantine/90"
                                onClick={handleDownloadConditionalLetter}
                                disabled={!hasConditionalLetter || isDownloadingConditionalLetter}
                            >
                                <Download className="size-4" />
                                Download
                            </Button>
                        </div>
                    </BluryCard>

                    {reviews.length > 0 && (
                        <BluryCard isCentered={false} className="rounded-2xl" childClass="p-5 sm:p-6">
                            <SectionHeader
                                icon={MessageSquare}
                                title="Application Reviews"
                                trailing={
                                    <span className="bg-white/50 text-gray-600 px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/50">
                                        {reviews.length}
                                    </span>
                                }
                            />
                            <div className="mt-4 space-y-3">
                                {reviews.map((review: any, idx: number) => (
                                    <div
                                        key={review.id || idx}
                                        className="rounded-xl border border-white/50 bg-white/35 p-4 space-y-3"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <Typography className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                                Review {idx + 1} ·{" "}
                                                {new Date(review.created_at).toLocaleDateString("en-US", {
                                                    dateStyle: "medium",
                                                })}
                                            </Typography>
                                            <StatusBadge status={review.status} />
                                        </div>
                                        {review.feedback && (
                                            <Typography className="text-sm text-gray-700 leading-relaxed">
                                                {review.feedback}
                                            </Typography>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </BluryCard>
                    )}
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-6 lg:self-start">
                    <BluryCard
                        isCentered={false}
                        className="rounded-2xl"
                        childClass="p-5 sm:p-6 space-y-5"
                    >
                        <SectionHeader icon={FileCheck} title="Offer & Application" />
                        <div className="space-y-0">
                            <DetailRow
                                label="Offer Status"
                                value={<StatusBadge status={offer.status} />}
                            />
                            <DetailRow label="Offer Issued" value={issuedAt} />
                            <DetailRow
                                label="Application"
                                value={<StatusBadge status={app?.status} />}
                            />
                            <DetailRow label="Applied On" value={appCreatedAt} />
                            {offer.status === "ACCEPTED" && (
                                <DetailRow
                                    label="Signature"
                                    value={
                                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full uppercase tracking-wide">
                                            Signed
                                        </span>
                                    }
                                />
                            )}
                            {acceptedAt && (
                                <DetailRow label="Accepted On" value={acceptedAt} />
                            )}
                        </div>
                        {offer.feedback && (
                            <div className="rounded-xl border border-amber-200/50 bg-amber-50/30 p-4 space-y-1">
                                <Typography className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                    University feedback
                                </Typography>
                                <Typography font="small" className="text-gray-700 leading-relaxed">
                                    {offer.feedback}
                                </Typography>
                            </div>
                        )}
                    </BluryCard>

                    {(agent || latestReview) && (
                        <BluryCard isCentered={false} className="rounded-2xl" childClass="p-5 sm:p-6 space-y-4">
                            {agent && (
                                <div className="space-y-3 pb-4 border-b border-white/20">
                                    <Typography className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                        Submitted by University Partner
                                    </Typography>
                                    <Typography className="font-bold text-gray-800">{agent.name || "—"}</Typography>
                                    {agent.email && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Mail className="size-3.5 shrink-0" />
                                            <Typography className="text-sm break-all">{agent.email}</Typography>
                                        </div>
                                    )}
                                </div>
                            )}
                            {latestReview && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        {latestReview.status === "OFFERED" || latestReview.status === "APPROVED" ? (
                                            <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                                        ) : (
                                            <AlertCircle className="size-4 text-amber-600 shrink-0" />
                                        )}
                                        <Typography className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                            Latest review
                                        </Typography>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <StatusBadge status={latestReview.status} />
                                        <Typography className="text-[11px] text-gray-400">
                                            {new Date(latestReview.created_at).toLocaleDateString("en-US", {
                                                dateStyle: "medium",
                                            })}
                                        </Typography>
                                    </div>
                                    {latestReview.feedback && (
                                        <Typography className="text-sm text-gray-600 leading-relaxed">
                                            {latestReview.feedback}
                                        </Typography>
                                    )}
                                </div>
                            )}
                        </BluryCard>
                    )}


                </div>
            </div>

            {/* Signature Draw Modal */}
            {isSignModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#f8f9fa] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-white/20 animate-in zoom-in-95 duration-200">
                        {/* Close button */}
                        <button
                            onClick={() => setIsSignModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-200/50"
                        >
                            <X className="size-5" />
                        </button>

                        <div className="text-center space-y-1.5">
                            <Typography font="title" className="text-xl font-extrabold text-gray-900">
                                Draw Your Signature
                            </Typography>
                            <Typography className="text-xs text-gray-500">
                                Please draw your signature in the white box below using your mouse or touch screen.
                            </Typography>
                        </div>

                        {/* Drawing Canvas Container */}
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-inner p-2 relative">
                            <canvas
                                ref={canvasRef}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                className="w-full h-48 cursor-crosshair touch-none bg-white rounded-xl"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between gap-3">
                            <Button
                                variant="outline"
                                className="rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 font-semibold px-5"
                                onClick={clearCanvas}
                                disabled={isSubmitting}
                            >
                                Clear
                            </Button>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    className="rounded-xl text-gray-500 hover:bg-gray-100"
                                    onClick={() => setIsSignModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-brand-byzantine hover:bg-brand-byzantine/90 text-white rounded-xl font-bold px-8 py-2.5 shadow-lg shadow-brand-byzantine/20 transition-all"
                                    onClick={handleSaveSignature}
                                    disabled={isSubmitting || !hasSigned}
                                >
                                    {isSubmitting ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
