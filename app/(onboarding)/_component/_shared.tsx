"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export const COUNTRIES     = ["Germany", "United States", "United Kingdom", "Pakistan", "India", "Canada", "Australia", "France", "Turkey", "UAE"]
export const DEGREES       = ["High School", "Associate Degree", "Bachelor's Degree", "Master's Degree", "PhD", "Diploma", "Certificate"]
export const ENGLISH_TESTS = ["IELTS", "TOEFL", "Duolingo English Test", "Cambridge C1/C2", "PTE Academic", "None"]
export const CAMPUSES      = ["Berlin", "Bielefeld", "Cologne", "Hamburg", "Munich"]
export const GENDERS       = ["male", "female", "other"]
export const INDUSTRIES    = ["Technology", "Education", "Healthcare", "Finance", "Engineering", "Marketing", "Legal", "Construction", "Retail", "Other"]
export const AGENCY_TYPES  = ["Recruitment Agency", "Education Consultancy", "Study Abroad Agency", "Immigration Consultancy", "Other"]
export const SERVICES      = ["Visa Assistance", "University Application", "Language Test Prep", "Scholarship Guidance", "Pre-Departure Support", "All of the Above"]

export function DatePicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
    const [open, setOpen] = useState(false)
    const today = new Date()
    const parsed = value ? new Date(value) : null
    const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear() - 18)
    const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? 0)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const years = Array.from({ length: 100 }, (_, i) => today.getFullYear() - i)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="h-[50px] w-full rounded-none border border-input bg-brand-input px-2.5 justify-start font-normal hover:bg-brand-input">
                    <CalendarIcon className="mr-2 size-4 opacity-50" />
                    {parsed ? format(parsed, "PPP") : <span className="text-muted-foreground">Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3 space-y-3" align="start">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1) }}>
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Select value={String(viewMonth)} onValueChange={v => setViewMonth(Number(v))}>
                        <SelectTrigger className="w-[90px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{months.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={String(viewYear)} onValueChange={v => setViewYear(Number(v))}>
                        <SelectTrigger className="w-[80px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-48 overflow-y-auto">{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1) }}>
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                        <div key={d} className="text-muted-foreground font-medium py-1">{d}</div>
                    ))}
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const isSelected = parsed?.getDate() === day && parsed?.getMonth() === viewMonth && parsed?.getFullYear() === viewYear
                        return (
                            <button key={day} onClick={() => { onChange(format(new Date(viewYear, viewMonth, day), "yyyy-MM-dd")); setOpen(false) }}
                                className={cn("rounded-md py-1 text-xs hover:bg-primary hover:text-primary-foreground transition-colors", isSelected && "bg-primary text-primary-foreground")}>
                                {day}
                            </button>
                        )
                    })}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export function F({ isInvalid, error, label, children }: { isInvalid: boolean; error: any; label: string; children: React.ReactNode }) {
    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel>{label}</FieldLabel>
            {children}
            {isInvalid && error && <FieldError errors={[error]} />}
        </Field>
    )
}
