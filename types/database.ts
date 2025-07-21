export type UserRole = "admin" | "client" | "talent";
export type GigStatus = "draft" | "published" | "closed" | "completed";
export type ApplicationStatus = "pending" | "accepted" | "rejected";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

// Core user table linked to Supabase Auth
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Additional user profile information
export interface Profile {
  id: string;
  user_id: string;
  bio?: string;
  location?: string;
  phone?: string;
  instagram_handle?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

// Extended profile information for talent users
export interface TalentProfile {
  id: string;
  user_id: string;
  height?: number;
  weight?: number;
  measurements?: string;
  experience_years?: number;
  specialties?: string[];
  portfolio_url?: string;
  created_at: string;
  updated_at: string;
}

// Extended profile information for client users
export interface ClientProfile {
  id: string;
  user_id: string;
  company_name?: string;
  industry?: string;
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
  requirements?: string[];
  location: string;
  start_date: string;
  end_date: string;
  compensation_min?: number;
  compensation_max?: number;
  status: GigStatus;
  created_at: string;
  updated_at: string;
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

// Confirmed bookings between clients and talent
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

// Portfolio items for talent to showcase their work
export interface PortfolioItem {
  id: string;
  talent_id: string;
  title: string;
  description?: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

// Database schema type - ONLY includes tables that actually exist in the database
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id">>;
      };
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

      applications: {
        Row: Application;
        Insert: Omit<Application, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Application, "id">>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Booking, "id">>;
      };
      portfolio_items: {
        Row: PortfolioItem;
        Insert: Omit<PortfolioItem, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PortfolioItem, "id">>;
      };
    };
  };
}
