"use client"

import Link from "next/link"
import { memo } from "react"
import { FileText, GraduationCap, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"
import { Input } from "@/components/ui/input"
import { StudentTable } from "../../_components/StudentTable"
import { BluryCard } from "@/components/shared/blury-card"
import { useAuth } from "@/hooks/useAuth"
import { Role } from "@/types/enums/role"
import {
    withStudentDashboardLogic,
    type StudentDashboardViewProps,
} from "../withStudentDashboardLogic"
import type { StudentDashboardPageData } from "@/lib/student/server"

type PageContentProps = {
    initialData: StudentDashboardPageData
}

const StatsDashboard = memo(function StatsDashboard({
    stats,
    statsLoading,
}: Pick<StudentDashboardViewProps, "stats" | "statsLoading">) {
    const { me } = useAuth()
    const canCreateStudent = me.data?.role === Role.AGENT
    const totalStudents = stats.total_students ?? 0
    const activeApplications = stats.active_applications ?? 0

    return (
        <BluryCard
            isCentered={false}
            blurAmount="backdrop-blur-lg"
            blendColorClass="bg-white/10"
            childClass="space-y-12"
        >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between flex-wrap gap-4">
                <div className="space-y-1 max-w-2xl">
                    <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                        All students
                    </Typography>
                    <Typography
                        as="p"
                        font="sub-text"
                        className="text-gray-500 font-medium max-w-2xl leading-relaxed"
                    >
                        {canCreateStudent
                            ? "Initiate a new student profile and link them to global academic programs. Ensure all mandatory fields are verified before submission."
                            : "Review all student profiles, documents, and application progress across the platform."}
                    </Typography>
                </div>
                {canCreateStudent ? (
                    <Link href="/dashboard/student/new">
                        <Button className="px-6 gap-2 font-normal">
                            <Plus size={24} className="text-white" /> New Student
                        </Button>
                    </Link>
                ) : null}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-16">
                <div className="flex items-center gap-6">
                    <div className="size-14 border-x border-white/40 rounded-l-lg rounded-r-lg bg-white/20 flex items-center justify-center">
                        <GraduationCap className="size-7 text-gray-800" />
                    </div>
                    <div className="flex flex-col">
                        <Typography
                            as="span"
                            className="text-[11px] font-bold text-gray-500 uppercase tracking-widest"
                        >
                            Total Students
                        </Typography>
                        <Typography
                            as="span"
                            className={`text-[34px] font-extrabold text-gray-900 leading-none mt-1 ${statsLoading ? "animate-pulse text-gray-300" : ""}`}
                        >
                            {statsLoading ? "—" : totalStudents.toLocaleString()}
                        </Typography>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="size-14 border-x border-white/40 rounded-l-lg rounded-r-lg bg-white/20 flex items-center justify-center">
                        <FileText className="size-7 text-gray-800" />
                    </div>
                    <div className="flex flex-col">
                        <Typography
                            as="span"
                            className="text-[11px] font-bold text-gray-500 uppercase tracking-widest"
                        >
                            Active Applications
                        </Typography>
                        <Typography
                            as="span"
                            className={`text-[34px] font-extrabold text-gray-900 leading-none mt-1 ${statsLoading ? "animate-pulse text-gray-300" : ""}`}
                        >
                            {statsLoading ? "—" : activeApplications.toLocaleString()}
                        </Typography>
                    </div>
                </div>
            </div>
        </BluryCard>
    )
})

function StudentDashboardView({
    stats,
    statsLoading,
    students,
    pagination,
    isLoading,
    isFetching,
    isError,
    errorMessage,
    handleSearch,
    handleStatusChange,
    handlePageChange,
    handleDelete,
    deletingId,
    q,
    status,
    refetch,
}: StudentDashboardViewProps) {
    const { me } = useAuth()
    const showActionsMenu = me.data?.role === Role.SUPER_ADMIN

    return (
        <main className="relative min-w-0">
            <div className="max-w-[1400px] mx-auto space-y-8 min-w-0">
                <StatsDashboard stats={stats} statsLoading={statsLoading} />

                <div className="space-y-4 min-w-0">
                    <Typography as="h3" font="text-xl" className="text-brand-secondary">
                        Students list
                    </Typography>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1 ps-1">
                            <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 size-4 text-gray-400" />
                            <Input
                                key={q}
                                type="text"
                                placeholder="Enter to search"
                                className="w-full backdrop-blur-md ps-8"
                                defaultValue={q}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>

                        {/* Status filter — hidden for now
                        <div className="relative w-full sm:w-64">
                            <Select value={status} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="created">Created</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        */}
                    </div>

                    <StudentTable
                        students={students}
                        pagination={pagination}
                        isLoading={isLoading}
                        isFetching={isFetching}
                        isError={isError}
                        errorMessage={errorMessage}
                        showActionsMenu={showActionsMenu}
                        onDelete={showActionsMenu ? handleDelete : undefined}
                        onRetry={refetch}
                        onPageChange={handlePageChange}
                        deletingId={deletingId}
                    />
                </div>
            </div>
        </main>
    )
}

const StudentDashboardPageContent = memo(withStudentDashboardLogic(StudentDashboardView))
StudentDashboardPageContent.displayName = "StudentDashboardPageContent"

export function PageContent({ initialData }: PageContentProps) {
    return <StudentDashboardPageContent initialData={initialData} />
}
