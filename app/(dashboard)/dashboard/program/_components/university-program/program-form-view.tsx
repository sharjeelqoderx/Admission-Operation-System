"use client"

import { memo, type ChangeEvent } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Typography } from "@/components/shared/Typography"
import { DatePicker } from "@/components/shared/date-picker"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ErrorView } from "@/components/shared/error-view"
import type { UniversityProgramUpsert } from "@/types/schemas/university-program"

type DocumentTypeOption = {
    id: string
    name: string
}

type UniversityProgramFormViewProps = {
    mode: "create" | "edit"
    values: UniversityProgramUpsert
    documentTypes: DocumentTypeOption[]
    selectedDocumentTypeIds: string[]
    documentRequirements: Array<{ document_type_id: string; requirement_type: "REQUIRED" | "OPTIONAL" }>
    isSubmitting: boolean
    errorMessage: string | null
    onChange: <K extends keyof UniversityProgramUpsert>(key: K, value: UniversityProgramUpsert[K]) => void
    onToggleDocumentType: (documentTypeId: string) => void
    onSetRequirementType: (documentTypeId: string, requirementType: "REQUIRED" | "OPTIONAL") => void
    onSubmit: () => void
}

function FieldLabel({ children }: { children: string }) {
    return (
        <Typography as="label" font="small" className="mb-2 block font-semibold text-brand-primary">
            {children}
        </Typography>
    )
}

export const UniversityProgramFormView = memo(function UniversityProgramFormView({
    mode,
    values,
    documentTypes,
    selectedDocumentTypeIds,
    documentRequirements,
    isSubmitting,
    errorMessage,
    onChange,
    onToggleDocumentType,
    onSetRequirementType,
    onSubmit,
}: UniversityProgramFormViewProps) {
    return (
        <div className="mx-auto max-w-[1200px] space-y-8 px-4 pb-20 pt-4 lg:px-8">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/program">
                    <Button variant="outline" size="icon" className="size-9 rounded-full sm:size-10">
                        <ChevronLeft className="size-5" />
                    </Button>
                </Link>
                <Typography as="span" font="sub-text" className="font-medium text-gray-500">
                    Back to Programs
                </Typography>
            </div>

            <div className="space-y-2">
                <Typography as="h2" font="sub-heading" className="font-bold text-brand-primary">
                    Program Details
                </Typography>
                <Typography as="p" font="sub-text" className="max-w-3xl text-gray-500">
                    {mode === "create"
                        ? "Create a new academic program with tuition, commission, and admission requirements."
                        : "Update program information, tuition settings, and admission requirements."}
                </Typography>
            </div>

            {errorMessage ? <ErrorView message={errorMessage} /> : null}

            <div className="space-y-8">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                        <FieldLabel>Program Name</FieldLabel>
                        <Input
                            value={values.name}
                            onChange={(event) => onChange("name", event.target.value)}
                            placeholder="Enter Program name"
                            className="h-11 bg-white"
                        />
                    </div>
                    <div>
                        <FieldLabel>Category</FieldLabel>
                        <Input
                            value={values.category ?? ""}
                            onChange={(event) => onChange("category", event.target.value)}
                            placeholder="Enter your Category"
                            className="h-11 bg-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <div>
                        <FieldLabel>Tuition Fees</FieldLabel>
                        <Input
                            value={values.tuition_fees ?? ""}
                            onChange={(event) => onChange("tuition_fees", event.target.value)}
                            placeholder="Enter tuition fees"
                            className="h-11 bg-white"
                        />
                    </div>
                    <div>
                        <FieldLabel>University Partner Commission</FieldLabel>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={values.agent_commission ?? ""}
                            onChange={(event) =>
                                onChange(
                                    "agent_commission",
                                    event.target.value
                                        ? Math.min(100, Math.max(0, Number(event.target.value)))
                                        : null
                                )
                            }
                            onKeyDown={(event) =>
                                ["e", "E", "-", "+"].includes(event.key) &&
                                event.preventDefault()
                            }
                            placeholder="Enter University Partner Percent"
                            className="h-11 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>
                    <div>
                        <FieldLabel>Location</FieldLabel>
                        <Input
                            value={values.location ?? ""}
                            onChange={(event) => onChange("location", event.target.value)}
                            placeholder="Enter Location"
                            className="h-11 bg-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <div>
                        <FieldLabel>Program Length</FieldLabel>
                        <Input
                            value={values.program_length ?? ""}
                            onChange={(event) => onChange("program_length", event.target.value)}
                            placeholder="Enter program length"
                            className="h-11 bg-white"
                        />
                    </div>
                    <div>
                        <FieldLabel>Study Type</FieldLabel>
                        <Select
                            value={values.study_type ?? ""}
                            onValueChange={(value) =>
                                onChange("study_type", value as UniversityProgramUpsert["study_type"])
                            }
                        >
                            <SelectTrigger className="h-11 bg-white">
                                <SelectValue placeholder="Enter study type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="full_time">Full Time</SelectItem>
                                <SelectItem value="part_time">Part Time</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <FieldLabel>Intake Date</FieldLabel>
                        <DatePicker
                            value={values.intake_date ?? ""}
                            onChange={(value) => onChange("intake_date", value || null)}
                            placeholder="Enter intake date"
                            className="h-11 w-full"
                        />
                    </div>
                </div>

                <div>
                    <FieldLabel>Application Deadline</FieldLabel>
                    <DatePicker
                        value={values.application_deadline ?? ""}
                        onChange={(value) => onChange("application_deadline", value || null)}
                        placeholder="Enter application deadline"
                        className="h-11 w-full max-w-sm"
                    />
                </div>

                <div>
                    <FieldLabel>Program Detail</FieldLabel>
                    <Textarea
                        value={values.program_detail ?? ""}
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                            onChange("program_detail", event.target.value)
                        }
                        placeholder="Enter program detail"
                        className="bg-white"
                    />
                </div>

                <div>
                    <FieldLabel>Admission Requirements</FieldLabel>
                    <Textarea
                        value={values.admission_requirements ?? ""}
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                            onChange("admission_requirements", event.target.value)
                        }
                        placeholder="Enter admission requirements"
                        className="bg-white"
                    />
                </div>

                <div>
                    <FieldLabel>Perspectives</FieldLabel>
                    <Textarea
                        value={values.perspectives ?? ""}
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                            onChange("perspectives", event.target.value)
                        }
                        placeholder="Enter perspectives"
                        className="bg-white"
                    />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                        <FieldLabel>Your Prospect After Graduation</FieldLabel>
                        <Textarea
                            value={values.prospects_after_graduation ?? ""}
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                                onChange("prospects_after_graduation", event.target.value)
                            }
                            placeholder="Enter prospects after graduation"
                            className="bg-white"
                        />
                    </div>
                    <div>
                        <FieldLabel>Our Competency Model</FieldLabel>
                        <Textarea
                            value={values.competency_model ?? ""}
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                                onChange("competency_model", event.target.value)
                            }
                            placeholder="Enter competency model"
                            className="bg-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                        <FieldLabel>Professional Skills</FieldLabel>
                        <Textarea
                            value={values.professional_skills ?? ""}
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                                onChange("professional_skills", event.target.value)
                            }
                            placeholder="Enter professional skills"
                            className="bg-white"
                        />
                    </div>
                    <div>
                        <FieldLabel>Management Skills</FieldLabel>
                        <Textarea
                            value={values.management_skills ?? ""}
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                                onChange("management_skills", event.target.value)
                            }
                            placeholder="Enter management skills"
                            className="bg-white"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <FieldLabel>Upload Documents</FieldLabel>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {documentTypes.map((documentType) => {
                            const isSelected = selectedDocumentTypeIds.includes(documentType.id)
                            const requirement = documentRequirements.find(
                                (req) => req.document_type_id === documentType.id
                            )
                            const isRequired = isSelected && requirement?.requirement_type === "REQUIRED"

                            return (
                                <button
                                    key={documentType.id}
                                    type="button"
                                    onClick={() => {
                                        if (isRequired) {
                                            // If required, remove it
                                            onToggleDocumentType(documentType.id)
                                        } else {
                                            // Add or keep as required
                                            if (!isSelected) {
                                                onToggleDocumentType(documentType.id)
                                            }
                                            onSetRequirementType(documentType.id, "REQUIRED")
                                        }
                                    }}
                                    className={
                                        isRequired
                                            ? "relative cursor-pointer rounded-xl border-2 border-brand-byzantine bg-brand-byzantine/5 px-4 py-3 text-left transition-all hover:bg-brand-byzantine/10"
                                            : "relative cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-3 text-left transition-all hover:bg-gray-50"
                                    }
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <Typography
                                                as="span"
                                                font="sub-text"
                                                className="font-semibold text-brand-primary"
                                            >
                                                {documentType.name}
                                            </Typography>
                                        </div>
                                        {isRequired && (
                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-byzantine">
                                                <svg
                                                    className="h-3 w-3 text-white"
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2.5"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path d="M5 13l4 4L19 7"></path>
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <Typography
                                        as="span"
                                        font="small"
                                        className={
                                            isRequired
                                                ? "mt-1 block text-xs font-medium text-brand-byzantine"
                                                : "mt-1 block text-xs text-gray-500"
                                        }
                                    >
                                        {isRequired ? "Required" : "Optional"}
                                    </Typography>
                                </button>
                            )
                        })}
                    </div>
                    <Typography as="p" font="small" className="text-xs text-gray-500">
                        Click on a document to mark it as Required. Click again to unmark.
                    </Typography>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl border-brand-byzantine px-6 font-semibold text-brand-byzantine"
                        onClick={onSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Saving..." : "Save Program Info"}
                    </Button>
                </div>
            </div>
        </div>
    )
})
