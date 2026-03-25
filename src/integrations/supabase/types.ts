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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applied_at: string | null
          candidate_id: string
          cover_letter: string | null
          id: string
          job_id: string
          status: string | null
          expires_at: string | null
          job_mode: string | null
        }
        Insert: {
          applied_at?: string | null
          candidate_id: string
          cover_letter?: string | null
          id?: string
          job_id: string
          status?: string | null
          expires_at: string | null
          job_mode: string | null
        }
        Update: {
          applied_at?: string | null
          candidate_id?: string
          cover_letter?: string | null
          id?: string
          job_id?: string
          status?: string | null
          expires_at: string | null
          job_mode: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_skills: {
        Row: {
          id: string
          candidate_id: string
          skill_name: string
          years_experience: number
          skill_level: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          candidate_id: string
          skill_name: string
          years_experience?: number
          skill_level?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          candidate_id?: string
          skill_name?: string
          years_experience?: number
          skill_level?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_skills_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      job_skills: {
        Row: {
          id: string
          job_id: string
          skill_name: string
          years_experience: number
          is_required: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          skill_name: string
          years_experience?: number
          is_required?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          skill_name?: string
          years_experience?: number
          is_required?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          }
        ]
      }
      job_views: {
        Row: {
          id: string
          job_id: string
          viewer_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          viewer_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          viewer_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_views_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          employer_id: string
          stripe_customer_id: string | null
          plan_type: string | null
          status: string | null
          current_period_end: string | null
          job_posts_count: number | null
          resume_downloads_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employer_id: string
          stripe_customer_id?: string | null
          plan_type?: string | null
          status?: string | null
          current_period_end?: string | null
          job_posts_count?: number | null
          resume_downloads_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employer_id?: string
          stripe_customer_id?: string | null
          plan_type?: string | null
          status?: string | null
          current_period_end?: string | null
          job_posts_count?: number | null
          resume_downloads_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: true
            referencedRelation: "employer_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      candidate_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          experience_years: number | null
          id: string
          location: string | null
          resume_url: string | null
          skills: string[] | null
          updated_at: string | null
          user_id: string
          work_authorization: Database["public"]["Enums"]["work_authorization_type"]
          linkedin_url: string | null
          availability_status: string | null
          resume_text: string | null
          expires_at: string | null
          job_mode: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          location?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string | null
          user_id: string
          work_authorization: Database["public"]["Enums"]["work_authorization_type"]
          linkedin_url: string | null
          availability_status: string | null
          resume_text: string | null
          expires_at: string | null
          job_mode: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          location?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string | null
          user_id?: string
          work_authorization?: Database["public"]["Enums"]["work_authorization_type"]
          linkedin_url?: string | null
          availability_status?: string | null
          resume_text?: string | null
          expires_at: string | null
          job_mode: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_profiles: {
        Row: {
          company_name: string
          company_size: string | null
          company_website: string | null
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          updated_at: string | null
          user_id: string
          logo_url: string | null
          expires_at: string | null
          job_mode: string | null
        }
        Insert: {
          company_name: string
          company_size?: string | null
          company_website?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          updated_at?: string | null
          user_id: string
          logo_url: string | null
          expires_at: string | null
          job_mode: string | null
        }
        Update: {
          company_name?: string
          company_size?: string | null
          company_website?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          updated_at?: string | null
          user_id?: string
          logo_url?: string | null
          expires_at: string | null
          job_mode: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string | null
          description: string
          employer_id: string
          experience_required: number | null
          id: string
          is_active: boolean | null
          job_type: string | null
          location: string
          salary_max: number | null
          salary_min: number | null
          skills_required: string[] | null
          title: string
          updated_at: string | null
          work_authorization:
            | Database["public"]["Enums"]["work_authorization_type"][]
            | null
          expires_at: string | null
          job_mode: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          employer_id: string
          experience_required?: number | null
          id?: string
          is_active?: boolean | null
          job_type?: string | null
          location: string
          salary_max?: number | null
          salary_min?: number | null
          skills_required?: string[] | null
          title: string
          updated_at?: string | null
          work_authorization?:
            | Database["public"]["Enums"]["work_authorization_type"][]
            | null
          expires_at: string | null
          job_mode: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          employer_id?: string
          experience_required?: number | null
          id?: string
          is_active?: boolean | null
          job_type?: string | null
          location?: string
          salary_max?: number | null
          salary_min?: number | null
          skills_required?: string[] | null
          title?: string
          updated_at?: string | null
          work_authorization?:
            | Database["public"]["Enums"]["work_authorization_type"][]
            | null
          expires_at: string | null
          job_mode: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          expires_at: string | null
          job_mode: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          expires_at: string | null
          job_mode: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          expires_at: string | null
          job_mode: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "candidate" | "employer" | "admin"
      work_authorization_type:
        | "H1B"
        | "CPT-EAD"
        | "OPT-EAD"
        | "GC"
        | "GC-EAD"
        | "USC"
        | "TN"
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
      user_role: ["candidate", "employer", "admin"],
      work_authorization_type: [
        "H1B",
        "CPT-EAD",
        "OPT-EAD",
        "GC",
        "GC-EAD",
        "USC",
        "TN",
      ],
    },
  },
} as const
