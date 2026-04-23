"use client"

import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { F, GENDERS } from "./_shared"

const schema = z.object({
    agentName: z.string().trim().min(2, "Agent name is required"),
    contactPersonName: z.string().trim().min(2, "Contact person name is required"),
    gender: z.enum(["male", "female", "other"], { message: "Select gender" }),
    primaryBaseCountry: z.string().trim().min(2, "Country is required"),
    website: z.string().url("Enter a valid URL").or(z.literal("")),
})

export function AgentStep1({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
    const form = useForm({
        defaultValues: { agentName: "", contactPersonName: "", gender: "", primaryBaseCountry: "", website: "" },
        validators: { onSubmit: schema },
        onSubmit: async ({ value }) => {
            console.log("Agent Step 1 — Agent Profile:", value)
            onNext()
        },
    })

    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">

                <form.Field name="agentName">{(field) => (
                    <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Agent Name">
                        <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. Global Edu Consultants" />
                    </F>
                )}</form.Field>

                <form.Field name="contactPersonName">{(field) => (
                    <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Contact Person Name">
                        <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. Ahmed Khan" />
                    </F>
                )}</form.Field>

                <form.Field name="gender">{(field) => (
                    <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Gender">
                        <Select value={field.state.value} onValueChange={field.handleChange}>
                            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                            <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>)}</SelectContent>
                        </Select>
                    </F>
                )}</form.Field>

                <form.Field name="primaryBaseCountry">{(field) => (
                    <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Primary Base Country">
                        <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. Pakistan" />
                    </F>
                )}</form.Field>

                <div className="col-span-1 sm:col-span-2">
                    <form.Field name="website">{(field) => (
                        <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Professional Website / Portfolio (optional)">
                            <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="https://youragency.com" />
                        </F>
                    )}</form.Field>
                </div>

            </div>

            <div className="flex gap-3 mt-8">
                {/* <Button type="button" variant="ghost" className="flex-1 hover:bg-transparent" onClick={onSkip}>Skip for now</Button> */}
                <Button type="submit" className="flex-1 capitalize">Continue</Button>
            </div>
        </form>
    )
}
