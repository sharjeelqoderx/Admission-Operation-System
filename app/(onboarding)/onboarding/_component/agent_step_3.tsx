"use client"

import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { F } from "./_shared"
import { useAuth } from "@/hooks/useAuth"
import { AddressFieldsSchema } from "@/types/schemas/address"

const schema = AddressFieldsSchema

export function AgentStep3({ onBack }: { onBack: () => void }) {
    const router = useRouter()
    const { agentProfile } = useAuth()

    const form = useForm({
        defaultValues: {
            street_1: "",
            street_2: "",
            street_3: "",
            post_code: "",
        },
        validators: { onSubmit: schema },
        onSubmit: async ({ value }) => {
            const fd = new FormData()
            fd.append("street_1", value.street_1)
            if (value.street_2) fd.append("street_2", value.street_2)
            if (value.street_3) fd.append("street_3", value.street_3)
            if (value.post_code) fd.append("post_code", value.post_code)
            await agentProfile.mutateAsync(fd)
            router.push("/dashboard")
        },
    })

    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>
            <div className="grid grid-cols-1 gap-y-5">
                <form.Field name="street_1">{(field) => (
                    <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Street 1">
                        <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Enter street line 1"
                        />
                    </F>
                )}</form.Field>
                <form.Field name="street_2">{(field) => (
                    <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Street 2">
                        <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Enter street line 2 (optional)"
                        />
                    </F>
                )}</form.Field>
                <form.Field name="street_3">{(field) => (
                    <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Street 3">
                        <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Enter street line 3 (optional)"
                        />
                    </F>
                )}</form.Field>
                <form.Field name="post_code">{(field) => (
                    <F isInvalid={field.state.meta.isTouched && !field.state.meta.isValid} error={field.state.meta.errors?.[0]} label="Post Code">
                        <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Enter post code (optional)"
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
