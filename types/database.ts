// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Generated from Supabase database schema on 2025-10-23
// Run: npx supabase@2.33.4 gen types typescript --linked --schema public

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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          created_at: string
          gig_id: string
          id: string
          message: string | null
          status: Database["public"]["Enums"]["application_status"]
          talent_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          gig_id: string
          id?: string
          message?: string | null
          status: Database["public"]["Enums"]["application_status"]
          talent_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          gig_id?: string
          id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "admin_bookings_dashboard"
            referencedColumns: ["gig_id"]
          },
          {
            foreignKeyName: "applications_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "admin_talent_dashboard"
            referencedColumns: ["gig_id"]
          },
          {
            foreignKeyName: "applications_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          compensation: number | null
          created_at: string
          date: string
          gig_id: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["booking_status"]
          talent_id: string
          updated_at: string
        }
        Insert: {
          compensation?: number | null
          created_at?: string
          date: string
          gig_id: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          talent_id: string
          updated_at?: string
        }
        Update: {
          compensation?: number | null
          created_at?: string
          date?: string
          gig_id?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "admin_bookings_dashboard"
            referencedColumns: ["gig_id"]
          },
          {
            foreignKeyName: "bookings_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "admin_talent_dashboard"
            referencedColumns: ["gig_id"]
          },
          {
            foreignKeyName: "bookings_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_applications: {
        Row: {
          admin_notes: string | null
          business_description: string
          company_name: string
          created_at: string
          email: string
          first_name: string
          id: string
          industry: string | null
          last_name: string
          needs_description: string
          phone: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          business_description: string
          company_name: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          industry?: string | null
          last_name: string
          needs_description: string
          phone?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          business_description?: string
          company_name?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          industry?: string | null
          last_name?: string
          needs_description?: string
          phone?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      client_profiles: {
        Row: {
          company_name: string
          company_size: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          industry: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          company_name: string
          company_size?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          company_name?: string
          company_size?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_notifications: {
        Row: {
          categories: string[] | null
          created_at: string | null
          email: string
          frequency: string | null
          id: string
          is_active: boolean | null
          locations: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          categories?: string[] | null
          created_at?: string | null
          email: string
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          locations?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          categories?: string[] | null
          created_at?: string | null
          email?: string
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          locations?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      gig_requirements: {
        Row: {
          created_at: string | null
          gig_id: string
          id: string
          requirement: string
        }
        Insert: {
          created_at?: string | null
          gig_id: string
          id?: string
          requirement: string
        }
        Update: {
          created_at?: string | null
          gig_id?: string
          id?: string
          requirement?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_requirements_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "admin_bookings_dashboard"
            referencedColumns: ["gig_id"]
          },
          {
            foreignKeyName: "gig_requirements_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "admin_talent_dashboard"
            referencedColumns: ["gig_id"]
          },
          {
            foreignKeyName: "gig_requirements_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      gigs: {
        Row: {
          application_deadline: string | null
          category: string
          client_id: string
          compensation: string
          created_at: string
          date: string
          description: string
          duration: string
          id: string
          image_url: string | null
          location: string
          search_vector: unknown
          status: Database["public"]["Enums"]["gig_status"]
          title: string
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          category: string
          client_id: string
          compensation: string
          created_at?: string
          date: string
          description: string
          duration: string
          id?: string
          image_url?: string | null
          location: string
          search_vector?: unknown
          status: Database["public"]["Enums"]["gig_status"]
          title: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          category?: string
          client_id?: string
          compensation?: string
          created_at?: string
          date?: string
          description?: string
          duration?: string
          id?: string
          image_url?: string | null
          location?: string
          search_vector?: unknown
          status?: Database["public"]["Enums"]["gig_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gigs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          caption: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          talent_id: string
          title: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          talent_id: string
          title: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          talent_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email_verified: boolean | null
          id: string
          instagram_handle: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_path?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email_verified?: boolean | null
          id: string
          instagram_handle?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_path?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email_verified?: boolean | null
          id?: string
          instagram_handle?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      talent_profiles: {
        Row: {
          age: number | null
          created_at: string
          experience: string | null
          experience_years: number | null
          eye_color: string | null
          first_name: string
          hair_color: string | null
          height: string | null
          id: string
          languages: string[] | null
          last_name: string
          location: string | null
          measurements: string | null
          phone: string | null
          portfolio_url: string | null
          shoe_size: string | null
          specialties: string[] | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          age?: number | null
          created_at?: string
          experience?: string | null
          experience_years?: number | null
          eye_color?: string | null
          first_name: string
          hair_color?: string | null
          height?: string | null
          id?: string
          languages?: string[] | null
          last_name: string
          location?: string | null
          measurements?: string | null
          phone?: string | null
          portfolio_url?: string | null
          shoe_size?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          age?: number | null
          created_at?: string
          experience?: string | null
          experience_years?: number | null
          eye_color?: string | null
          first_name?: string
          hair_color?: string | null
          height?: string | null
          id?: string
          languages?: string[] | null
          last_name?: string
          location?: string | null
          measurements?: string | null
          phone?: string | null
          portfolio_url?: string | null
          shoe_size?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_bookings_dashboard: {
        Row: {
          booking_compensation: number | null
          booking_date: string | null
          booking_id: string | null
          client_company_name: string | null
          gig_id: string | null
          gig_location: string | null
          gig_status: Database["public"]["Enums"]["gig_status"] | null
          gig_title: string | null
          talent_avatar_url: string | null
          talent_display_name: string | null
        }
        Relationships: []
      }
      admin_dashboard_cache: {
        Row: {
          active_gigs: number | null
          last_updated: string | null
          total_applications: number | null
          total_bookings: number | null
          total_clients: number | null
          total_gigs: number | null
          total_talent: number | null
          total_users: number | null
        }
        Relationships: []
      }
      admin_talent_dashboard: {
        Row: {
          application_created_at: string | null
          application_id: string | null
          application_status:
            | Database["public"]["Enums"]["application_status"]
            | null
          client_company_name: string | null
          gig_id: string | null
          gig_location: string | null
          gig_status: Database["public"]["Enums"]["gig_status"] | null
          gig_title: string | null
          talent_avatar_url: string | null
          talent_display_name: string | null
          talent_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          attname: unknown
          correlation: number | null
          n_distinct: number | null
          schemaname: unknown
          tablename: unknown
        }
        Relationships: []
      }
      query_stats: {
        Row: {
          calls: number | null
          max_exec_time: number | null
          mean_exec_time: number | null
          min_exec_time: number | null
          query: string | null
          total_exec_time: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      analyze_tables: { Args: never; Returns: undefined }
      backfill_missing_profiles: {
        Args: never
        Returns: {
          created: boolean
          profile_type: string
          profile_user_id: string
        }[]
      }
      check_auth_schema: { Args: never; Returns: Json }
      check_auth_schema_optimized: { Args: never; Returns: Json }
      get_admin_dashboard_stats: {
        Args: never
        Returns: {
          active_gigs: number
          last_updated: string
          total_applications: number
          total_bookings: number
          total_clients: number
          total_gigs: number
          total_talent: number
          total_users: number
        }[]
      }
      get_query_hints: {
        Args: never
        Returns: {
          hint_description: string
          hint_type: string
          recommendation: string
        }[]
      }
      get_slow_queries: {
        Args: never
        Returns: {
          calls: number
          mean_time: number
          query: string
          total_time: number
        }[]
      }
      get_user_profile: {
        Args: never
        Returns: {
          email: string
          id: string
        }[]
      }
      maintenance_cleanup: { Args: never; Returns: undefined }
      refresh_admin_dashboard_cache: { Args: never; Returns: undefined }
      test_enum_casting: { Args: { test_role: string }; Returns: string }
      test_trigger_function_exists: { Args: never; Returns: boolean }
    }
    Enums: {
      application_status:
        | "new"
        | "under_review"
        | "shortlisted"
        | "rejected"
        | "accepted"
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      gig_status: "draft" | "active" | "closed" | "featured" | "urgent"
      user_role: "talent" | "client" | "admin"
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
      application_status: [
        "new",
        "under_review",
        "shortlisted",
        "rejected",
        "accepted",
      ],
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      gig_status: ["draft", "active", "closed", "featured", "urgent"],
      user_role: ["talent", "client", "admin"],
    },
  },
} as const
