import { redirect } from "next/navigation";
import { AdminGigsClient } from "./admin-gigs-client";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import { type ProfileRow } from "@/types/database-helpers";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function AdminGigsPage() {
  const supabase = await createSupabaseServer();

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?returnUrl=/admin/gigs");
  }

  // Get user role from profiles table
  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id as string)
    .single();

  if (userError || (userData as ProfileRow)?.role !== "admin") {
    redirect("/login?returnUrl=/admin/gigs");
  }

  // Fetch all gigs (no direct FK to client_profiles, so fetch separately)
  const { data: gigs, error: gigsError } = await supabase
    .from("gigs")
    .select(`
      id,
      client_id,
      title,
      description,
      category,
      location,
      compensation,
      duration,
      date,
      application_deadline,
      status,
      image_url,
      created_at,
      updated_at
    `)
    .order("created_at", { ascending: false });

  if (gigsError) {
    logger.error("Error fetching gigs", gigsError);
    return <AdminGigsClient gigs={[]} user={user} />;
  }

  // Fetch client profiles separately and combine
  const clientIds = gigs?.map((gig) => gig.client_id) || [];
  const { data: clientProfiles } = await supabase
    .from("client_profiles")
    .select("user_id, company_name")
    .in("user_id", [...new Set(clientIds)]);

  // Map client profiles by user_id for quick lookup
  const clientProfilesMap = new Map(
    (clientProfiles || []).map((cp) => [cp.user_id, cp.company_name])
  );

  // Combine gigs with client profile data
  const gigsWithClient = (gigs || []).map((gig) => ({
    ...gig,
    client_profiles: {
      company_name: clientProfilesMap.get(gig.client_id) || "N/A",
    },
  }));

  return <AdminGigsClient gigs={gigsWithClient} user={user} />;
}

