"use client"

import React, { useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Spinner } from "@/components/shared/page-loader"
import { DetailPageSkeleton } from "@/components/shared/page-skeleton"
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
    Check
} from "lucide-react"
import { toast } from "sonner"
import {
    formatIntakeDate,
    formatProgramDate,
    formatStudyMode,
} from "@/lib/utils/program"
import {
    buildDbBedingteZuLetterHtml,
    buildDbBedingteZuLetterParamsFromOffer,
    openDbBedingteZuLetterPreview,
    LETTER_CONFIGS,
    type LetterType,
} from "@/components/shared/db-bedingte-zu/db-bedingte-zu"


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

export default function OfferSignPage() {
    const params = useParams()
    const router = useRouter()
    const offerId = params?.offerId as string

    const [isSignModalOpen, setIsSignModalOpen] = React.useState(false)
    const [isDrawing, setIsDrawing] = React.useState(false)
    const [hasSigned, setHasSigned] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [isDownloadingConditionalLetter, setIsDownloadingConditionalLetter] =
        React.useState(false)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

    const fetchOffer = useCallback(async () => {
        const res = await fetch(`/api/public-offer/${offerId}`)
        if (!res.ok) throw new Error("Failed to fetch offer")
        const json = await res.json()
        return json.data
    }, [offerId])

    const { data: offer, isLoading, isError, refetch } = useQuery({
        queryKey: ["offer", offerId],
        queryFn: fetchOffer,
        enabled: Boolean(offerId),
    })

    useEffect(() => {
        // Automatically open sign modal when offer loads and is ready to sign
        if (offer) {
            const offerStatus = String(offer.status ?? "PENDING").toUpperCase()
            const isOfferSigned = offerStatus === "ACCEPTED" && Boolean(offer.file_url)
            const canAcceptAndSign = !isOfferSigned && offerStatus !== "REJECTED"
            if (canAcceptAndSign) {
                setIsSignModalOpen(true)
            }
        }
    }, [offer])

    useEffect(() => {
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
            const response = await fetch(`/api/public-offer/${offerId}`, {
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
    const isDbBedingteZuEnabled = true

    const openSignModal = useCallback(() => {
        setHasSigned(false)
        setIsSignModalOpen(true)
    }, [])

    const handleViewDbBedingteZuLetter = useCallback((letterType: LetterType) => {
        if (!offer) return

        const params = buildDbBedingteZuLetterParamsFromOffer(offer, window.location.origin)
        const html = buildDbBedingteZuLetterHtml({ ...params, letterType })

        const opened = openDbBedingteZuLetterPreview(html)
        if (!opened) {
            toast.error("Could not open preview. Please allow pop-ups for this site.")
        }
    }, [offer])

    const handleDownloadDbBedingteZuPDF = useCallback(async (letterType: LetterType) => {
        if (typeof window === "undefined" || !offer) {
            toast.error("Offer data is not ready yet.")
            return
        }

        const offerSnapshot = offer
        const pdfFileName = `db-bedingte-zu-${letterType}-${applicationRef}.pdf`

        setIsDownloadingConditionalLetter(true)
        const toastId = toast.loading("Generating conditional letter PDF...")

        try {
            const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
                import("jspdf"),
                import("html2canvas"),
            ])

            const origin = window.location.origin
            const params = buildDbBedingteZuLetterParamsFromOffer(offerSnapshot, origin)
            const html = buildDbBedingteZuLetterHtml({ ...params, letterType })

            const iframe = document.createElement("iframe")
            iframe.style.position = "fixed"
            iframe.style.left = "-9999px"
            iframe.style.top = "-9999px"
            iframe.style.width = "794px"
            iframe.style.height = "1123px"
            iframe.style.border = "none"
            document.body.appendChild(iframe)

            const doc = iframe.contentDocument || iframe.contentWindow?.document
            if (!doc) throw new Error("Could not access iframe document")

            doc.open()
            doc.write(html)
            doc.close()

            const images = doc.getElementsByTagName("img")
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

            const pages = Array.from(doc.querySelectorAll<HTMLElement>(".a4-page"))
            if (pages.length === 0) throw new Error("No pages found for PDF generation")

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            })

            for (let i = 0; i < pages.length; i += 1) {
                const pageEl = pages[i]
                const canvas = await html2canvas(pageEl, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    logging: false,
                    width: 794,
                    height: 1123,
                    windowWidth: 794,
                    windowHeight: 1123,
                })

                const imgData = canvas.toDataURL("image/png")
                if (i > 0) pdf.addPage()
                pdf.addImage(imgData, "PNG", 0, 0, 210, 297)
            }

            document.body.removeChild(iframe)

            pdf.save(pdfFileName)
            toast.success("Conditional letter PDF downloaded successfully!")
        } catch (err) {
            console.error(err)
            toast.error("Failed to generate conditional letter PDF. Please try again.")
        } finally {
            toast.dismiss(toastId)
            setIsDownloadingConditionalLetter(false)
        }
    }, [applicationRef, offer])

    const handleViewLetter = useCallback(() => {
        if (!offer) return

        const signatureHtml = offer.status === "ACCEPTED" && offer.file_url
            ? `<div style="margin-top:auto;border-top:1px dashed #e5e7eb;padding-top:24px;display:flex;flex-direction:column;align-items:flex-end;">
                 <img src="${offer.file_url}" alt="Signature" style="width:140px;height:48px;object-fit:contain;background:transparent;mix-blend-mode:multiply;" />
                 <div style="font-size:10px;color:#9ca3af;margin-top:4px;text-align:right;">
                   <div style="font-weight:700;color:#374151;">${student?.name || ""}</div>
                   <div>Accepted &amp; Signed on ${acceptedAt || new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}</div>
                 </div>
               </div>`
            : `<div style="margin-top:auto;border-top:1px dashed #f3f4f6;padding-top:24px;display:flex;flex-direction:column;align-items:flex-end;">
                 <div style="font-size:10px;color:#d1d5db;font-style:italic;">Signature Required</div>
                 <div style="font-size:10px;color:#9ca3af;margin-top:4px;">Pending Student Signature</div>
               </div>`

        const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Offer Letter – ${student?.name || "Applicant"}</title>
        <style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#f3f4f6;display:flex;justify-content:center;padding:40px 16px;font-family:Georgia,serif;}@media print{body{background:white;padding:0;}.page{box-shadow:none!important;}}</style>
        </head><body>
        <div class="page" style="background:white;max-width:720px;width:100%;min-height:1000px;padding:60px;box-shadow:0 4px 32px rgba(0,0,0,0.12);border-radius:8px;display:flex;flex-direction:column;gap:32px;position:relative;">
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0.03;pointer-events:none;transform:rotate(-35deg);"><span style="font-size:120px;font-weight:900;letter-spacing:8px;color:black;">OFFICIAL</span></div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="font-size:22px;font-weight:900;color:#1a1a2e;">${university?.name || "University"}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:4px;">Official Offer of Admission</div>
            </div>
            <div style="text-align:right;font-size:11px;color:#9ca3af;">
              <div>Date Issued</div>
              <div style="font-weight:700;color:#374151;">${issuedAt}</div>
              <div style="margin-top:4px;">Ref: ${app?.application_no || ("APP-" + app?.id?.slice(0, 8).toUpperCase())}</div>
            </div>
          </div>
          <hr style="border:none;border-top:2px solid #f3f4f6;"/>
          <div style="font-size:15px;color:#374151;">Dear <strong>${student?.name || "Applicant"}</strong>,</div>
          <div style="font-size:14px;color:#4b5563;line-height:1.8;">
            We are pleased to offer you admission to the <strong>${course?.name || "course"}</strong>${degree?.name ? ` (${degree.name})` : ""} at <strong>${university?.name || "our university"}</strong>.
          </div>
          <div style="font-size:14px;color:#4b5563;line-height:1.8;">
            Your academic achievement and potential make you an excellent candidate for our program. This offer is subject to the terms and conditions outlined in the full admission package.
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;">
            <thead><tr style="background:#f9fafb;"><th colspan="2" style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Admission Details</th></tr></thead>
            <tbody>
              ${admissionDetailRows.map(([label, value]) =>
            `<tr><td style="padding:9px 14px;color:#6b7280;width:40%;border-bottom:1px solid #f3f4f6;">${label}</td><td style="padding:9px 14px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${value}</td></tr>`
        ).join("")}
            </tbody>
          </table>
          ${signatureHtml}
          <div style="font-size:10px;color:#d1d5db;text-align:center;margin-top:16px;">This is an official offer letter generated by the Admission Operation System.</div>
        </div>
        </body></html>`

        const win = window.open("", "_blank")
        if (win) {
            win.document.write(html)
            win.document.close()
        }
    }, [
        acceptedAt,
        admissionDetailRows,
        app?.application_no,
        app?.id,
        course?.name,
        degree?.name,
        issuedAt,
        offer,
        student?.name,
        university?.name,
    ])

    const handleDownloadPDF = useCallback(async () => {
        if (!offer) return

        const toastId = toast.loading("Generating PDF...")

        try {
            const { default: jsPDF } = await import("jspdf")
            const { default: html2canvas } = await import("html2canvas")

            // 1. Fetch and convert signature to base64 if accepted and has file_url
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

            // 2. Build the HTML content for the PDF container
            const signatureHtml = signatureBase64
                ? `<div style="margin-top:auto;border-top:1px dashed #e5e7eb;padding-top:24px;display:flex;flex-direction:column;align-items:flex-end;">
                     <img src="${signatureBase64}" alt="Signature" style="width:140px;height:48px;object-fit:contain;background:transparent;mix-blend-mode:multiply;" />
                     <div style="font-size:10px;color:#9ca3af;margin-top:4px;text-align:right;">
                       <div style="font-weight:700;color:#374151;">${student?.name || ""}</div>
                       <div>Accepted &amp; Signed on ${acceptedAt || new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}</div>
                     </div>
                   </div>`
                : `<div style="margin-top:auto;border-top:1px dashed #f3f4f6;padding-top:24px;display:flex;flex-direction:column;align-items:flex-end;">
                     <div style="font-size:10px;color:#d1d5db;font-style:italic;">Signature Required</div>
                     <div style="font-size:10px;color:#9ca3af;margin-top:4px;">Pending Student Signature</div>
                   </div>`

            // Create off-screen iframe to isolate CSS environment from parent stylesheets
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
            iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8" />
              <style>
                * {
                  box-sizing: border-box;
                  margin: 0;
                  padding: 0;
                }
                html, body {
                  margin: 0;
                  padding: 0;
                  width: 794px;
                  height: 1123px;
                  overflow: hidden;
                  font-family: Georgia, serif;
                  background-color: #ffffff;
                }
              </style>
            </head>
            <body>
              <div style="width:100%;height:100%;padding:60px;display:flex;flex-direction:column;gap:32px;position:relative;box-sizing:border-box;background:#ffffff;justify-content:space-between;">
                <div style="display:flex;flex-direction:column;gap:32px;width:100%;">
                  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0.03;pointer-events:none;transform:rotate(-35deg);"><span style="font-size:120px;font-weight:900;letter-spacing:8px;color:black;user-select:none;">OFFICIAL</span></div>
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%;">
                    <div>
                      <div style="font-size:22px;font-weight:900;color:#1a1a2e;">${university?.name || "University"}</div>
                      <div style="font-size:12px;color:#6b7280;margin-top:4px;">Official Offer of Admission</div>
                    </div>
                    <div style="text-align:right;font-size:11px;color:#9ca3af;">
                      <div>Date Issued</div>
                      <div style="font-weight:700;color:#374151;">${issuedAt}</div>
                      <div style="margin-top:4px;">Ref: ${app?.application_no || ("APP-" + app?.id?.slice(0, 8).toUpperCase())}</div>
                    </div>
                  </div>
                  <hr style="border:none;border-top:2px solid #f3f4f6;width:100%;"/>
                  <div style="font-size:15px;color:#374151;width:100%;">Dear <strong>${student?.name || "Applicant"}</strong>,</div>
                  <div style="font-size:14px;color:#4b5563;line-height:1.8;width:100%;">
                    We are pleased to offer you admission to the <strong>${course?.name || "course"}</strong>${degree?.name ? ` (${degree.name})` : ""} at <strong>${university?.name || "our university"}</strong>.
                  </div>
                  <div style="font-size:14px;color:#4b5563;line-height:1.8;width:100%;">
                    Your academic achievement and potential make you an excellent candidate for our program. This offer is subject to the terms and conditions outlined in the full admission package.
                  </div>
                  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;">
                    <thead><tr style="background:#f9fafb;"><th colspan="2" style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Admission Details</th></tr></thead>
                    <tbody>
                      ${admissionDetailRows.map(([label, value]) =>
            `<tr><td style="padding:9px 14px;color:#6b7280;width:40%;border-bottom:1px solid #f3f4f6;">${label}</td><td style="padding:9px 14px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${value}</td></tr>`
        ).join("")}
                    </tbody>
                  </table>
                </div>
                <div style="width:100%;display:flex;flex-direction:column;gap:16px;">
                  ${signatureHtml}
                  <div style="font-size:10px;color:#d1d5db;text-align:center;width:100%;">This is an official offer letter generated by the Admission Operation System.</div>
                </div>
              </div>
            </body>
            </html>
            `)
            iframeDoc.close()

            // Wait for images to load inside the iframe (if signature exists)
            const images = iframeDoc.getElementsByTagName("img")
            if (images.length > 0) {
                await Promise.all(
                    Array.from(images).map(img => {
                        if (img.complete) return Promise.resolve()
                        return new Promise<void>((resolve) => {
                            img.onload = () => resolve()
                            img.onerror = () => resolve()
                        })
                    })
                )
            } else {
                await new Promise(resolve => setTimeout(resolve, 100))
            }

            // Render to canvas
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

            // Remove iframe from DOM
            document.body.removeChild(iframe)

            const imgData = canvas.toDataURL("image/png")
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            })

            pdf.addImage(imgData, "PNG", 0, 0, 210, 297)
            pdf.save(`offer-${app?.application_no || offerId}.pdf`)

            toast.dismiss(toastId)
            toast.success("PDF downloaded successfully!")
        } catch (error) {
            console.error("Error generating PDF:", error)
            toast.dismiss(toastId)
            toast.error("Failed to generate PDF. Please try again.")
        }
    }, [
        acceptedAt,
        admissionDetailRows,
        app?.application_no,
        course?.name,
        degree?.name,
        issuedAt,
        offer,
        offerId,
        student?.name,
        university?.name,
    ])

    if (isDownloadingConditionalLetter) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Spinner size="lg" />
            </div>
        )
    }

    if (!offerId || isLoading) {
        return <DetailPageSkeleton />
    }

    if (isError || !offer) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Typography className="font-bold text-gray-700">Offer not found</Typography>
            </div>
        )
    }

    return (
        <main className="mx-auto max-w-7xl space-y-6 pb-10 pt-8 px-4">
            {/* Page header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
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

                    {canAcceptAndSign && (
                        <Button
                            type="button"
                            className="w-full sm:w-auto shrink-0 gap-2 bg-brand-byzantine hover:bg-brand-byzantine/90 text-white px-6"
                            onClick={openSignModal}
                        >
                            <FileCheck className="size-4" />
                            Accept & Sign
                        </Button>
                    )}
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
                            />
                        </div>
                    </BluryCard>

                    {isDbBedingteZuEnabled && (
                        <BluryCard isCentered={false} className="rounded-2xl" childClass="p-5 sm:p-6 space-y-4">
                            <SectionHeader icon={FileCheck} title="Conditional Admission Letters" />
                            <Typography font="sub-text" className="text-sm text-gray-600">
                                View or download any of the 9 conditional admission letters.
                            </Typography>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(LETTER_CONFIGS).map(([letterTypeKey, config]) => {
                                    const letterType = letterTypeKey as LetterType
                                    return (
                                        <div
                                            key={letterType}
                                            className="flex flex-col gap-2 p-4 bg-white/30 border border-white/50 rounded-xl"
                                        >
                                            <Typography className="text-sm font-bold text-gray-800">
                                                {config.courseNameEN}
                                            </Typography>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 rounded-xl gap-1.5 border-white/50 bg-white/30 text-sm"
                                                    onClick={() => handleViewDbBedingteZuLetter(letterType)}
                                                >
                                                    <Eye className="size-3.5" />
                                                    View
                                                </Button>
                                                <Button
                                                    className="flex-1 rounded-xl gap-1.5 bg-brand-byzantine hover:bg-brand-byzantine/90 text-sm"
                                                    onClick={() => handleDownloadDbBedingteZuPDF(letterType)}
                                                    disabled={isDownloadingConditionalLetter}
                                                >
                                                    <Download className="size-3.5" />
                                                    Download
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </BluryCard>
                    )}

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
                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
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

                    <BluryCard
                        isCentered={false}
                        className="rounded-2xl w-full"
                        childClass="p-5 sm:p-6 space-y-4"
                    >
                        <SectionHeader icon={FileCheck} title="Offer Letter" />
                        <Typography font="sub-text" className="text-sm text-gray-600">
                            {isOfferSigned
                                ? `Signed by ${student?.name || "applicant"} on ${acceptedAt || "—"}.`
                                : "Open or download your official offer letter."}
                        </Typography>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl gap-2 border-white/50 bg-white/30"
                                onClick={handleViewLetter}
                            >
                                <Eye className="size-4" />
                                View
                            </Button>
                            <Button
                                className="flex-1 rounded-xl gap-2 bg-brand-byzantine hover:bg-brand-byzantine/90"
                                onClick={handleDownloadPDF}
                            >
                                <Download className="size-4" />
                                Download
                            </Button>
                        </div>
                    </BluryCard>


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
