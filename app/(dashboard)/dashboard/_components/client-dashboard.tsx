"use client"

import { AgentDashboard } from "./agent-dashboard"
import { StudentDashboard } from "./student-dashboard"

type ClientDashboardProps = {
    role: string
}

export function ClientDashboard({ role }: ClientDashboardProps) {
    if (role === "STUDENT") {
        return <StudentDashboard />
    }

    return <AgentDashboard />
}
