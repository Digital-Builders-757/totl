"use server";

import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

// Generated table row types
type TalentProfileRow = Database["public"]["Tables"]["talent_profiles"]["Row"];
type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];
type GigRow = Database["public"]["Tables"]["gigs"]["Row"];
type ClientProfileRow = Database["public"]["Tables"]["client_profiles"]["Row"];

// Lite shapes (explicit columns only)
type TalentProfileLite = Pick<TalentProfileRow, "first_name" | "last_name" | "location">;

type ApplicationWithGigRaw = Pick<
  ApplicationRow,
  "id" | "status" | "created_at" | "updated_at" | "message" | "gig_id" | "talent_id"
> & {
  gigs: Pick<
    GigRow,
    "id" | "title" | "description" | "category" | "location" | "compensation" | "image_url" | "date" | "client_id"
  > | null;
};

type GigRaw = Pick<
  GigRow,
  "id" | "client_id" | "title" | "description" | "category" | "location" | "compensation" | "status" | "image_url" | "date" |
  "application_deadline" | "created_at" | "updated_at"
>;

type ClientProfileLite = Pick<ClientProfileRow, "user_id" | "company_name">;

// Final dashboard shapes (keeps `client_profiles` nested under gig)
type GigWithCompany = GigRaw & {
  client_profiles: { company_name: string } | null;
};

type ApplicationWithGigAndCompany = Omit<ApplicationWithGigRaw, "gigs"> & {
  gigs: (ApplicationWithGigRaw["gigs"] & { client_profiles: { company_name: string } | null }) | null;
};

export type TalentDashboardData = {
  talentProfile: TalentProfileLite | null;
  applications: ApplicationWithGigAndCompany[];
  gigs: GigWithCompany[];
};

/**
 * Fetch all talent dashboard data in parallel (Server Component)
 * This eliminates sequential client-side fetches and reduces round trips
 * 
 * FIXES:
 * - Removed invalid nested embed (gigs -> client_profiles has no direct FK)
 * - Removed !inner join that drops rows
 * - Throws on real query failures instead of silent empty arrays
 * - Fetches client profiles separately and merges them
 */
export async function getTalentDashboardData(
  userId: string
): Promise<TalentDashboardData> {
  return Sentry.startSpan(
    {
      name: "getTalentDashboardData",
      op: "db.query",
    },
    async () => {
      const supabase = await createSupabaseServer();

      const [talentProfileResult, applicationsResult, gigsResult] = await Promise.all([
    supabase
      .from("talent_profiles")
      .select("first_name,last_name,location")
      .eq("user_id", userId)
      .maybeSingle<TalentProfileLite>(),

    supabase
      .from("applications")
      .select(
        "id,status,created_at,updated_at,message,gig_id,talent_id,gigs(id,title,description,category,location,compensation,image_url,date,client_id)"
      )
      .eq("talent_id", userId)
      .order("created_at", { ascending: false })
      .returns<ApplicationWithGigRaw[]>(),

    supabase
      .from("gigs")
      .select(
        "id,client_id,title,description,category,location,compensation,status,image_url,date,application_deadline,created_at,updated_at"
      )
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .returns<GigRaw[]>(),
  ]);

  // Talent profile: allow "not found" (setup not finished), but hard-fail other errors
  if (talentProfileResult.error && talentProfileResult.error.code !== "PGRST116") {
    throw new Error(
      `[getTalentDashboardData] Failed to fetch talent profile: ${talentProfileResult.error.message}`
    );
  }

  // Hard-fail real query errors (no silent empty dashboards)
  if (applicationsResult.error) {
    throw new Error(
      `[getTalentDashboardData] Failed to fetch applications: ${applicationsResult.error.message}`
    );
  }
  if (gigsResult.error) {
    throw new Error(
      `[getTalentDashboardData] Failed to fetch gigs: ${gigsResult.error.message}`
    );
  }

  const applicationsRaw = applicationsResult.data ?? [];
  const gigsRaw = gigsResult.data ?? [];

  // Collect unique client ids from both apps + gigs
  const clientIds = new Set<string>();
  for (const app of applicationsRaw) {
    if (app.gigs?.client_id) clientIds.add(app.gigs.client_id);
  }
  for (const gig of gigsRaw) {
    if (gig.client_id) clientIds.add(gig.client_id);
  }

  let companyByClientId = new Map<string, string>();

  if (clientIds.size > 0) {
    const clientProfilesResult = await supabase
      .from("client_profiles")
      .select("user_id,company_name")
      .in("user_id", Array.from(clientIds))
      .returns<ClientProfileLite[]>();

    if (clientProfilesResult.error) {
      throw new Error(
        `[getTalentDashboardData] Failed to fetch client profiles: ${clientProfilesResult.error.message}`
      );
    }

    companyByClientId = new Map(
      (clientProfilesResult.data ?? []).map((cp) => [cp.user_id, cp.company_name])
    );
  }

  const applications: ApplicationWithGigAndCompany[] = applicationsRaw.map((app) => {
    const clientId = app.gigs?.client_id ?? null;
    const companyName = clientId ? companyByClientId.get(clientId) ?? null : null;

    return {
      ...app,
      gigs: app.gigs
        ? {
            ...app.gigs,
            client_profiles: companyName ? { company_name: companyName } : null,
          }
        : null,
    };
  });

  const gigs: GigWithCompany[] = gigsRaw.map((gig) => {
    const companyName = companyByClientId.get(gig.client_id) ?? null;
    return {
      ...gig,
      client_profiles: companyName ? { company_name: companyName } : null,
    };
  });

      return {
        talentProfile: talentProfileResult.data ?? null,
        applications,
        gigs,
      };
    }
  );
}

type ClientProfile = Database["public"]["Tables"]["client_profiles"]["Row"];

type ClientApplicationRaw = Pick<
  Database["public"]["Tables"]["applications"]["Row"],
  "id" | "gig_id" | "talent_id" | "status" | "message" | "created_at" | "updated_at"
> & {
  gigs: Pick<
    Database["public"]["Tables"]["gigs"]["Row"],
    "id" | "title" | "category" | "location" | "compensation"
  > | null;
};

type ClientApplication = ClientApplicationRaw & {
  talent_profiles: Pick<
    Database["public"]["Tables"]["talent_profiles"]["Row"],
    "first_name" | "last_name" | "location" | "experience"
  > | null;
  profiles: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "display_name" | "email_verified" | "role" | "avatar_url"
  > | null;
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
 * 
 * FIXES:
 * - Fetches applications by joining to gigs (gigs.client_id = userId)
 * - Fetches talent_profiles separately using in('user_id', talentIds) to avoid FK join pitfalls
 * - Merges talent_profiles and profiles in memory (matches client/applications pattern)
 */
export async function getClientDashboardData(
  userId: string
): Promise<ClientDashboardData> {
  return Sentry.startSpan(
    {
      name: "getClientDashboardData",
      op: "db.query",
    },
    async () => {
      const supabase = await createSupabaseServer();

      // Step 1: Fetch client profile + gigs in parallel
      const [clientProfileResult, gigsResult] = await Promise.all([
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
  ]);

  // Handle errors
  if (clientProfileResult.error && clientProfileResult.error.code !== "PGRST116") {
    logger.error("[getClientDashboardData] Error fetching client profile", clientProfileResult.error);
  }

  if (gigsResult.error) {
    logger.error("[getClientDashboardData] Error fetching gigs", gigsResult.error);
    throw new Error(`[getClientDashboardData] Failed to fetch gigs: ${gigsResult.error.message}`);
  }

  const gigs = gigsResult.data ?? [];
  const gigIds = gigs.map((gig) => gig.id);

  // Step 2: Fetch applications for client's gigs (using gig_id filter)
  let applicationsRaw: ClientApplicationRaw[] = [];
  if (gigIds.length > 0) {
    const applicationsResult = await supabase
      .from("applications")
      .select(
        "id,gig_id,talent_id,status,message,created_at,updated_at,gigs(id,title,category,location,compensation)"
      )
      .in("gig_id", gigIds)
      .order("created_at", { ascending: false })
      .returns<ClientApplicationRaw[]>();

    if (applicationsResult.error) {
      logger.error("[getClientDashboardData] Error fetching applications", applicationsResult.error);
      throw new Error(`[getClientDashboardData] Failed to fetch applications: ${applicationsResult.error.message}`);
    }

    applicationsRaw = applicationsResult.data ?? [];
  }

  // Step 3: Fetch talent_profiles separately (avoid FK join pitfalls)
  const talentIds = Array.from(new Set(applicationsRaw.map((app) => app.talent_id).filter(Boolean)));
  const talentProfilesMap = new Map<string, Pick<Database["public"]["Tables"]["talent_profiles"]["Row"], "first_name" | "last_name" | "location" | "experience">>();
  const profilesMap = new Map<string, Pick<Database["public"]["Tables"]["profiles"]["Row"], "display_name" | "email_verified" | "role" | "avatar_url">>();

  if (talentIds.length > 0) {
    const [talentProfilesResult, profilesResult] = await Promise.all([
      supabase
        .from("talent_profiles")
        .select("user_id,first_name,last_name,location,experience")
        .in("user_id", talentIds),
      
      supabase
        .from("profiles")
        .select("id,display_name,email_verified,role,avatar_url")
        .in("id", talentIds),
    ]);

    if (talentProfilesResult.error) {
      logger.error("[getClientDashboardData] Error fetching talent_profiles", talentProfilesResult.error);
    } else {
      (talentProfilesResult.data ?? []).forEach((tp) => {
        talentProfilesMap.set(tp.user_id, {
          first_name: tp.first_name,
          last_name: tp.last_name,
          location: tp.location,
          experience: tp.experience,
        });
      });
    }

    if (profilesResult.error) {
      logger.error("[getClientDashboardData] Error fetching profiles", profilesResult.error);
    } else {
      (profilesResult.data ?? []).forEach((p) => {
        profilesMap.set(p.id, {
          display_name: p.display_name,
          email_verified: p.email_verified,
          role: p.role,
          avatar_url: p.avatar_url,
        });
      });
    }
  }

  // Step 4: Merge talent_profiles and profiles into applications
  const applications: ClientApplication[] = applicationsRaw.map((app) => ({
    ...app,
    talent_profiles: app.talent_id ? talentProfilesMap.get(app.talent_id) ?? null : null,
    profiles: app.talent_id ? profilesMap.get(app.talent_id) ?? null : null,
  }));

      return {
        clientProfile: clientProfileResult.data ?? null,
        gigs: gigs as ClientGig[],
        applications,
      };
    }
  );
}
