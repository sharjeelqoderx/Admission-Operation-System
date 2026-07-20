"use client"

import { AgentDashboard } from "./agent-dashboard"
import { StudentDashboard } from "./student-dashboard"
import { Role } from "@/types/enums/role"

type ClientDashboardProps = {
    role: string
}

export function ClientDashboard({ role }: ClientDashboardProps) {
    if (role === Role.STUDENT) {
        return <StudentDashboard />
    }

    return <AgentDashboard />
}
