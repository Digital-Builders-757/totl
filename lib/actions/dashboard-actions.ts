"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { Database } from "@/types/supabase";

type TalentProfileLite = Pick<
  Database["public"]["Tables"]["talent_profiles"]["Row"],
  "first_name" | "last_name" | "location"
>;

type TalentApplication = Database["public"]["Tables"]["applications"]["Row"] & {
  gigs?: Database["public"]["Tables"]["gigs"]["Row"] & {
    client_profiles?: Pick<
      Database["public"]["Tables"]["client_profiles"]["Row"],
      "company_name"
    > | null;
  };
};

type Gig = Database["public"]["Tables"]["gigs"]["Row"];

export type TalentDashboardData = {
  talentProfile: TalentProfileLite | null;
  applications: TalentApplication[];
  gigs: Gig[];
};

/**
 * Fetch all talent dashboard data in parallel (Server Component)
 * This eliminates sequential client-side fetches and reduces round trips
 */
export async function getTalentDashboardData(
  userId: string
): Promise<TalentDashboardData> {
  const supabase = await createSupabaseServer();

  // Fetch all data in parallel using Promise.all
  const [talentProfileResult, applicationsResult, gigsResult] = await Promise.all([
    // Talent profile
    supabase
      .from("talent_profiles")
      .select("first_name,last_name,location")
      .eq("user_id", userId)
      .maybeSingle<TalentProfileLite>(),

    // Applications with nested gig and client profile data
    supabase
      .from("applications")
      .select(
        "id,status,created_at,updated_at,message,gig_id,talent_id,gigs(title,description,category,location,compensation,image_url,date,client_profiles!inner(company_name))"
      )
      .eq("talent_id", userId)
      .order("created_at", { ascending: false }),

    // Available gigs (active only)
    supabase
      .from("gigs")
      .select("id,title,description,category,location,compensation,status,image_url,date,application_deadline,created_at,updated_at")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
  ]);

  // Handle errors gracefully
  if (talentProfileResult.error && talentProfileResult.error.code !== "PGRST116") {
    console.error("[getTalentDashboardData] Error fetching talent profile:", talentProfileResult.error);
  }

  if (applicationsResult.error) {
    console.error("[getTalentDashboardData] Error fetching applications:", applicationsResult.error);
  }

  if (gigsResult.error) {
    console.error("[getTalentDashboardData] Error fetching gigs:", gigsResult.error);
  }

  return {
    talentProfile: talentProfileResult.data ?? null,
    // Type assertion needed because Supabase select with nested relations returns a different shape
    applications: (applicationsResult.data ?? []) as unknown as TalentApplication[],
    gigs: (gigsResult.data ?? []) as Gig[],
  };
}

type ClientProfile = Database["public"]["Tables"]["client_profiles"]["Row"];

type ClientApplication = Database["public"]["Tables"]["applications"]["Row"] & {
  gigs?: Database["public"]["Tables"]["gigs"]["Row"];
  profiles?: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "display_name" | "email_verified" | "role" | "avatar_url"
  >;
};

type ClientGig = Database["public"]["Tables"]["gigs"]["Row"];

export type ClientDashboardData = {
  clientProfile: ClientProfile | null;
  applications: ClientApplication[];
  gigs: ClientGig[];
};

/**
 * Fetch all client dashboard data in parallel (Server Component)
 * This eliminates sequential client-side fetches and reduces round trips
 */
export async function getClientDashboardData(
  userId: string
): Promise<ClientDashboardData> {
  const supabase = await createSupabaseServer();

  // Fetch all data in parallel using Promise.all
  const [clientProfileResult, gigsResult, applicationsResult] = await Promise.all([
    // Client profile
    supabase
      .from("client_profiles")
      .select(
        "id,user_id,company_name,industry,website,contact_name,contact_email,contact_phone,company_size,created_at,updated_at"
      )
      .eq("user_id", userId)
      .maybeSingle<ClientProfile>(),

    // Client's gigs
    supabase
      .from("gigs")
      .select(
        "id,client_id,title,description,category,location,compensation,status,application_deadline,created_at,updated_at,image_url"
      )
      .eq("client_id", userId)
      .order("created_at", { ascending: false }),

    // Applications for client's gigs
    supabase
      .from("applications")
      .select(
        "id,gig_id,talent_id,status,message,created_at,updated_at,gigs!inner(title,category,location,compensation),profiles!talent_id(display_name,email_verified,role,avatar_url)"
      )
      .eq("gigs.client_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  // Handle errors gracefully
  if (clientProfileResult.error && clientProfileResult.error.code !== "PGRST116") {
    console.error("[getClientDashboardData] Error fetching client profile:", clientProfileResult.error);
  }

  if (gigsResult.error) {
    console.error("[getClientDashboardData] Error fetching gigs:", gigsResult.error);
  }

  if (applicationsResult.error) {
    console.error("[getClientDashboardData] Error fetching applications:", applicationsResult.error);
  }

  return {
    clientProfile: clientProfileResult.data ?? null,
    gigs: (gigsResult.data ?? []) as ClientGig[],
    applications: (applicationsResult.data ?? []) as ClientApplication[],
  };
}
