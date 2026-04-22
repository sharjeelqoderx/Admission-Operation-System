"use client"

import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { agentStep2Schema } from "@/types/schemas/auth"
import { F } from "./_shared"

export function AgentStep2({ onBack, onNext, onSkip }: { onBack: () => void; onNext: () => void; onSkip: () => void }) {
    const form = useForm({
        defaultValues: { contactPersonName: "", designation: "", contactEmail: "", contactPhone: "", alternatePhone: "", linkedIn: "" },
        validators: { onSubmit: agentStep2Schema },
        onSubmit: async ({ value }) => { console.log("Agent Step 2:", value); onNext() },
    })

    return (
        <form id="agent-step2-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <form.Field name="contactPersonName">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Contact Person Name"><Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. Ahmed Khan" /></F>)}</form.Field>
                <form.Field name="designation">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Designation"><Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. Director" /></F>)}</form.Field>
                <form.Field name="contactEmail">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Contact Email"><Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="contact@agency.com" /></F>)}</form.Field>
                <form.Field name="contactPhone">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Contact Phone"><Input id={field.name} type="number" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} onKeyDown={e => { if (["e","E","+","-",".","ArrowUp","ArrowDown"].includes(e.key)) e.preventDefault() }} placeholder="+923001234567" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></F>)}</form.Field>
                <form.Field name="alternatePhone">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Alternate Phone (optional)"><Input id={field.name} type="number" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} onKeyDown={e => { if (["e","E","+","-",".","ArrowUp","ArrowDown"].includes(e.key)) e.preventDefault() }} placeholder="+923009876543" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></F>)}</form.Field>
                <form.Field name="linkedIn">{(field) => (<F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="LinkedIn Profile (optional)"><Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="https://linkedin.com/in/username" /></F>)}</form.Field>
            </div>
            <div className="flex gap-3 mt-8">
                <Button type="button" variant="outline" className="flex-1" onClick={onBack}>Back</Button>
                <Button type="button" variant="ghost" className="flex-1 hover:bg-transparent" onClick={onSkip}>Skip</Button>
                <Button type="submit" form="agent-step2-form" className="flex-1 uppercase">Continue</Button>
            </div>
        </form>
    )
}
