"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type DatePickerProps = {
    value: string
    onChange: (val: string) => void
    placeholder?: string
    className?: string
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", className }: DatePickerProps) {
    const [open, setOpen] = useState(false)
    const today = new Date()
    const parsed = value ? new Date(value) : null
    
    // Initialize view to the current year/month or the parsed date's year/month
    const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear() - 18)
    const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? 0)
    
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    
    // Range of years to show in the dropdown (100 years back from today)
    const years = Array.from({ length: 100 }, (_, i) => today.getFullYear() - i)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button 
                    variant="outline" 
                    className={cn(
                        "h-12 w-full rounded-sm border border-input bg-brand-input px-3 justify-start font-normal hover:bg-brand-input text-gray-900 transition-all",
                        !parsed && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 size-4 opacity-50" />
                    {parsed ? format(parsed, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4 space-y-4 shadow-2xl border-white/20 backdrop-blur-xl bg-white/90" align="start">
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-8"
                        onClick={() => { 
                            if (viewMonth === 0) { 
                                setViewMonth(11); 
                                setViewYear(y => y - 1) 
                            } else setViewMonth(m => m - 1) 
                        }}
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    
                    <Select value={String(viewMonth)} onValueChange={v => setViewMonth(Number(v))}>
                        <SelectTrigger className="w-[100px] h-9 text-xs border-white/20 bg-white/50"><SelectValue /></SelectTrigger>
                        <SelectContent className="backdrop-blur-xl">
                            {months.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <Select value={String(viewYear)} onValueChange={v => setViewYear(Number(v))}>
                        <SelectTrigger className="w-[90px] h-9 text-xs border-white/20 bg-white/50"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-48 overflow-y-auto backdrop-blur-xl">
                            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-8"
                        onClick={() => { 
                            if (viewMonth === 11) { 
                                setViewMonth(0); 
                                setViewYear(y => y + 1) 
                            } else setViewMonth(m => m + 1) 
                        }}
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                        <div key={d} className="text-gray-400 uppercase tracking-tighter py-1">{d}</div>
                    ))}
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const isSelected = parsed?.getDate() === day && 
                                          parsed?.getMonth() === viewMonth && 
                                          parsed?.getFullYear() === viewYear
                        return (
                            <button 
                                key={day} 
                                type="button"
                                onClick={() => { 
                                    onChange(format(new Date(viewYear, viewMonth, day), "yyyy-MM-dd")); 
                                    setOpen(false) 
                                }}
                                className={cn(
                                    "size-8 rounded-md text-xs transition-all hover:bg-brand-byzantine hover:text-white flex items-center justify-center font-medium", 
                                    isSelected ? "bg-brand-byzantine text-white shadow-lg" : "text-gray-700 hover:scale-110"
                                )}
                            >
                                {day}
                            </button>
                        )
                    })}
                </div>
            </PopoverContent>
        </Popover>
    )
}
