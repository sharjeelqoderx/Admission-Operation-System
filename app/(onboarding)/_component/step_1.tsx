// "use client"

// import { useState } from "react"
// import { useForm } from "@tanstack/react-form"
// import { z } from "zod"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { DragDropCard, UploadedFile } from "@/components/shared/drag-drop-card"
// import { Typography } from "@/components/shared/Typography"
// import { F, DatePicker, COUNTRIES, GENDERS } from "./_shared"
// import { useProfile, useMe } from "@/lib/hooks/useAuth"
// import { UserPlus } from "lucide-react"

// // Passport is optional on this step — user may already have uploaded it
// const step1Schema = z.object({
//     dob: z.string().min(1, "Date of birth is required")
//         .refine(v => !isNaN(Date.parse(v)), "Invalid date"),
//     gender: z.enum(["male", "female", "other"], { message: "Select gender" }),
//     country: z.string().min(1, "Country is required"),
//     nationality: z.string().trim().min(2, "Nationality is required"),
//     guardianEmail: z.string().trim().email("Invalid email"),
//     guardianPhone: z.string().trim().min(1, "Phone is required"),
//     passport: z.instanceof(File).nullable(),
// })

// function Step1Form({ defaultValues, onNext, onSkip }: {
//     defaultValues: { dob: string; gender: string; country: string; nationality: string; guardianEmail: string; guardianPhone: string }
//     onNext: () => void
//     onSkip: () => void
// }) {
//     const [, setPassportFiles] = useState<UploadedFile[]>([])
//     const { data: me } = useMe()
//     const updateProfile = useProfile()

//     const form = useForm({
//         defaultValues: {
//             dob: defaultValues.dob,
//             gender: defaultValues.gender,
//             country: defaultValues.country,
//             nationality: 'revoked', // defaultValues.nationality,
//             guardianEmail: defaultValues.guardianEmail,
//             guardianPhone: defaultValues.guardianPhone,
//             passport: null as File | null,
//         },
//         validators: { onSubmit: step1Schema },
//         onSubmit: async ({ value }) => {
//             if (!me?.id) return
//             await updateProfile.mutateAsync({
//                 userId: me.id,
//                 dateOfBirth: value.dob,
//                 gender: value.gender,
//                 country: value.country,
//                 nationality: value.nationality,
//                 guardianEmail: value.guardianEmail,
//                 guardianPhone: value.guardianPhone,
//             })
//             onNext()
//         },
//     })

//     return (
//         <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>

//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
//                 <form.Field name="passport">
//                     {(field) => (
//                         <div className="flex flex-col items-center mb-6">
//                             <div className="relative">
//                                 <div className="size-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
//                                     {field.state.value ? (
//                                         <img
//                                             src={URL.createObjectURL(field.state.value)}
//                                             alt="Profile"
//                                             className="w-full h-full object-cover"
//                                         />
//                                     ) : (
//                                         <span className="text-xs text-muted-foreground">No Image</span>
//                                     )}
//                                 </div>

//                                 <label className="absolute bottom-0 right-0 bg-brand text-white p-2 rounded-full cursor-pointer hover:bg-brand/90">
//                                     <input
//                                         type="file"
//                                         accept="image/*"
//                                         className="hidden"
//                                         onChange={(e) => {
//                                             const file = e.target.files?.[0]
//                                             if (!file) return

//                                             // validation
//                                             if (file.size > 5 * 1024 * 1024) {
//                                                 alert("Max file size is 5MB")
//                                                 return
//                                             }

//                                             field.handleChange(file) // ✅ store in form
//                                         }}
//                                     />
//                                     <UserPlus size={14}/>
//                                 </label>
//                             </div>

//                             <p className="text-xs text-muted-foreground mt-2">
//                                 Upload profile picture
//                             </p>
//                         </div>
//                     )}
//                 </form.Field>
//                 <form.Field name="dob">
//                     {(field) => (
//                         <F
//                             isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
//                             error={field.state.meta.errors?.[0]}
//                             label="Date of Birth"
//                         >
//                             <DatePicker
//                                 value={field.state.value}
//                                 onChange={field.handleChange}
//                             />
//                         </F>
//                     )}
//                 </form.Field>

//                 <form.Field name="gender">
//                     {(field) => (
//                         <F
//                             isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
//                             error={field.state.meta.errors?.[0]}
//                             label="Gender"
//                         >
//                             <Select value={field.state.value} onValueChange={field.handleChange}>
//                                 <SelectTrigger className="w-full">
//                                     <SelectValue className="capitalize" placeholder="Select gender" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     {GENDERS.map((g) => (
//                                         <SelectItem key={g} value={g} className="capitalize">
//                                             {g}
//                                         </SelectItem>
//                                     ))}
//                                 </SelectContent>
//                             </Select>
//                         </F>
//                     )}
//                 </form.Field>

//                 <form.Field name="country">
//                     {(field) => (
//                         <F
//                             isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
//                             error={field.state.meta.errors?.[0]}
//                             label="Country"
//                         >
//                             <Input
//                                 id={field.name}
//                                 value={field.state.value}
//                                 onBlur={field.handleBlur}
//                                 onChange={(e) => field.handleChange(e.target.value)}
//                                 placeholder="Enter your country"
//                                 className="w-full"
//                             />
//                         </F>
//                     )}
//                 </form.Field>

//                 {/* <form.Field name="nationality">
//                     {(field) => (
//                         <F
//                             isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
//                             error={field.state.meta.errors?.[0]}
//                             label="Nationality"
//                         >
//                             <Input
//                                 id={field.name}
//                                 value={field.state.value}
//                                 onBlur={field.handleBlur}
//                                 onChange={(e) => field.handleChange(e.target.value)}
//                                 placeholder="e.g. Pakistani"
//                                 className="w-full"
//                             />
//                         </F>
//                     )}
//                 </form.Field> */}

//                 <form.Field name="guardianEmail">
//                     {(field) => (
//                         <F
//                             isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
//                             error={field.state.meta.errors?.[0]}
//                             label="Guardian Email"
//                         >
//                             <Input
//                                 id={field.name}
//                                 value={field.state.value}
//                                 onBlur={field.handleBlur}
//                                 onChange={(e) => field.handleChange(e.target.value)}
//                                 placeholder="Enter your guardian email"
//                                 className="w-full"
//                             />
//                         </F>
//                     )}
//                 </form.Field>

//                 <form.Field name="guardianPhone">
//                     {(field) => (
//                         <F
//                             isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
//                             error={field.state.meta.errors?.[0]}
//                             label="Guardian Phone"
//                         >
//                             <Input
//                                 id={field.name}
//                                 type="number"
//                                 value={field.state.value}
//                                 onBlur={field.handleBlur}
//                                 onChange={(e) => field.handleChange(e.target.value)}
//                                 onKeyDown={(e) => {
//                                     if (["e", "E", "+", "-", ".", "ArrowUp", "ArrowDown"].includes(e.key)) {
//                                         e.preventDefault()
//                                     }
//                                 }}
//                                 placeholder="Enter you guardian phone number"
//                                 className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//                             />
//                         </F>
//                     )}
//                 </form.Field>

//                 {/* <form.Field name="passport">
//                     {(field) => (
//                         <div className="sm:col-span-2">
//                             <F
//                                 isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
//                                 error={field.state.meta.errors?.[0]}
//                                 label="Passport / ID (optional)"
//                             >
//                                 <DragDropCard
//                                     title=""
//                                     description="Upload your passport or ID (PDF, JPG, PNG — max 5MB)"
//                                     accept=".pdf,.jpg,.jpeg,.png"
//                                     multiple={false}
//                                     maxSizeMB={5}
//                                     onChange={(files) => {
//                                         setPassportFiles(files)
//                                         field.handleChange(files[0]?.file ?? null)
//                                     }}
//                                     className="border-0 shadow-none p-0 bg-transparent ring-0"
//                                 />
//                             </F>
//                         </div>
//                     )}
//                 </form.Field> */}

//             </div>

//             {updateProfile.isError && (
//                 <Typography
//                     as="p"
//                     font="text"
//                     className="text-destructive text-sm mt-4 text-center sm:text-left"
//                 >
//                     {updateProfile.error?.message}
//                 </Typography>
//             )}

//             <div className="flex gap-3 mt-8">
//                 <Button
//                     type="submit"
//                     className="flex-1 capitalize"
//                     disabled={updateProfile.isPending}
//                 >
//                     {updateProfile.isPending ? "Saving..." : "Continue"}
//                 </Button>
//             </div>

//         </form>
//     )
// }

// export function Step1Basic({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
//     const { data: me, isLoading } = useMe()

//     if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>

//     const defaults = {
//         dob: me?.profile?.dateOfBirth ?? "",
//         gender: me?.profile?.gender ?? "",
//         country: me?.profile?.country ?? "",
//         nationality: me?.profile?.nationality ?? "",
//         guardianEmail: me?.profile?.guardianEmail ?? "",
//         guardianPhone: me?.profile?.guardianPhone ?? "",
//     }

//     // key forces remount with correct defaultValues once data is loaded
//     return <Step1Form key={JSON.stringify(defaults)} defaultValues={defaults} onNext={onNext} onSkip={onSkip} />
// }
"use client"

import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Typography } from "@/components/shared/Typography"
import { F, DatePicker, GENDERS } from "./_shared"
import { useAuth } from "@/hooks/useAuth"
import { ImageUploadCard } from "@/components/shared/image-upload-card"
import { PageLoader } from "@/components/shared/page-loader"

/* ---------------- SCHEMA ---------------- */
const step1Schema = z.object({
    dob: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["male", "female", "other"]),
    country: z.string().min(1, "Country is required"),
    nationality: z.string().min(2, "Nationality is required"),
    guardianEmail: z.string().email("Invalid email"),
    guardianPhone: z.string().min(5, "Phone is required"),
    passport_file_url: z.instanceof(File).nullable(),
})

/* ---------------- FORM ---------------- */

function Step1Form({
    defaultValues,
    onNext,
}: {
    defaultValues: any
    onNext: () => void
}) {
    const { me, profile: updateProfile } = useAuth()
    const { data: meData } = me

    const form = useForm({
        defaultValues: {
            dob: defaultValues.dob,
            gender: defaultValues.gender,
            country: defaultValues.country,
            nationality: defaultValues.nationality,
            guardianEmail: defaultValues.guardianEmail,
            guardianPhone: defaultValues.guardianPhone,
            passport_file_url: null as File | null,
        },
        validators: { onSubmit: step1Schema },

        onSubmit: async ({ value }) => {
            if (!meData?.id) return

            try {
                const fd = new FormData()
                fd.append("user_id", meData.id)
                fd.append("date_of_birth", value.dob)
                fd.append(
                    "gender",
                    value.gender === "male" ? "MALE" : value.gender === "female" ? "FEMALE" : ""
                )
                fd.append("country", value.country)
                fd.append("nationality", value.nationality)
                fd.append("guardian_email", value.guardianEmail)
                fd.append("guardian_phone", value.guardianPhone)
                if (value.passport_file_url) fd.append("passport_file_url", value.passport_file_url)

                await updateProfile.mutateAsync(fd)

                onNext()
            } catch (err) {
                console.error(err)
            }
        },
    })

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
            }}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* ✅ IMAGE COMPONENT */}
                <form.Field name="passport_file_url">
                    {(field) => (
                        <div className="sm:col-span-2">
                            <ImageUploadCard
                                value={field.state.value}
                                onChange={field.handleChange}
                                message="Upload profile picture"
                            />
                        </div>
                    )}
                </form.Field>

                {/* DOB */}
                <form.Field name="dob">
                    {(field) => (
                        <F
                            label="Date of Birth"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <DatePicker
                                value={field.state.value}
                                onChange={field.handleChange}
                            />
                        </F>
                    )}
                </form.Field>

                {/* Gender */}
                <form.Field name="gender">
                    {(field) => (
                        <F
                            label="Gender"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <Select
                                value={field.state.value}
                                onValueChange={field.handleChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    {GENDERS.map((g) => (
                                        <SelectItem key={g} value={g}>
                                            {g}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </F>
                    )}
                </form.Field>

                {/* Country */}
                <form.Field name="country">
                    {(field) => (
                        <F
                            label="Country"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <Input
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Enter your country"
                            />
                        </F>
                    )}
                </form.Field>

                {/* Nationality */}
                <form.Field name="nationality">
                    {(field) => (
                        <F
                            label="Nationality"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <Input
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="e.g. Pakistani"
                            />
                        </F>
                    )}
                </form.Field>

                {/* Guardian Email */}
                <form.Field name="guardianEmail">
                    {(field) => (
                        <F
                            label="Guardian Email"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <Input
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Enter guardian email"
                            />
                        </F>
                    )}
                </form.Field>

                {/* Guardian Phone */}
                <form.Field name="guardianPhone">
                    {(field) => (
                        <F
                            label="Guardian Phone"
                            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            error={field.state.meta.errors?.[0]}
                        >
                            <Input
                                type="tel"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Enter phone number"
                            />
                        </F>
                    )}
                </form.Field>

            </div>

            {/* ERROR */}
            {updateProfile.isError && (
                <Typography className="text-destructive mt-4 text-sm">
                    {updateProfile.error?.message}
                </Typography>
            )}

            {/* SUBMIT */}
            <div className="mt-8">
                <Button
                    type="submit"
                    className="w-full"
                    disabled={updateProfile.isPending}
                >
                    {updateProfile.isPending ? "Saving..." : "Continue"}
                </Button>
            </div>
        </form>
    )
}

/* ---------------- WRAPPER ---------------- */

export function Step1Basic({ onNext }: { onNext: () => void }) {
    const { me } = useAuth()
    const { data: meData, isLoading } = me

    if (isLoading) {
        return <PageLoader label="Preparing your profile..." />
    }

    const defaults = {
        dob: meData?.profile?.dateOfBirth ?? "",
        gender: meData?.profile?.gender ?? "",
        country: meData?.profile?.country ?? "",
        nationality: meData?.profile?.nationality ?? "",
        guardianEmail: meData?.profile?.guardianEmail ?? "",
        guardianPhone: meData?.profile?.guardianPhone ?? "",
    }

    return (
        <Step1Form
            key={JSON.stringify(defaults)}
            defaultValues={defaults}
            onNext={onNext}
        />
    )
}