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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          created_at: string
          id: number
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          kind: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: number
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          applied_at: string | null
          company: string | null
          created_at: string
          id: string
          job_id: string | null
          link: string | null
          next_step_at: string | null
          notes: string | null
          resume_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          company?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          link?: string | null
          next_step_at?: string | null
          notes?: string | null
          resume_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          applied_at?: string | null
          company?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          link?: string | null
          next_step_at?: string | null
          notes?: string | null
          resume_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      educations: {
        Row: {
          created_at: string
          degree: string
          end_date: string | null
          id: string
          institution: string
          start_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          degree: string
          end_date?: string | null
          id?: string
          institution: string
          start_date?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          degree?: string
          end_date?: string | null
          id?: string
          institution?: string
          start_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          company: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          role: string
          start_date: string | null
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          role: string
          start_date?: string | null
          user_id?: string
        }
        Update: {
          company?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          role?: string
          start_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          company: string | null
          contract_type: string | null
          created_at: string
          description: string | null
          external_id: string | null
          id: string
          location: string | null
          published_at: string | null
          requirements: string | null
          salary: string | null
          seniority: string | null
          source: string
          title: string
          url: string | null
          user_id: string
          work_mode: string | null
        }
        Insert: {
          company?: string | null
          contract_type?: string | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          location?: string | null
          published_at?: string | null
          requirements?: string | null
          salary?: string | null
          seniority?: string | null
          source?: string
          title: string
          url?: string | null
          user_id?: string
          work_mode?: string | null
        }
        Update: {
          company?: string | null
          contract_type?: string | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          location?: string | null
          published_at?: string | null
          requirements?: string | null
          salary?: string | null
          seniority?: string | null
          source?: string
          title?: string
          url?: string | null
          user_id?: string
          work_mode?: string | null
        }
        Relationships: []
      }
      match_analyses: {
        Row: {
          created_at: string
          explanation: string | null
          gaps: string[]
          id: string
          job_id: string
          met: string[]
          score: number
          transferable: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          gaps?: string[]
          id?: string
          job_id: string
          met?: string[]
          score: number
          transferable?: string[]
          user_id?: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          gaps?: string[]
          id?: string
          job_id?: string
          met?: string[]
          score?: number
          transferable?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_analyses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          desired_roles: string[]
          full_name: string | null
          headline: string | null
          id: string
          languages: string[]
          linkedin: string | null
          location: string | null
          onboarded: boolean
          phone: string | null
          resume_path: string | null
          salary_expectation: string | null
          seniority: string | null
          skills: string[]
          summary: string | null
          updated_at: string
          work_modes: string[]
        }
        Insert: {
          created_at?: string
          desired_roles?: string[]
          full_name?: string | null
          headline?: string | null
          id: string
          languages?: string[]
          linkedin?: string | null
          location?: string | null
          onboarded?: boolean
          phone?: string | null
          resume_path?: string | null
          salary_expectation?: string | null
          seniority?: string | null
          skills?: string[]
          summary?: string | null
          updated_at?: string
          work_modes?: string[]
        }
        Update: {
          created_at?: string
          desired_roles?: string[]
          full_name?: string | null
          headline?: string | null
          id?: string
          languages?: string[]
          linkedin?: string | null
          location?: string | null
          onboarded?: boolean
          phone?: string | null
          resume_path?: string | null
          salary_expectation?: string | null
          seniority?: string | null
          skills?: string[]
          summary?: string | null
          updated_at?: string
          work_modes?: string[]
        }
        Relationships: []
      }
      resumes: {
        Row: {
          content: string
          created_at: string
          id: string
          job_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          job_id?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          job_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
