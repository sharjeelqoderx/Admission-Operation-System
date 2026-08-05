"use client"

import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { F } from "./_shared"
import { useAuth } from "@/hooks/useAuth"
import { PageLoader } from "@/components/shared/page-loader"

const schema = z.object({
    other_contact_number: z.string().trim(),
})

function getFieldState(field: {
    state: { meta: { isTouched: boolean; isValid: boolean; errors?: unknown[] } }
    form: { state: { isSubmitted: boolean } }
}) {
    const isInvalid = (field.state.meta.isTouched || field.form.state.isSubmitted) && !field.state.meta.isValid
    const raw = field.state.meta.errors?.[0]
    const error = raw == null
        ? undefined
        : typeof raw === "string"
            ? { message: raw }
            : (raw as { message?: string })
    return { isInvalid, error }
}

function AgentStep3Form({
    defaultValues,
    onBack,
}: {
    defaultValues: { other_contact_number: string }
    onBack: () => void
}) {
    const router = useRouter()
    const { agentProfile } = useAuth()

    const form = useForm({
        defaultValues,
        validators: { onSubmit: schema },
        onSubmit: async ({ value }) => {
            const fd = new FormData()
            if (value.other_contact_number) {
                fd.append("other_contact_number", value.other_contact_number)
            }
            await agentProfile.mutateAsync(fd)
            router.push("/dashboard")
        },
    })

    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>
            <div className="grid grid-cols-1 gap-y-5">
                <form.Field name="other_contact_number">{(field) => {
                    const { isInvalid, error } = getFieldState(field)
                    return (
                    <F isInvalid={isInvalid} error={error} label="Alternate Phone (optional)">
                        <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Enter alternate phone number"
                        />
                    </F>
                    )
                }}</form.Field>
            </div>

            <div className="flex flex-wrap gap-3 mt-8">
                <Button type="button" variant="outline" className="flex-1 min-w-40" onClick={onBack}>Back</Button>
                <Button type="submit" className="flex-1 min-w-40 capitalize" disabled={agentProfile.isPending}>
                    {agentProfile.isPending ? "Saving..." : "Submit"}
                </Button>
            </div>
        </form>
    )
}

export function AgentStep3({ onBack }: { onBack: () => void }) {
    const { me } = useAuth()
    const { data: meData, isLoading } = me

    if (isLoading) {
        return <PageLoader />
    }

    const agentProfile = meData?.profile as { other_contact_number?: string | null } | undefined

    const defaultValues = {
        other_contact_number: agentProfile?.other_contact_number ?? "",
    }

    return (
        <AgentStep3Form
            key={JSON.stringify(defaultValues)}
            defaultValues={defaultValues}
            onBack={onBack}
        />
    )
}
