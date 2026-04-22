export type GenderEnum = "male" | "female" | "other"
export type RoleEnum = "Agent" | "Student" | "Admin" | "Organization"

export interface Profile {
    id: string
    user_id: string
    full_name: string | null
    email: string | null
    phone: string | null
    date_of_birth: string | null
    gender: GenderEnum | null
    country: string | null
    nationality: string | null
    guardian_email: string | null
    guardian_phone: string | null
    picture: string | null
    website: string | null
    role: RoleEnum
    is_verified: boolean
    academic_gap: number
    created_at: string
}

export interface AcademicBackground {
    id: string
    user_id: string
    qualification: string
    institute_name: string
    gpa: number | null
    desired_program: string | null
    campus: string | null
    english_test: string | null
    about: string | null
    created_at: string
}

export interface Experience {
    id: string
    user_id: string
    name: string | null
    organization: string | null
    industry: string | null
    country: string | null
    start_date: string | null
    end_date: string | null
    responsibility: string | null
    created_at: string
}
