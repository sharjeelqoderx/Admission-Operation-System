"use client"

import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { F } from "./_shared"

const schema = z.object({
    phone: z.string().trim().min(7, "Phone number is required"),
    address: z.string().trim().min(5, "Complete address is required"),
})

export function AgentStep3({ onBack }: { onBack: () => void }) {
    const router = useRouter()

    const form = useForm({
        defaultValues: { phone: "", address: "" },
        validators: { onSubmit: schema },
        onSubmit: async ({ value }) => {
            console.log("Agent Step 3 — Contact:", value)
            router.push("/home")
        },
    })

    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>

            <div className="grid grid-cols-1 gap-4 sm:gap-6">

                <form.Field name="phone">
                    {(field) => (
                        <F
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                            label="Agency Phone Number"
                        >
                            <Input
                                id={field.name}
                                type="number"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={e => field.handleChange(e.target.value)}
                                onKeyDown={e => {
                                    if (["e", "E", "-", ".", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault()
                                }}
                                placeholder="Enter your agency phone number"
                                className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </F>
                    )}
                </form.Field>

                {/* Full width textarea */}
                <div className="sm:col-span-2">
                    <form.Field name="address">
                        {(field) => (
                            <F
                                isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                error={field.state.meta.errors?.[0]}
                                label="Complete Address"
                            >
                                <textarea
                                    id={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={e => field.handleChange(e.target.value)}
                                    placeholder="Street, City, State, ZIP Code"
                                    rows={3}
                                    className="w-full rounded-sm border border-input bg-brand-input px-3 py-3 text-sm outline-none resize-none placeholder:text-muted-foreground"
                                />
                            </F>
                        )}
                    </form.Field>
                </div>

            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 mt-8">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1 min-w-40"
                    onClick={onBack}
                >
                    Back
                </Button>

                <Button
                    type="submit"
                    className="flex-1 min-w-40 capitalize"
                >
                    Submit
                </Button>
            </div>

        </form>
    )
}
