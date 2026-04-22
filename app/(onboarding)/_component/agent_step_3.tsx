"use client"

import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { agentStep3Schema } from "@/types/schemas/auth"
import { F, SERVICES } from "./_shared"

export function AgentStep3({ onBack }: { onBack: () => void }) {
    const router = useRouter()

    const form = useForm({
        defaultValues: { studentsRecruitedPerYear: "", targetCountries: "", partnerUniversities: "", servicesOffered: "", hasSignedAgreement: "no" as "yes" | "no", additionalNotes: "" },
        validators: { onSubmit: agentStep3Schema },
        onSubmit: async ({ value }) => {
            console.log("Agent Step 3:", value)
            router.push("/home")
        },
    })

    return (
        <form id="agent-step3-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <form.Field name="studentsRecruitedPerYear">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Students Recruited Per Year"><Input id={field.name} type="number" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} onKeyDown={e => { if (["e","E","+","-",".","ArrowUp","ArrowDown"].includes(e.key)) e.preventDefault() }} placeholder="e.g. 50" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></F>)}</form.Field>
                <form.Field name="servicesOffered">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Services Offered"><Select value={field.state.value} onValueChange={field.handleChange}><SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger><SelectContent>{SERVICES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></F>)}</form.Field>
                <form.Field name="targetCountries">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Target Countries"><Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. Germany, UK, Canada" /></F>)}</form.Field>
                <form.Field name="partnerUniversities">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Partner Universities (optional)"><Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. FHM, TU Berlin" /></F>)}</form.Field>
                <form.Field name="hasSignedAgreement">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Have you signed a partnership agreement?"><div className="flex gap-6 h-[50px] items-center">{(["yes", "no"] as const).map(opt => (<label key={opt} className="flex items-center gap-2 cursor-pointer capitalize"><input type="radio" value={opt} checked={field.state.value === opt} onChange={() => field.handleChange(opt)} className="accent-brand-byzantine size-4" />{opt}</label>))}</div></F>)}</form.Field>
                <form.Field name="additionalNotes">{(field) => (<div className="col-span-2"><F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Additional Notes (optional)"><textarea id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Any additional information..." rows={4} className="w-full rounded-none border border-input bg-brand-input px-2.5 py-3 text-sm outline-none focus:ring-3 focus:ring-ring/50 resize-none placeholder:text-muted-foreground" /></F></div>)}</form.Field>
            </div>
            <div className="flex gap-3 mt-8">
                <Button type="button" variant="outline" className="flex-1" onClick={onBack}>Back</Button>
                <Button type="submit" form="agent-step3-form" className="flex-1 uppercase">Submit</Button>
            </div>
        </form>
    )
}
