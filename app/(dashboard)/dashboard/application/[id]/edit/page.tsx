"use client"

import { useParams } from "next/navigation"
import { CreateApplicationForm } from "@/components/CreateApplicationForm"

export default function EditApplicationPage() {
    const params = useParams()
    const applicationId = params?.id as string

    return <CreateApplicationForm applicationId={applicationId} />
}
