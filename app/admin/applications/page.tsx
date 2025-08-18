import { redirect } from "next/navigation";
import { AdminApplicationsClient } from "./admin-applications-client";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { Database } from "@/types/supabase";

type Application = Database["public"]["Tables"]["applications"]["Row"];

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  const supabase = await createSupabaseServer();

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?returnUrl=/admin/applications");
  }

  // Get user role from profiles table
  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userError || userData?.role !== "admin") {
    redirect("/login?returnUrl=/admin/applications");
  }

  // Fetch applications - simplified query without complex joins
  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select(
      `
      id,
      gig_id,
      talent_id,
      status,
      message,
      created_at,
      updated_at
    `
    )
    .order("created_at", { ascending: false });

  if (applicationsError) {
    console.error("Error fetching applications:", applicationsError);
    // Return empty array instead of throwing error
    return <AdminApplicationsClient applications={[]} user={user} />;
  }

  // Transform the data to match the expected structure
  const transformedApplications = (applications || []).map((app: Application) => ({
    ...app,
    gigs: null, // We'll fetch gig data separately if needed
    talent: null, // We'll fetch talent data separately if needed
  }));

  return <AdminApplicationsClient applications={transformedApplications} user={user} />;
}
