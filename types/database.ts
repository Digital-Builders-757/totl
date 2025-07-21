export type UserRole = "admin" | "client" | "talent";
export type GigStatus = "draft" | "active" | "closed" | "featured" | "urgent";
export type ApplicationStatus = "new" | "under_review" | "shortlisted" | "rejected" | "accepted";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

// Core user profile table linked to Supabase Auth
export interface Profile {
  id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  display_name?: string;
  avatar_url?: string;
  email_verified?: boolean;
}

// Extended profile information for talent users
export interface TalentProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  age?: number;
  location?: string;
  experience?: string;
  portfolio_url?: string;
  height?: string;
  measurements?: string;
  hair_color?: string;
  eye_color?: string;
  shoe_size?: string;
  languages?: string[];
  created_at: string;
  updated_at: string;
}

// Extended profile information for client users
export interface ClientProfile {
  id: string;
  user_id: string;
  company_name: string;
  industry?: string;
  website?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  company_size?: string;
  created_at: string;
  updated_at: string;
}

// Job opportunities posted by clients
export interface Gig {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  compensation: string;
  duration: string;
  date: string; // This is actually a date in DB, but we'll keep as string for API compatibility
  application_deadline?: string;
  status: GigStatus;
  image_url?: string;
  search_vector?: unknown; // tsvector in DB, but unknown for TypeScript compatibility
  created_at: string;
  updated_at: string;
}

// Specific requirements for each gig
export interface GigRequirement {
  id: string;
  gig_id: string;
  requirement: string;
  created_at?: string;
}

// Applications submitted by talent for gigs
export interface Application {
  id: string;
  gig_id: string;
  talent_id: string;
  status: ApplicationStatus;
  message?: string;
  created_at: string;
  updated_at: string;
}

// Applications from potential clients to join the platform
export interface ClientApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name: string;
  industry?: string;
  website?: string;
  business_description: string;
  needs_description: string;
  status: string; // Defaults to 'pending' in DB
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

// Database schema type - ONLY includes tables that actually exist in the database
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id">>;
      };
      talent_profiles: {
        Row: TalentProfile;
        Insert: Omit<TalentProfile, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<TalentProfile, "id">>;
      };
      client_profiles: {
        Row: ClientProfile;
        Insert: Omit<ClientProfile, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ClientProfile, "id">>;
      };
      gigs: {
        Row: Gig;
        Insert: Omit<Gig, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Gig, "id">>;
      };
      gig_requirements: {
        Row: GigRequirement;
        Insert: Omit<GigRequirement, "id" | "created_at">;
        Update: Partial<Omit<GigRequirement, "id">>;
      };
      applications: {
        Row: Application;
        Insert: Omit<Application, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Application, "id">>;
      };
      client_applications: {
        Row: ClientApplication;
        Insert: Omit<ClientApplication, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ClientApplication, "id">>;
      };
    };
  };
}

// Legacy interfaces for backward compatibility (deprecated)
// These tables don't exist in the actual database schema
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  gig_id: string;
  talent_id: string;
  status: BookingStatus;
  compensation?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItem {
  id: string;
  talent_id: string;
  title: string;
  description?: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}
