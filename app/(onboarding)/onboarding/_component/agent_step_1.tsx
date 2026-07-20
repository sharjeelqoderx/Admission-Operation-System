"use client"

import { useForm } from "@tanstack/react-form"

import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { F } from "./_shared"
import { useAuth } from "@/hooks/useAuth"
import { CountrySelect } from "@/components/shared/country-select"
import { StateSelect } from "@/components/shared/state-select"
import { CitySelect } from "@/components/shared/city-select"
import { PageLoader, Spinner } from "@/components/shared/page-loader"
import { Typography } from "@/components/shared/Typography"

const namePart = z
    .string()
    .trim()
    .min(2, "Must be at least 2 characters")
    .regex(/^[a-zA-Z]+$/, "Only letters allowed")

const schema = z
    .object({
        agentFirstName: z.string().trim(),
        agentLastName: z.string().trim(),
        contactPersonFirstName: z.string().trim(),
        contactPersonLastName: z.string().trim(),
        sameAsAgentName: z.boolean(),
        title: z.enum(["Mr", "Mrs", "Ms"], { message: "Select title" }),
        gender: z.enum(["male", "female"]).or(z.literal("")),
        primaryBaseCountry: z.string().trim().min(2, "Country is required"),
        primaryBaseState: z.string().trim().min(2, "State is required"),
        primaryBaseCity: z.string().trim().min(2, "City is required"),
        website: z.string().trim().refine(v => v === "" || v.includes("."), "Enter a valid URL").or(z.literal("")),
    })
    .superRefine((data, ctx) => {
        const agentFirst = namePart.safeParse(data.agentFirstName)
        if (!agentFirst.success) {
            ctx.addIssue({
                path: ["agentFirstName"],
                code: "custom",
                message: agentFirst.error.issues[0]?.message ?? "First name is required",
            })
        }
        const agentLast = namePart.safeParse(data.agentLastName)
        if (!agentLast.success) {
            ctx.addIssue({
                path: ["agentLastName"],
                code: "custom",
                message: agentLast.error.issues[0]?.message ?? "Last name is required",
            })
        }
        if (!data.sameAsAgentName) {
            const first = namePart.safeParse(data.contactPersonFirstName)
            if (!first.success) {
                ctx.addIssue({
                    path: ["contactPersonFirstName"],
                    code: "custom",
                    message: first.error.issues[0]?.message ?? "First name is required",
                })
            }
            const last = namePart.safeParse(data.contactPersonLastName)
            if (!last.success) {
                ctx.addIssue({
                    path: ["contactPersonLastName"],
                    code: "custom",
                    message: last.error.issues[0]?.message ?? "Last name is required",
                })
            }
        }
        const mappedGender = genderFromTitle(data.title)
        if (!mappedGender || data.gender !== mappedGender) {
            ctx.addIssue({
                path: ["gender"],
                code: "custom",
                message: "Select a title to set gender",
            })
        }
    })

type AgentStep1Values = {
    agentFirstName: string
    agentLastName: string
    contactPersonFirstName: string
    contactPersonLastName: string
    sameAsAgentName: boolean
    title: string
    gender: string
    primaryBaseCountry: string
    primaryBaseState: string
    primaryBaseCity: string
    website: string
}

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

function normalizeGender(value?: string) {
    const gender = value?.toLowerCase()
    return gender === "male" || gender === "female" || gender === "other" ? gender : ""
}

function genderFromTitle(title: string): "male" | "female" | undefined {
    switch (title) {
        case "Mr":
            return "male"
        case "Mrs":
        case "Ms":
            return "female"
        default:
            return undefined
    }
}

function AgentStep1Form({
    defaultValues,
    onNext,
}: {
    defaultValues: AgentStep1Values
    onNext: () => void
}) {
    const { agentProfile } = useAuth()
    const form = useForm({
        defaultValues,
        validators: { onSubmit: schema },
        onSubmit: async ({ value }) => {
            const contactFirst = value.sameAsAgentName
                ? value.agentFirstName
                : value.contactPersonFirstName
            const contactLast = value.sameAsAgentName
                ? value.agentLastName
                : value.contactPersonLastName

            const fd = new FormData()
            fd.append("first_name", value.agentFirstName)
            fd.append("last_name", value.agentLastName)
            if (value.title) fd.append("title", value.title)
            fd.append("contact_person_first_name", contactFirst)
            fd.append("contact_person_last_name", contactLast)
            const gender = genderFromTitle(value.title)
            fd.append("gender", gender === "male" ? "MALE" : gender === "female" ? "FEMALE" : "")
            fd.append("country", value.primaryBaseCountry)
            fd.append("state", value.primaryBaseState)
            fd.append("city", value.primaryBaseCity)
            fd.append("website", value.website)
            await agentProfile.mutateAsync(fd)
            onNext()
        },
    })

    const applySameAsAgentName = (checked: boolean) => {
        form.setFieldValue("sameAsAgentName", checked)
        if (checked) {
            form.setFieldValue("contactPersonFirstName", form.getFieldValue("agentFirstName"))
            form.setFieldValue("contactPersonLastName", form.getFieldValue("agentLastName"))
        }
    }

    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">

                <form.Field name="title">{(field) => {
                    const { isInvalid, error } = getFieldState(field)
                    return (
                    <F isInvalid={isInvalid} error={error} label="Title">
                        <Select
                            value={field.state.value || undefined}
                            onValueChange={(v) => {
                                field.handleChange(v)
                                form.setFieldValue("gender", genderFromTitle(v) ?? "")
                            }}
                        >
                            <SelectTrigger><SelectValue placeholder="Select title" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Mr">Mr</SelectItem>
                                <SelectItem value="Mrs">Mrs</SelectItem>
                                <SelectItem value="Ms">Ms</SelectItem>
                            </SelectContent>
                        </Select>
                    </F>
                    )
                }}</form.Field>

                <form.Field name="agentFirstName">{(field) => {
                    const { isInvalid, error } = getFieldState(field)
                    return (
                    <F isInvalid={isInvalid} error={error} label="University Partner First Name">
                        <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. John" />
                    </F>
                    )
                }}</form.Field>

                <form.Field name="agentLastName">{(field) => {
                    const { isInvalid, error } = getFieldState(field)
                    return (
                    <F isInvalid={isInvalid} error={error} label="University Partner Last Name">
                        <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. Smith" />
                    </F>
                    )
                }}</form.Field>

                <div className="sm:col-span-2 space-y-4">
                    <form.Field name="sameAsAgentName">{(field) => (
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="same-as-agent-name"
                                checked={field.state.value}
                                onCheckedChange={(checked) => applySameAsAgentName(checked === true)}
                            />
                            <label htmlFor="same-as-agent-name" className="cursor-pointer">
                                <Typography font="text" className="text-sm">
                                    Same as above
                                </Typography>
                            </label>
                        </div>
                    )}</form.Field>

                    <form.Subscribe selector={(s) => s.values.sameAsAgentName}>
                        {(sameAsAgentName) => (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                                <form.Field name="contactPersonFirstName">{(field) => {
                                    const { isInvalid, error } = getFieldState(field)
                                    return (
                                    <F isInvalid={isInvalid} error={error} label="Contact Person First Name">
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={e => field.handleChange(e.target.value)}
                                            placeholder="e.g. John"
                                            disabled={sameAsAgentName}
                                        />
                                    </F>
                                    )
                                }}</form.Field>

                                <form.Field name="contactPersonLastName">{(field) => {
                                    const { isInvalid, error } = getFieldState(field)
                                    return (
                                    <F isInvalid={isInvalid} error={error} label="Contact Person Last Name">
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={e => field.handleChange(e.target.value)}
                                            placeholder="e.g. Smith"
                                            disabled={sameAsAgentName}
                                        />
                                    </F>
                                    )
                                }}</form.Field>
                            </div>
                        )}
                    </form.Subscribe>
                </div>

                <form.Field name="gender">{(field) => {
                    const { isInvalid, error } = getFieldState(field)
                    return (
                    <form.Subscribe selector={(s) => s.values.title}>
                        {(title) => {
                            const derivedGender = genderFromTitle(title) ?? field.state.value
                            return (
                    <F isInvalid={isInvalid} error={error} label="Gender">
                        <Select value={derivedGender || undefined} disabled>
                            <SelectTrigger className="opacity-100"><SelectValue placeholder="Select title first" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                        </Select>
                    </F>
                            )
                        }}
                    </form.Subscribe>
                    )
                }}</form.Field>

                <form.Field name="primaryBaseCountry">{(field) => {
                    const { isInvalid, error } = getFieldState(field)
                    return (
                    <F isInvalid={isInvalid} error={error} label="Primary Base Country">
                        <CountrySelect
                            value={field.state.value}
                            onValueChange={(v) => {
                                field.handleChange(v)
                                form.setFieldValue("primaryBaseState", "")
                                form.setFieldValue("primaryBaseCity", "")
                            }}
                        />
                    </F>
                    )
                }}</form.Field>

                <form.Subscribe selector={(s) => s.values.primaryBaseCountry}>
                    {(country) => (
                        <form.Field name="primaryBaseState">{(field) => {
                            const { isInvalid, error } = getFieldState(field)
                            return (
                            <F isInvalid={isInvalid} error={error} label="State">
                                <StateSelect
                                    country={country}
                                    value={field.state.value}
                                    onValueChange={(v) => {
                                        field.handleChange(v)
                                        form.setFieldValue("primaryBaseCity", "")
                                    }}
                                />
                            </F>
                            )
                        }}</form.Field>
                    )}
                </form.Subscribe>

                <form.Subscribe selector={(s) => ({ country: s.values.primaryBaseCountry, state: s.values.primaryBaseState })}>
                    {({ country, state }) => (
                        <form.Field name="primaryBaseCity">{(field) => {
                            const { isInvalid, error } = getFieldState(field)
                            return (
                            <F isInvalid={isInvalid} error={error} label="City">
                                <CitySelect
                                    country={country}
                                    state={state}
                                    value={field.state.value}
                                    onValueChange={field.handleChange}
                                />
                            </F>
                            )
                        }}</form.Field>
                    )}
                </form.Subscribe>

                <div className="col-span-1 sm:col-span-2">
                    <form.Field name="website">{(field) => {
                        const { isInvalid, error } = getFieldState(field)
                        return (
                        <F isInvalid={isInvalid} error={error} label="Professional Website / Portfolio (optional)">
                            <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="https://www.horizonedu.com" />
                        </F>
                        )
                    }}</form.Field>
                </div>

            </div>

            <div className="flex gap-3 mt-8">
                <Button type="submit" className="flex-1 capitalize gap-2" disabled={agentProfile.isPending}>
                    {agentProfile.isPending && <Spinner size="sm" />}
                    {agentProfile.isPending ? "Saving..." : "Continue"}
                </Button>
            </div>
        </form>
    )
}

export function AgentStep1({ onNext }: { onNext: () => void; onSkip: () => void }) {
    const { me } = useAuth()
    const { data: meData, isLoading } = me

    if (isLoading) {
        return <PageLoader />
    }

    const agentFirstName = meData?.firstName ?? ""
    const agentLastName = meData?.lastName ?? ""
    const profileTitle = meData?.title ?? ""

    const agentProfile = meData?.profile as {
        contact_person_first_name?: string
        contact_person_last_name?: string
        country?: string
        state?: string
        city?: string
        website?: string
        gender?: string
    } | undefined

    const storedFirst = agentProfile?.contact_person_first_name ?? ""
    const storedLast = agentProfile?.contact_person_last_name ?? ""
    const sameAsAgentName =
        storedFirst === agentFirstName &&
        storedLast === agentLastName &&
        agentFirstName.length > 0 &&
        agentLastName.length > 0

    const defaultValues: AgentStep1Values = {
        agentFirstName,
        agentLastName,
        contactPersonFirstName: storedFirst || agentFirstName,
        contactPersonLastName: storedLast || agentLastName,
        sameAsAgentName,
        title: profileTitle === "Mr" || profileTitle === "Mrs" || profileTitle === "Ms" ? profileTitle : ("" as AgentStep1Values["title"]),
        gender:
            normalizeGender(agentProfile?.gender ?? meData?.profile?.gender) ||
            genderFromTitle(profileTitle) ||
            "",
        primaryBaseCountry: agentProfile?.country ?? meData?.profile?.country ?? "",
        primaryBaseState: agentProfile?.state ?? meData?.profile?.state ?? "",
        primaryBaseCity: agentProfile?.city ?? meData?.profile?.city ?? "",
        website: agentProfile?.website ?? "",
    }

    return (
        <AgentStep1Form
            key={JSON.stringify(defaultValues)}
            defaultValues={defaultValues}
            onNext={onNext}
        />
    )
}
