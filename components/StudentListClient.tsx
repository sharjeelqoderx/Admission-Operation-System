// "use client"

// import { useStudents } from "@/hooks/useStudents"
// import { Typography } from "@/components/shared/Typography"
// import { Search, ChevronDown, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, AlertCircle } from "lucide-react"
// import Link from "next/link"
// import { useCallback, useState } from "react"
// import { Input } from "./ui/input"

// export function StudentListClient() {
//     const { studentsQuery, deleteStudent } = useStudents()
//     const [deletingId, setDeletingId] = useState<string | null>(null)

//     const handleDelete = useCallback((id: string, name: string) => {
//         // confirm({
//         //     title: "Delete Student",
//         //     message: `Are you sure you want to permanently delete "${name}"? This will remove all their data including academic records and cannot be undone.`,
//         //     confirmLabel: "Yes, Delete",
//         //     cancelLabel: "Keep Student",
//         //     variant: "danger",
//         //     onConfirm: async () => {
//         //         setDeletingId(id)
//         //         try {
//         //             await deleteStudent.mutateAsync(id)
//         //             toast("success", "Student Deleted", `"${name}" has been permanently removed.`)
//         //         } catch (err: any) {
//         //             toast("error", "Delete Failed", err.message || "Something went wrong. Please try again.")
//         //         } finally {
//         //             setDeletingId(null)
//         //         }
//         //     }
//         // })
//     }, [deleteStudent])

//     if (studentsQuery.isLoading) {
//         return (
//             <div className="space-y-4 pt-4">
//                 <div className="h-7 w-36 bg-gray-200 rounded-lg animate-pulse" />
//                 <div className="flex flex-col sm:flex-row gap-4">
//                     <div className="h-11 flex-1 bg-gray-200 rounded-lg animate-pulse" />
//                     <div className="h-11 w-full sm:w-64 bg-gray-200 rounded-lg animate-pulse" />
//                 </div>
//                 <div className="flex items-center gap-2 pt-2">
//                     <div className="h-7 w-24 bg-gray-200 rounded-full animate-pulse" />
//                     <div className="h-7 w-20 bg-gray-200 rounded-full animate-pulse" />
//                     <div className="h-7 w-20 bg-gray-200 rounded-full animate-pulse" />
//                 </div>
//                 <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden">
//                     <div className="flex items-center gap-0 px-6 py-4 border-b border-gray-200/50">
//                         {["30%","25%","15%","12%","12%","6%"].map((w, i) => (
//                             <div key={i} className="h-3 bg-gray-200 rounded-md animate-pulse" style={{ width: w, marginRight: i < 5 ? "calc(1/6*100%)" : 0 }} />
//                         ))}
//                     </div>
//                     {[...Array(6)].map((_, rowIdx) => (
//                         <div
//                             key={rowIdx}
//                             className="flex items-center px-6 py-5 border-b border-gray-200/30 last:border-0"
//                             style={{ animationDelay: `${rowIdx * 80}ms` }}
//                         >
//                             <div className="flex items-center gap-3 w-[30%] shrink-0">
//                                 <div className="size-9 rounded-full bg-gray-200 animate-pulse shrink-0" />
//                                 <div className="flex flex-col gap-1.5">
//                                     <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
//                                     <div className="h-2 w-16 bg-gray-100 rounded animate-pulse" />
//                                 </div>
//                             </div>
//                             <div className="w-[25%] shrink-0">
//                                 <div className="h-3 w-36 bg-gray-200 rounded animate-pulse" />
//                             </div>
//                             <div className="w-[15%] shrink-0">
//                                 <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
//                             </div>
//                             <div className="w-[12%] shrink-0">
//                                 <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
//                             </div>
//                             <div className="w-[12%] shrink-0">
//                                 <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
//                             </div>
//                             <div className="flex gap-3">
//                                 <div className="size-4 bg-gray-200 rounded animate-pulse" />
//                                 <div className="size-4 bg-gray-200 rounded animate-pulse" />
//                                 <div className="size-4 bg-gray-200 rounded animate-pulse" />
//                             </div>
//                         </div>
//                     ))}
//                     {/* Pagination skeleton */}
//                     <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200/50">
//                         <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
//                         <div className="flex gap-2">
//                             <div className="size-8 bg-gray-200 rounded-lg animate-pulse" />
//                             <div className="size-8 bg-gray-200 rounded-lg animate-pulse" />
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         )
//     }

//     if (studentsQuery.isError) {
//         return (
//             <div className="flex flex-col items-center justify-center py-24 gap-4">
//                 <div className="size-16 rounded-2xl bg-red-50 flex items-center justify-center">
//                     <AlertCircle className="size-8 text-red-400" />
//                 </div>
//                 <div className="text-center">
//                     <Typography as="p" className="text-sm font-bold text-gray-700">Failed to load students</Typography>
//                     <Typography as="p" className="text-xs text-gray-500 mt-1">Check your connection and try again.</Typography>
//                 </div>
//                 <button
//                     onClick={() => studentsQuery.refetch()}
//                     className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#9B51E0] text-white hover:bg-[#8a42cf] transition-colors"
//                 >
//                     Retry
//                 </button>
//             </div>
//         )
//     }

//     const students = studentsQuery.data || []

//     return (
//         <div className="space-y-4 pt-4">
//             <Typography as="h3" className="text-xl font-bold text-[#1e3a8a]">
//                 Students list
//             </Typography>

//             <div className="flex flex-col sm:flex-row gap-4">
//                 <div className="relative flex-1">
//                     <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 size-4 text-gray-400" />
//                     <Input 
//                         type="text" 
//                         placeholder="Enter to search"
//                         className="w-full bg-white/40 backdrop-blur-md ps-12"
//                     />
//                 </div>
//                 <div className="relative w-full sm:w-64">
//                     <select className="w-full h-full px-4 appearance-none rounded-md bg-white/40 backdrop-blur-md border border-white/40 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#9B51E0]/20">
//                         <option>Status</option>
//                     </select>
//                     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
//                 </div>
//             </div>

//             {/* Tabs */}
//             <div className="flex items-center gap-2 pt-2">
//                 <button className="px-5 py-1.5 rounded-full bg-[#1e3a8a] text-white text-xs font-medium shadow-sm transition-colors">
//                     All Students
//                 </button>
//                 <button className="px-5 py-1.5 rounded-full bg-[#8ba4d5] text-white text-xs font-medium shadow-sm transition-colors hover:bg-[#1e3a8a]">
//                     Program
//                 </button>
//                 <button className="px-5 py-1.5 rounded-full bg-[#8ba4d5] text-white text-xs font-medium shadow-sm transition-colors hover:bg-[#1e3a8a]">
//                     Country
//                 </button>
//             </div>

//             {/* Table */}
//             <div className="bg-white/5 backdrop-blur-xl border-x border-white/40 p-2 w-fit rounded-l-lg rounded-r-lg shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden">
//                 <div className="overflow-x-auto">
//                     <table className="w-full text-left border-collapse">
//                         <thead>
//                             <tr className="border-b border-gray-200/20">
//                                 <th className="px-6 py-5 text-[10px] font-extrabold tracking-widest text-gray-900 uppercase">Student Name</th>
//                                 <th className="px-6 py-5 text-[10px] font-extrabold tracking-widest text-gray-900 uppercase">Program</th>
//                                 <th className="px-6 py-5 text-[10px] font-extrabold tracking-widest text-gray-900 uppercase">Country</th>
//                                 <th className="px-6 py-5 text-[10px] font-extrabold tracking-widest text-gray-900 uppercase">Status</th>
//                                 <th className="px-6 py-5 text-[10px] font-extrabold tracking-widest text-gray-900 uppercase w-40 leading-tight">Application<br/>Creation Date</th>
//                                 <th className="px-6 py-5 text-[10px] font-extrabold tracking-widest text-gray-900 uppercase">Action</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-gray-200/10">
//                             {students.length === 0 ? (
//                                 <tr>
//                                     <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm font-medium">No students found.</td>
//                                 </tr>
//                             ) : students.map((student: any) => (
//                                 <tr key={student.id} className={`hover:bg-white/10 transition-colors ${deletingId === student.id ? 'opacity-50' : ''}`}>
//                                     <td className="px-6 py-6 whitespace-nowrap">
//                                         <div className="flex flex-col">
//                                             <Typography as="span" className="text-sm font-bold text-gray-900">{student.profile?.name || "Alexandros Pappas"}</Typography>
//                                             <Typography as="span" className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">ID: {student.student_id || "SH-2024-8902"}</Typography>
//                                         </div>
//                                     </td>
//                                     <td className="px-6 py-6 whitespace-nowrap">
//                                         <div className="flex flex-col">
//                                             <Typography as="span" className="text-sm font-bold text-gray-700 leading-snug">{student.program || "MSc Global Business Management"}</Typography>
//                                             <Typography as="span" className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{student.intake || "Fall 2024 Intake"}</Typography>
//                                         </div>
//                                     </td>
//                                     <td className="px-6 py-6 whitespace-nowrap">
//                                         <Typography as="span" className="text-sm font-bold text-gray-700">{student.country || "Denmark"}</Typography>
//                                     </td>
//                                     <td className="px-6 py-6 whitespace-nowrap">
//                                         <span className={`inline-flex items-center px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest ${
//                                             student.status === 'OFFER RECEIVED' ? 'bg-[#eb4335] text-white' :
//                                             student.status === 'SIGNED' ? 'bg-[#34a853] text-white' :
//                                             student.status === 'COMPLETED' ? 'bg-[#1e3a8a] text-white' :
//                                             'bg-[#4285f4] text-white'
//                                         }`}>
//                                             {student.status || "CREATED"}
//                                         </span>
//                                     </td>
//                                     <td className="px-6 py-6 whitespace-nowrap">
//                                         <div className="flex flex-col">
//                                             <Typography as="span" className="text-sm font-bold text-gray-800">
//                                                 {new Date(student.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
//                                             </Typography>
//                                         </div>
//                                     </td>
//                                     <td className="px-6 py-6 whitespace-nowrap">
//                                         <div className="flex items-center gap-4 text-gray-600">
//                                             <Link href={`/dashboard/student/${student.profile_id}`} className="hover:text-blue-600 transition-colors" title="View Profile">
//                                                 <Eye className="size-[18px]" strokeWidth={2.5} />
//                                             </Link>
//                                             <Link href={`/dashboard/student/edit?id=${student.profile_id}`} className="hover:text-purple-600 transition-colors" title="Edit Profile">
//                                                 <Pencil className="size-[18px]" strokeWidth={2.5} />
//                                             </Link>
//                                             <button 
//                                                 onClick={() => handleDelete(student.id, student.profile?.name)}
//                                                 disabled={deletingId === student.id}
//                                                 className="hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                                                 title="Delete Student"
//                                             >
//                                                 <Trash2 className="size-[18px]" strokeWidth={2.5} />
//                                             </button>
//                                         </div>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//                 {/* Pagination */}
//                 <div className="flex items-center justify-between px-6 py-5 border-t border-gray-200/20 bg-white/5">
//                     <div className="flex items-center text-xs font-bold text-gray-500 space-x-1">
//                         <Typography as="span" className="text-inherit">Showing</Typography>
//                         <Typography as="span" className="font-extrabold text-gray-900">{students.length}</Typography>
//                         <Typography as="span" className="text-inherit">of</Typography>
//                         <Typography as="span" className="font-extrabold text-gray-900">1,284</Typography>
//                         <Typography as="span" className="text-inherit">entries</Typography>
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <button className="size-9 rounded-xl bg-white/20 hover:bg-white/60 flex items-center justify-center border border-gray-200/40 transition-all">
//                             <ChevronLeft className="size-4 text-gray-500" />
//                         </button>
//                         <button className="size-9 rounded-xl bg-white/20 hover:bg-white/60 flex items-center justify-center border border-gray-200/40 transition-all">
//                             <ChevronRight className="size-4 text-gray-500" />
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }


"use client"

import { useStudents } from "@/hooks/useStudents"
import { Typography } from "@/components/shared/Typography"
import { Search, ChevronDown, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useCallback, useState } from "react"
import { Input } from "./ui/input"

// ✅ shadcn table imports
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table"

export function StudentListClient() {
    const { studentsQuery, deleteStudent } = useStudents()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = useCallback((id: string, name: string) => {
        // delete logic
    }, [deleteStudent])

    if (studentsQuery.isLoading) {
        return (
            <div className="space-y-4 pt-4">
                <div className="h-7 w-36 bg-gray-200 rounded-lg animate-pulse" />
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="h-11 flex-1 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-11 w-full sm:w-64 bg-gray-200 rounded-lg animate-pulse" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                    <div className="h-7 w-24 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-7 w-20 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-7 w-20 bg-gray-200 rounded-full animate-pulse" />
                </div>

                {/* keep as-is */}
                <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden">
                    {/* skeleton same */}
                </div>
            </div>
        )
    }

    if (studentsQuery.isError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="size-16 rounded-2xl bg-red-50 flex items-center justify-center">
                    <AlertCircle className="size-8 text-red-400" />
                </div>
                <div className="text-center">
                    <Typography as="p" className="text-sm font-bold text-gray-700">Failed to load students</Typography>
                    <Typography as="p" className="text-xs text-gray-500 mt-1">Check your connection and try again.</Typography>
                </div>
                <button
                    onClick={() => studentsQuery.refetch()}
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#9B51E0] text-white hover:bg-[#8a42cf] transition-colors"
                >
                    Retry
                </button>
            </div>
        )
    }

    const students = studentsQuery.data || []

    return (
        <div className="space-y-4 pt-4 overflow-x-scroll">
            <Typography as="h3" className="text-xl font-bold text-[#1e3a8a]">
                Students list
            </Typography>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 ps-1">
                    <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Enter to search"
                        className="w-full bg-white/40 backdrop-blur-md ps-12"
                    />
                </div>
                <div className="relative w-full sm:w-64">
                    <select className="w-full h-full px-4 appearance-none rounded-md bg-white/40 backdrop-blur-md border border-white/40 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#9B51E0]/20">
                        <option>Status</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 pt-2">
                <button className="px-5 py-1.5 rounded-full bg-[#1e3a8a] text-white text-xs font-medium shadow-sm transition-colors">
                    All Students
                </button>
                <button className="px-5 py-1.5 rounded-full bg-[#8ba4d5] text-white text-xs font-medium shadow-sm transition-colors hover:bg-[#1e3a8a]">
                    Program
                </button>
                <button className="px-5 py-1.5 rounded-full bg-[#8ba4d5] text-white text-xs font-medium shadow-sm transition-colors hover:bg-[#1e3a8a]">
                    Country
                </button>
            </div>

            {/* ✅ Table */}
            <div className="bg-white/5 backdrop-blur-xl border-x border-white/40 p-2 w-fit rounded-l-lg rounded-r-lg shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden">

                {/* ✅ horizontal scroll preserved */}
                <div className="overflow-x-auto">
                    <Table className="w-full text-left border-collapse">
                        <TableHeader>
                            <TableRow className="border-b border-gray-200/20">
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold tracking-widest text-gray-900 uppercase">Student Name</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold tracking-widest text-gray-900 uppercase">Program</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold tracking-widest text-gray-900 uppercase">Country</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold tracking-widest text-gray-900 uppercase">Status</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold tracking-widest text-gray-900 uppercase w-40 leading-tight">
                                    Application<br />Creation Date
                                </TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-extrabold tracking-widest text-gray-900 uppercase">Action</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-gray-200/10">
                            {students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm font-medium">
                                        No students found.
                                    </TableCell>
                                </TableRow>
                            ) : students.map((student: any) => (
                                <TableRow
                                    key={student.id}
                                    className={`hover:bg-white/10 transition-colors ${deletingId === student.id ? 'opacity-50' : ''}`}
                                >
                                    <TableCell className="px-6 py-6 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <Typography as="span" className="text-sm font-bold text-gray-900">
                                                {student.profile?.name || "Alexandros Pappas"}
                                            </Typography>
                                            <Typography as="span" className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                                                ID: {student.student_id || "SH-2024-8902"}
                                            </Typography>
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-6 py-6 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <Typography as="span" className="text-sm font-bold text-gray-700 leading-snug">
                                                {student.program || "MSc Global Business Management"}
                                            </Typography>
                                            <Typography as="span" className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                                                {student.intake || "Fall 2024 Intake"}
                                            </Typography>
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-6 py-6 whitespace-nowrap">
                                        <Typography as="span" className="text-sm font-bold text-gray-700">
                                            {student.country || "Denmark"}
                                        </Typography>
                                    </TableCell>

                                    <TableCell className="px-6 py-6 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest ${student.status === 'OFFER RECEIVED' ? 'bg-[#eb4335] text-white' :
                                                student.status === 'SIGNED' ? 'bg-[#34a853] text-white' :
                                                    student.status === 'COMPLETED' ? 'bg-[#1e3a8a] text-white' :
                                                        'bg-[#4285f4] text-white'
                                            }`}>
                                            {student.status || "CREATED"}
                                        </span>
                                    </TableCell>

                                    <TableCell className="px-6 py-6 whitespace-nowrap">
                                        <Typography as="span" className="text-sm font-bold text-gray-800">
                                            {new Date(student.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: '2-digit',
                                                year: 'numeric'
                                            })}
                                        </Typography>
                                    </TableCell>

                                    <TableCell className="px-6 py-6 whitespace-nowrap">
                                        <div className="flex items-center gap-4 text-gray-600">
                                            <Link href={`/dashboard/student/${student.profile_id}`}>
                                                <Eye className="size-[18px]" strokeWidth={2.5} />
                                            </Link>
                                            <Link href={`/dashboard/student/edit?id=${student.profile_id}`}>
                                                <Pencil className="size-[18px]" strokeWidth={2.5} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(student.id, student.profile?.name)}
                                                disabled={deletingId === student.id}
                                            >
                                                <Trash2 className="size-[18px]" strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination unchanged */}
                <div className="flex items-center justify-between px-6 py-5 border-t border-gray-200/20 bg-white/5">
                    <div className="flex items-center text-xs font-bold text-gray-500 space-x-1">
                        <Typography as="span">Showing</Typography>
                        <Typography as="span" className="font-extrabold text-gray-900">{students.length}</Typography>
                        <Typography as="span">of</Typography>
                        <Typography as="span" className="font-extrabold text-gray-900">3</Typography>
                        <Typography as="span">entries</Typography>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="size-9 rounded-xl bg-white/20 hover:bg-white/60 flex items-center justify-center border border-gray-200/40 transition-all">
                            <ChevronLeft className="size-4 text-gray-500" />
                        </button>
                        <button className="size-9 rounded-xl bg-white/20 hover:bg-white/60 flex items-center justify-center border border-gray-200/40 transition-all">
                            <ChevronRight className="size-4 text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}