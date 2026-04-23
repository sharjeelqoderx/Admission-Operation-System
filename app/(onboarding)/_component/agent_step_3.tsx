"use client"

import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { F } from "./_shared"

const schema = z.object({
    phone: z.string().trim().min(7, "Phone number is required"),
    alternatePhone: z.string().trim().or(z.literal("")),
    email: z.string().trim().email("Invalid email address"),
    country: z.string().trim().min(2, "Country is required"),
    address: z.string().trim().min(5, "Complete address is required"),
})

export function AgentStep3({ onBack }: { onBack: () => void }) {
    const router = useRouter()

    const form = useForm({
        defaultValues: { phone: "", alternatePhone: "", email: "", country: "", address: "" },
        validators: { onSubmit: schema },
        onSubmit: async ({ value }) => {
            console.log("Agent Step 3 — Contact:", value)
            router.push("/home")
        },
    })

    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">

                <form.Field name="phone">{(field) => (
                    <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Phone Number">
                        <Input
                            id={field.name} type="number" value={field.state.value}
                            onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)}
                            onKeyDown={e => { if (["e","E","-",".","ArrowUp","ArrowDown"].includes(e.key)) e.preventDefault() }}
                            placeholder="Enter your phone number"
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </F>
                )}</form.Field>

                <form.Field name="alternatePhone">{(field) => (
                    <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Another Number (optional)">
                        <Input
                            id={field.name} type="number" value={field.state.value}
                            onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)}
                            onKeyDown={e => { if (["e","E","-",".","ArrowUp","ArrowDown"].includes(e.key)) e.preventDefault() }}
                            placeholder="Enter your email"
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </F>
                )}</form.Field>

                <form.Field name="email">{(field) => (
                    <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Email Address">
                        <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="Enter your email" />
                    </F>
                )}</form.Field>

                <form.Field name="country">{(field) => (
                    <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Country">
                        <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. Pakistan" />
                    </F>
                )}</form.Field>

                <div className="col-span-1 sm:col-span-2">
                    <form.Field name="address">{(field) => (
                        <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Complete Address">
                            <textarea
                                id={field.name} value={field.state.value}
                                onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)}
                                placeholder="Street, City, State, ZIP Code"
                                rows={3}
                                className="w-full rounded-none border border-input bg-brand-input px-2.5 py-3 text-sm outline-none resize-none placeholder:text-muted-foreground"
                            />
                        </F>
                    )}</form.Field>
                </div>

            </div>

            <div className="flex flex-wrap gap-3 mt-8">
                <Button type="button" variant="outline" className="flex-1 min-w-40" onClick={onBack}>Back</Button>
                <Button type="submit" className="flex-1 min-w-40 capitalize">Submit</Button>
            </div>
        </form>
    )
}
