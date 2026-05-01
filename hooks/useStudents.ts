import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { type AddStudentInput } from "@/types/schemas/student"

export function useStudents() {
    const queryClient = useQueryClient()

    // Get all students
    const studentsQuery = useQuery({
        queryKey: ["students"],
        queryFn: async () => {
            const res = await fetch("/api/student")
            if (!res.ok) throw new Error("Failed to fetch students")
            const json = await res.json()
            return json.data
        }
    })

    // Get single student profile
    const getStudent = (id: string) => useQuery({
        queryKey: ["students", id],
        queryFn: async () => {
            const res = await fetch(`/api/student/${id}`)
            if (!res.ok) throw new Error("Failed to fetch student")
            const json = await res.json()
            return json.data
        },
        enabled: !!id
    })

    // Add student
    const addStudent = useMutation({
        mutationFn: async (data: AddStudentInput | FormData) => {
            const res = await fetch("/api/student", {
                method: "POST",
                body: data instanceof FormData ? data : JSON.stringify(data),
                headers: data instanceof FormData ? undefined : { "Content-Type": "application/json" },
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Failed to add student")
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] })
        }
    })

    // Edit student
    const editStudent = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<AddStudentInput> }) => {
            const res = await fetch(`/api/student/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Failed to edit student")
            }
            return res.json()
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["students"] })
            queryClient.invalidateQueries({ queryKey: ["students", variables.id] })
        }
    })

    // Delete student
    const deleteStudent = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/student/${id}`, {
                method: "DELETE",
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Failed to delete student")
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] })
        }
    })

    return {
        studentsQuery,
        getStudent,
        addStudent,
        editStudent,
        deleteStudent
    }
}
