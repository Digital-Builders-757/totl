import type { SupabaseClient } from "@supabase/supabase-js";
import type { GigStatus } from "@/types/database";
import type { Database } from "@/types/supabase";

// Type definition for gig filters
interface GigFilters {
  category?: string;
  location?: string;
  status?: GigStatus;
  client_id?: string;
  [key: string]: string | undefined;
}

/**
 * A utility to create safe Supabase queries that avoid aggregate functions
 * and follow best practices for RLS compatibility
 */
export const safeQuery = {
  /**
   * Safely get a profile by user ID
   */
  getProfileByUserId: async (supabase: SupabaseClient<Database>, userId: string) => {
    return await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, role, created_at")
      .eq("id", userId)
      .single();
  },

  /**
   * Safely get talent profile by user ID
   */
  getTalentProfileByUserId: async (supabase: SupabaseClient<Database>, userId: string) => {
    return await supabase
      .from("talent_profiles")
      .select(
        `
        id, 
        user_id, 
        first_name, 
        last_name, 
        phone, 
        age, 
        location, 
        experience,
        specialty,
        bio
      `
      )
      .eq("user_id", userId)
      .single();
  },

  /**
   * Safely get client profile by user ID
   */
  getClientProfileByUserId: async (supabase: SupabaseClient<Database>, userId: string) => {
    return await supabase
      .from("client_profiles")
      .select(
        `
        id, 
        user_id, 
        company_name, 
        contact_name, 
        email, 
        phone, 
        industry
      `
      )
      .eq("user_id", userId)
      .single();
  },

  /**
   * Safely get gigs with pagination
   */
  getGigs: async (
    supabase: SupabaseClient<Database>,
    page = 1,
    pageSize = 10,
    filters: GigFilters = {}
  ) => {
    let query = supabase.from("gigs").select(`
        id, 
        title, 
        description, 
        location, 
        compensation, 
        date, 
        category,
        image,
        client_id,
        created_at,
        status
      `);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query = query.eq(key, value);
      }
    });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    return await query.order("created_at", { ascending: false }).range(from, to);
  },

  /**
   * Safely get applications with pagination
   */
  getApplications: async (
    supabase: SupabaseClient<Database>,
    page = 1,
    pageSize = 10,
    status?: string
  ) => {
    let query = supabase.from("applications").select(`
        id, 
        user_id, 
        gig_id, 
        status, 
        created_at, 
        updated_at
      `);

    if (status) {
      query = query.eq("status", status);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    return await query.order("created_at", { ascending: false }).range(from, to);
  },
};
