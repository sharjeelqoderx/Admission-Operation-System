"use client"

import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { F } from "./_shared"
import { useAuth } from "@/hooks/useAuth"

const schema = z.object({
    address: z.string().trim().min(5, "Complete address is required"),
})

export function AgentStep3({ onBack }: { onBack: () => void }) {
    const router = useRouter()
    const { agentProfile } = useAuth()

    const form = useForm({
        defaultValues: { address: "" },
        validators: { onSubmit: schema },
        onSubmit: async ({ value }) => {
            const fd = new FormData()
            fd.append("address", value.address)
            await agentProfile.mutateAsync(fd)
            router.push("/dashboard")
        },
    })

    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>
            <div className="grid grid-cols-1 gap-y-5">
                <form.Field name="address">{(field) => (
                    <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Complete Address">
                        <textarea
                            id={field.name} value={field.state.value}
                            onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)}
                            placeholder="Street, City, State, ZIP Code"
                            rows={3}
                            className="w-full rounded-sm border border-input bg-brand-input px-2.5 py-3 text-sm outline-none resize-none placeholder:text-muted-foreground"
                        />
                    </F>
                )}</form.Field>
            </div>

            <div className="flex flex-wrap gap-3 mt-8">
                <Button type="button" variant="outline" className="flex-1 min-w-40" onClick={onBack}>Back</Button>
                <Button type="submit" className="flex-1 min-w-40 capitalize">Submit</Button>
            </div>
        </form>
    )
}
