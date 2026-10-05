"use client"

import { useAuth } from "@/hooks/useAuth"
import { PageContent } from "./_components/page-content"
import Loading from "./loading"
import type { ProfilePageData } from "@/lib/profile/server"

export default function ProfilePage() {
    const { me } = useAuth()

    if (!me.data) {
        return <Loading />
    }

    return <PageContent initialData={me.data as ProfilePageData} />
}
