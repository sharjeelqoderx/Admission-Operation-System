"use client"

import { DegreeDocumentsPanel } from "../../document/_component/degree-documents-panel"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

type DegreeDocumentsModalProps = {
    isOpen: boolean
    onClose: () => void
    studentId: string
    degreeId: string
}

export function DegreeDocumentsModal({
    isOpen,
    onClose,
    studentId,
    degreeId,
}: DegreeDocumentsModalProps) {
    // Close on Escape key and prevent body scroll
    useEffect(() => {
        if (isOpen) {
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden'
            
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === "Escape") onClose()
            }
            document.addEventListener("keydown", handleEscape)
            
            return () => {
                document.body.style.overflow = 'unset'
                document.removeEventListener("keydown", handleEscape)
            }
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <>
            {/* Light backdrop with sidebar offset - matching the image */}
            <div 
                className="fixed inset-0 left-64 bg-black/20 backdrop-blur-[2px] z-[100]"
                onClick={onClose}
            />
            
            {/* Modal with proper padding from top - no content should be hidden */}
            <div className="fixed top-8 bottom-4 left-64 right-0 z-[101] flex items-center justify-center px-6">
                <div 
                    className="relative w-full max-w-[1400px] h-[82vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header - always visible */}
                    <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-white shrink-0">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Program documents</h2>
                            <p className="text-sm text-gray-500 mt-1">Upload and manage required documents for this program.</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="size-9 rounded-lg hover:bg-gray-100 shrink-0"
                        >
                            <X className="size-5 text-gray-600" />
                        </Button>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto bg-white">
                        <div className="px-8 py-6">
                            <DegreeDocumentsPanel
                                studentId={studentId}
                                degreeId={degreeId}
                                variant="modal"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
