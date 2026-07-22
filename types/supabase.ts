export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent: {
        Row: {
          address: string | null
          city: string | null
          contact_person_first_name: string | null
          contact_person_last_name: string | null
          country: string | null
          created_at: string
          experience_years: number | null
          id: string
          nationality: string | null
          other_contact_number: string | null
          profile_id: string
          state: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person_first_name?: string | null
          contact_person_last_name?: string | null
          country?: string | null
          created_at?: string
          experience_years?: number | null
          id?: string
          nationality?: string | null
          other_contact_number?: string | null
          profile_id: string
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person_first_name?: string | null
          contact_person_last_name?: string | null
          country?: string | null
          created_at?: string
          experience_years?: number | null
          id?: string
          nationality?: string | null
          other_contact_number?: string | null
          profile_id?: string
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      application: {
        Row: {
          application_no: string | null
          course_id: string
          created_at: string
          id: string
          profile_id: string
          status: Database["public"]["Enums"]["app_status_enum"]
          submitted_by_profile_id: string | null
          university_id: string
          updated_at: string
        }
        Insert: {
          application_no?: string | null
          course_id: string
          created_at?: string
          id?: string
          profile_id: string
          status?: Database["public"]["Enums"]["app_status_enum"]
          submitted_by_profile_id?: string | null
          university_id: string
          updated_at?: string
        }
        Update: {
          application_no?: string | null
          course_id?: string
          created_at?: string
          id?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["app_status_enum"]
          submitted_by_profile_id?: string | null
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_submitted_by_profile_id_fkey"
            columns: ["submitted_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      application_document: {
        Row: {
          application_id: string
          created_at: string
          document_id: string
          id: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          document_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          document_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_document_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "application"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_document_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document"
            referencedColumns: ["id"]
          },
        ]
      }
      application_review: {
        Row: {
          application_id: string
          created_at: string
          feedback: string | null
          id: string
          reviewed_by_profile_id: string | null
          status: Database["public"]["Enums"]["app_status_enum"]
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          reviewed_by_profile_id?: string | null
          status?: Database["public"]["Enums"]["app_status_enum"]
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          reviewed_by_profile_id?: string | null
          status?: Database["public"]["Enums"]["app_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_review_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "application"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_review_reviewed_by_profile_id_fkey"
            columns: ["reviewed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      campus: {
        Row: {
          campus_type: string | null
          cover_image: string | null
          created_at: string
          department_image: string | null
          departments: string | null
          established_year: number | null
          faculties: string | null
          id: string
          location: string | null
          name: string | null
          profile_id: string
          short_description: string | null
          status: Database["public"]["Enums"]["campus_status_enum"]
          total_area: string | null
          updated_at: string
        }
        Insert: {
          campus_type?: string | null
          cover_image?: string | null
          created_at?: string
          department_image?: string | null
          departments?: string | null
          established_year?: number | null
          faculties?: string | null
          id?: string
          location?: string | null
          name?: string | null
          profile_id: string
          short_description?: string | null
          status?: Database["public"]["Enums"]["campus_status_enum"]
          total_area?: string | null
          updated_at?: string
        }
        Update: {
          campus_type?: string | null
          cover_image?: string | null
          created_at?: string
          department_image?: string | null
          departments?: string | null
          established_year?: number | null
          faculties?: string | null
          id?: string
          location?: string | null
          name?: string | null
          profile_id?: string
          short_description?: string | null
          status?: Database["public"]["Enums"]["campus_status_enum"]
          total_area?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_program_junction: {
        Row: {
          agent_commission: number | null
          application_deadline: string | null
          campus_id: string
          created_at: string
          currency: string
          id: string
          intake_date: string | null
          program_id: string
          study_type: string | null
          total_seats: number | null
          tuition_fee: number | null
          updated_at: string
        }
        Insert: {
          agent_commission?: number | null
          application_deadline?: string | null
          campus_id: string
          created_at?: string
          currency?: string
          id?: string
          intake_date?: string | null
          program_id: string
          study_type?: string | null
          total_seats?: number | null
          tuition_fee?: number | null
          updated_at?: string
        }
        Update: {
          agent_commission?: number | null
          application_deadline?: string | null
          campus_id?: string
          created_at?: string
          currency?: string
          id?: string
          intake_date?: string | null
          program_id?: string
          study_type?: string | null
          total_seats?: number | null
          tuition_fee?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_program_junction_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campus_program_junction_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation: {
        Row: {
          agent_id: string | null
          application_id: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["conv_status_enum"]
          student_id: string | null
          subject: string | null
          university_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          application_id?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["conv_status_enum"]
          student_id?: string | null
          subject?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          application_id?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["conv_status_enum"]
          student_id?: string | null
          subject?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "application"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      course: {
        Row: {
          created_at: string
          deadline_date: string | null
          degree_id: string | null
          id: string
          is_deleted: boolean
          name: string
          program_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline_date?: string | null
          degree_id?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          program_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline_date?: string | null
          degree_id?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          program_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_degree_id_fkey"
            columns: ["degree_id"]
            isOneToOne: false
            referencedRelation: "degree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program"
            referencedColumns: ["id"]
          },
        ]
      }
      degree: {
        Row: {
          agent_commission: number | null
          credits: number | null
          duration: string | null
          fees: string | null
          id: string
          intake_date: Database["public"]["Enums"]["intake_season_enum"] | null
          intake_starts_on: string | null
          language_of_study: string | null
          level_id: string | null
          location: string | null
          name: string
          study_mode: Database["public"]["Enums"]["study_mode_enum"] | null
        }
        Insert: {
          agent_commission?: number | null
          credits?: number | null
          duration?: string | null
          fees?: string | null
          id?: string
          intake_date?: Database["public"]["Enums"]["intake_season_enum"] | null
          intake_starts_on?: string | null
          language_of_study?: string | null
          level_id?: string | null
          location?: string | null
          name: string
          study_mode?: Database["public"]["Enums"]["study_mode_enum"] | null
        }
        Update: {
          agent_commission?: number | null
          credits?: number | null
          duration?: string | null
          fees?: string | null
          id?: string
          intake_date?: Database["public"]["Enums"]["intake_season_enum"] | null
          intake_starts_on?: string | null
          language_of_study?: string | null
          level_id?: string | null
          location?: string | null
          name?: string
          study_mode?: Database["public"]["Enums"]["study_mode_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "degree_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      degree_requirement: {
        Row: {
          created_at: string
          degree_id: string
          document_type_id: string
          id: string
          requirement_type: Database["public"]["Enums"]["document_requirement_type_enum"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          degree_id: string
          document_type_id: string
          id?: string
          requirement_type?: Database["public"]["Enums"]["document_requirement_type_enum"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          degree_id?: string
          document_type_id?: string
          id?: string
          requirement_type?: Database["public"]["Enums"]["document_requirement_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "degree_requirement_degree_id_fkey"
            columns: ["degree_id"]
            isOneToOne: false
            referencedRelation: "degree"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "degree_requirement_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_type"
            referencedColumns: ["id"]
          },
        ]
      }
      document: {
        Row: {
          created_at: string
          document_type_id: string | null
          id: string
          note: string | null
          profile_id: string
          updated_at: string
          uploaded_by_profile_id: string | null
        }
        Insert: {
          created_at?: string
          document_type_id?: string | null
          id?: string
          note?: string | null
          profile_id: string
          updated_at?: string
          uploaded_by_profile_id?: string | null
        }
        Update: {
          created_at?: string
          document_type_id?: string | null
          id?: string
          note?: string | null
          profile_id?: string
          updated_at?: string
          uploaded_by_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_uploaded_by_profile_id_fkey"
            columns: ["uploaded_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      document_files: {
        Row: {
          created_at: string
          document_id: string
          file_url: string
          id: string
          type: string
        }
        Insert: {
          created_at?: string
          document_id: string
          file_url: string
          id?: string
          type: string
        }
        Update: {
          created_at?: string
          document_id?: string
          file_url?: string
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_files_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document"
            referencedColumns: ["id"]
          },
        ]
      }
      document_review: {
        Row: {
          created_at: string
          document_id: string
          feedback: string | null
          id: string
          reviewed_by_profile_id: string | null
          status: Database["public"]["Enums"]["doc_status_enum"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id: string
          feedback?: string | null
          id?: string
          reviewed_by_profile_id?: string | null
          status?: Database["public"]["Enums"]["doc_status_enum"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          feedback?: string | null
          id?: string
          reviewed_by_profile_id?: string | null
          status?: Database["public"]["Enums"]["doc_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_review_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_review_reviewed_by_profile_id_fkey"
            columns: ["reviewed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      document_template: {
        Row: {
          body_html: string
          checklist_items: Json
          checklist_profile: string | null
          created_at: string
          created_by_profile_id: string
          id: string
          is_deleted: boolean
          title: string
          updated_at: string
          variables: Json
        }
        Insert: {
          body_html?: string
          checklist_items?: Json
          checklist_profile?: string | null
          created_at?: string
          created_by_profile_id: string
          id?: string
          is_deleted?: boolean
          title: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          body_html?: string
          checklist_items?: Json
          checklist_profile?: string | null
          created_at?: string
          created_by_profile_id?: string
          id?: string
          is_deleted?: boolean
          title?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "document_template_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      document_type: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          may_expire: boolean
          name: string
          type: string | null
          university_id: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          may_expire?: boolean
          name: string
          type?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          may_expire?: boolean
          name?: string
          type?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_type_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      document_type_level: {
        Row: {
          created_at: string
          document_type_id: string
          id: string
          level_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type_id: string
          id?: string
          level_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type_id?: string
          id?: string
          level_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_type_level_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_type_level_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      education: {
        Row: {
          created_at: string
          degree_id: string | null
          end_date: string | null
          gpa: number | null
          grade_type: string | null
          honors: string | null
          id: string
          institution_name: string | null
          obtained_marks: number | null
          profile_id: string
          qualification: string | null
          start_date: string | null
          total_marks: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          degree_id?: string | null
          end_date?: string | null
          gpa?: number | null
          grade_type?: string | null
          honors?: string | null
          id?: string
          institution_name?: string | null
          obtained_marks?: number | null
          profile_id: string
          qualification?: string | null
          start_date?: string | null
          total_marks?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          degree_id?: string | null
          end_date?: string | null
          gpa?: number | null
          grade_type?: string | null
          honors?: string | null
          id?: string
          institution_name?: string | null
          obtained_marks?: number | null
          profile_id?: string
          qualification?: string | null
          start_date?: string | null
          total_marks?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_degree_id_fkey"
            columns: ["degree_id"]
            isOneToOne: false
            referencedRelation: "education_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      education_type: {
        Row: {
          created_at: string
          id: string
          level: Database["public"]["Enums"]["education_level_enum"]
          level_id: string | null
          name: string
          university_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: Database["public"]["Enums"]["education_level_enum"]
          level_id?: string | null
          name: string
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["education_level_enum"]
          level_id?: string | null
          name?: string
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_type_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_type_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          created_at: string
          id: string
          name: string
          university_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "levels_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      message: {
        Row: {
          attachment_url: string | null
          body: string | null
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_profile_id: string | null
          sent_at: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          body?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_profile_id?: string | null
          sent_at?: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          body?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_profile_id?: string | null
          sent_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_letter: {
        Row: {
          accepted_at: string | null
          application_id: string
          body_html: string | null
          checklist_items: Json | null
          checklist_proofs: Json | null
          created_at: string
          document_template_id: string | null
          feedback: string | null
          file_url: string | null
          id: string
          issued_by_profile_id: string | null
          rejected_at: string | null
          status: Database["public"]["Enums"]["offer_status_enum"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          application_id: string
          body_html?: string | null
          checklist_items?: Json | null
          checklist_proofs?: Json | null
          created_at?: string
          document_template_id?: string | null
          feedback?: string | null
          file_url?: string | null
          id?: string
          issued_by_profile_id?: string | null
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["offer_status_enum"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          application_id?: string
          body_html?: string | null
          checklist_items?: Json | null
          checklist_proofs?: Json | null
          created_at?: string
          document_template_id?: string | null
          feedback?: string | null
          file_url?: string | null
          id?: string
          issued_by_profile_id?: string | null
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["offer_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_letter_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "application"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letter_document_template_id_fkey"
            columns: ["document_template_id"]
            isOneToOne: false
            referencedRelation: "document_template"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letter_issued_by_profile_id_fkey"
            columns: ["issued_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      payment: {
        Row: {
          amount: number | null
          application_id: string
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          paid_by_profile_id: string | null
          proof_url: string | null
          provider: string | null
          provider_account_id: string | null
          provider_payment_intent_id: string | null
          status: Database["public"]["Enums"]["payment_status_enum"]
        }
        Insert: {
          amount?: number | null
          application_id: string
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          paid_by_profile_id?: string | null
          proof_url?: string | null
          provider?: string | null
          provider_account_id?: string | null
          provider_payment_intent_id?: string | null
          status?: Database["public"]["Enums"]["payment_status_enum"]
        }
        Update: {
          amount?: number | null
          application_id?: string
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          paid_by_profile_id?: string | null
          proof_url?: string | null
          provider?: string | null
          provider_account_id?: string | null
          provider_payment_intent_id?: string | null
          status?: Database["public"]["Enums"]["payment_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "payment_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "application"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_paid_by_profile_id_fkey"
            columns: ["paid_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      profile: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          gender: Database["public"]["Enums"]["gender_enum"] | null
          id: string
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["role_enum"]
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["role_enum"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["role_enum"]
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      program: {
        Row: {
          admission_requirements: string | null
          category: string | null
          competency_model: string | null
          created_at: string
          id: string
          location: string | null
          management_skills: string | null
          name: string | null
          perspectives: string | null
          professional_skills: string | null
          profile_id: string
          program_detail: string | null
          program_length: string | null
          prospects_after_graduation: string | null
          status: Database["public"]["Enums"]["program_status_enum"]
          updated_at: string
        }
        Insert: {
          admission_requirements?: string | null
          category?: string | null
          competency_model?: string | null
          created_at?: string
          id?: string
          location?: string | null
          management_skills?: string | null
          name?: string | null
          perspectives?: string | null
          professional_skills?: string | null
          profile_id: string
          program_detail?: string | null
          program_length?: string | null
          prospects_after_graduation?: string | null
          status?: Database["public"]["Enums"]["program_status_enum"]
          updated_at?: string
        }
        Update: {
          admission_requirements?: string | null
          category?: string | null
          competency_model?: string | null
          created_at?: string
          id?: string
          location?: string | null
          management_skills?: string | null
          name?: string | null
          perspectives?: string | null
          professional_skills?: string | null
          profile_id?: string
          program_detail?: string | null
          program_length?: string | null
          prospects_after_graduation?: string | null
          status?: Database["public"]["Enums"]["program_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      program_document_requirements: {
        Row: {
          created_at: string
          document_type_id: string
          id: string
          program_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type_id: string
          id?: string
          program_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type_id?: string
          id?: string
          program_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_document_requirements_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_document_requirements_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program"
            referencedColumns: ["id"]
          },
        ]
      }
      student: {
        Row: {
          address: string | null
          aps_requirement: boolean
          city: string | null
          country: string | null
          created_at: string
          created_by_agent_id: string | null
          guardian_email: string | null
          guardian_phone: string | null
          id: string
          nationality: string | null
          passport_file_url: string | null
          profile_id: string
          state: string | null
          student_code: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          aps_requirement?: boolean
          city?: string | null
          country?: string | null
          created_at?: string
          created_by_agent_id?: string | null
          guardian_email?: string | null
          guardian_phone?: string | null
          id?: string
          nationality?: string | null
          passport_file_url?: string | null
          profile_id: string
          state?: string | null
          student_code?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          aps_requirement?: boolean
          city?: string | null
          country?: string | null
          created_at?: string
          created_by_agent_id?: string | null
          guardian_email?: string | null
          guardian_phone?: string | null
          id?: string
          nationality?: string | null
          passport_file_url?: string | null
          profile_id?: string
          state?: string | null
          student_code?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_student_agent"
            columns: ["created_by_agent_id"]
            isOneToOne: false
            referencedRelation: "agent"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      university: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          profile_id: string
          state: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          profile_id: string
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          profile_id?: string
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "university_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      work_experience: {
        Row: {
          country: string | null
          created_at: string
          end_date: string | null
          id: string
          industry_sector: string | null
          key_responsibilities: string | null
          organization_name: string | null
          profile_id: string
          start_date: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          industry_sector?: string | null
          key_responsibilities?: string | null
          organization_name?: string | null
          profile_id: string
          start_date?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          industry_sector?: string | null
          key_responsibilities?: string | null
          organization_name?: string | null
          profile_id?: string
          start_date?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_experience_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_profile_role: {
        Args: never
        Returns: Database["public"]["Enums"]["role_enum"]
      }
      is_university_role: { Args: never; Returns: boolean }
      soft_delete_document_template: {
        Args: { template_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_status_enum: "APPROVED" | "REJECTED" | "NEEDS_REVISION" | "PENDING"
      campus_status_enum: "ACTIVE" | "INACTIVE"
      conv_status_enum: "OPEN" | "CLOSED"
      doc_status_enum: "APPROVED" | "REJECTED" | "NEEDS_REVISION" | "VERIFIED" | "PENDING" | "ACTION_REQUIRED"
      document_requirement_type_enum: "REQUIRED" | "OPTIONAL"
      education_level_enum: "SCHOOL" | "COLLEGE" | "DIPLOMA" | "UNIVERSITY"
      gender_enum: "MALE" | "FEMALE"
      intake_season_enum: "summer" | "winter"
      offer_status_enum: "PENDING" | "ACCEPTED" | "REJECTED"
      payment_status_enum: "PENDING" | "CONFIRMED" | "FAILED"
      program_status_enum: "ACTIVE" | "INACTIVE"
      role_enum: "STUDENT" | "AGENT" | "ADMIN" | "SUPER_ADMIN" | "MANAGEMENT"
      study_mode_enum: "full_time" | "part_time"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_status_enum: ["APPROVED", "REJECTED", "NEEDS_REVISION", "PENDING"],
      campus_status_enum: ["ACTIVE", "INACTIVE"],
      conv_status_enum: ["OPEN", "CLOSED"],
      doc_status_enum: ["APPROVED", "REJECTED", "NEEDS_REVISION", "VERIFIED", "PENDING", "ACTION_REQUIRED"],
      document_requirement_type_enum: ["REQUIRED", "OPTIONAL"],
      education_level_enum: ["SCHOOL", "COLLEGE", "DIPLOMA", "UNIVERSITY"],
      gender_enum: ["MALE", "FEMALE"],
      intake_season_enum: ["summer", "winter"],
      offer_status_enum: ["PENDING", "ACCEPTED", "REJECTED"],
      payment_status_enum: ["PENDING", "CONFIRMED", "FAILED"],
      program_status_enum: ["ACTIVE", "INACTIVE"],
      role_enum: ["STUDENT", "AGENT", "ADMIN", "SUPER_ADMIN", "MANAGEMENT"],
      study_mode_enum: ["full_time", "part_time"],
    },
  },
} as const
