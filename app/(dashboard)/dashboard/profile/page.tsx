"use client"

import { useAuth } from "@/hooks/useAuth"
import { PageContent } from "./_components/page-content"
import Loading from "./loading"

export default function ProfilePage() {
    const { me } = useAuth()

    if (!me.data) {
        return <Loading />
    }

    return <PageContent />
}
