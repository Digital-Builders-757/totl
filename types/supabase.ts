export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          role: string | null;
          email_verified: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          role?: string | null;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          role?: string | null;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      talent_profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name?: string | null;
          last_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string | null;
          last_name?: string | null;
          created_at?: string;
        };
      };
      client_profiles: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          industry: string | null;
          website: string | null;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          company_size: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          industry?: string | null;
          website?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          company_size?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          industry?: string | null;
          website?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          company_size?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      client_applications: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          company_name: string;
          industry: string | null;
          website: string | null;
          business_description: string;
          needs_description: string;
          status: "pending" | "approved" | "rejected";
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          company_name: string;
          industry?: string | null;
          website?: string | null;
          business_description: string;
          needs_description: string;
          status?: "pending" | "approved" | "rejected";
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          company_name?: string;
          industry?: string | null;
          website?: string | null;
          business_description?: string;
          needs_description?: string;
          status?: "pending" | "approved" | "rejected";
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      gigs: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          description: string;
          category: string;
          location: string;
          compensation: string;
          duration: string;
          date: string;
          application_deadline: string | null;
          requirements: string[] | null;
          status: "draft" | "active" | "closed" | "featured" | "urgent";
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          title: string;
          description: string;
          category: string;
          location: string;
          compensation: string;
          duration: string;
          date: string;
          application_deadline?: string | null;
          requirements?: string[] | null;
          status?: "draft" | "active" | "closed" | "featured" | "urgent";
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          title?: string;
          description?: string;
          category?: string;
          location?: string;
          compensation?: string;
          duration?: string;
          date?: string;
          application_deadline?: string | null;
          requirements?: string[] | null;
          status?: "draft" | "active" | "closed" | "featured" | "urgent";
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          gig_id: string;
          talent_id: string;
          status: "new" | "under_review" | "shortlisted" | "rejected" | "accepted";
          message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gig_id: string;
          talent_id: string;
          status?: "new" | "under_review" | "shortlisted" | "rejected" | "accepted";
          message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gig_id?: string;
          talent_id?: string;
          status?: "new" | "under_review" | "shortlisted" | "rejected" | "accepted";
          message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
