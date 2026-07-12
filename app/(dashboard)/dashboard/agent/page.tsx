import { redirect } from "next/navigation"

export default async function AgentPage() {
    // University Partners page is currently disabled — redirect all roles
    redirect("/dashboard")
}
