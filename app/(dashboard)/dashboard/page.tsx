"use client"

import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/shared/page-loader';
import { AgentDashboard } from './_components/agent-dashboard';
import { StudentDashboard } from './_components/student-dashboard';
import { UniversityDashboard } from './_components/university-dashboard';

export default function DashboardPage() {
    const { me } = useAuth();
    const { data: meData, isLoading } = me;

    if (isLoading) {
        return <PageLoader label="Loading dashboard..." />;
    }

    if (meData?.role === "STUDENT") {
        return <StudentDashboard />;
    }

    if (meData?.role === "UNIVERSITY") {
        return <UniversityDashboard />;
    }

    // Default to Agent dashboard
    return <AgentDashboard />;
}
