"use client"

import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { agentStep1Schema } from "@/types/schemas/auth"
import { F, COUNTRIES, AGENCY_TYPES } from "./_shared"

export function AgentStep1({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
    const form = useForm({
        defaultValues: { agencyName: "", agencyType: "", registrationNumber: "", establishedYear: "", country: "", city: "", website: "" },
        validators: { onSubmit: agentStep1Schema },
        onSubmit: async ({ value }) => { console.log("Agent Step 1:", value); onNext() },
    })

    return (
        <form id="agent-step1-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <form.Field name="agencyName">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Agency Name"><Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. Global Edu Consultants" /></F>)}</form.Field>
                <form.Field name="agencyType">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Agency Type"><Select value={field.state.value} onValueChange={field.handleChange}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{AGENCY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></F>)}</form.Field>
                <form.Field name="registrationNumber">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Registration Number"><Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. REG-2024-001" /></F>)}</form.Field>
                <form.Field name="establishedYear">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Established Year"><Input id={field.name} type="number" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} onKeyDown={e => { if (["e","E","+","-",".","ArrowUp","ArrowDown"].includes(e.key)) e.preventDefault() }} placeholder="e.g. 2010" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></F>)}</form.Field>
                <form.Field name="country">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Country"><Select value={field.state.value} onValueChange={field.handleChange}><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger><SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></F>)}</form.Field>
                <form.Field name="city">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="City"><Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. Karachi" /></F>)}</form.Field>
                <form.Field name="website">{(field) => (<div className="col-span-2"><F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Website (optional)"><Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="https://youragency.com" /></F></div>)}</form.Field>
            </div>
            <div className="flex gap-3 mt-8">
                <Button type="button" variant="ghost" className="flex-1 hover:bg-transparent" onClick={onSkip}>Skip for now</Button>
                <Button type="submit" form="agent-step1-form" className="flex-1 uppercase">Continue</Button>
            </div>
        </form>
    )
}
