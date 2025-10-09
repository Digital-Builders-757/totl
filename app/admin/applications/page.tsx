import { redirect } from "next/navigation";
import { AdminApplicationsClient } from "./admin-applications-client";
import { type ProfileRow, type ApplicationRow } from "@/types/database";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

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
    .eq("id", user.id as string)
    .single();

  if (userError || (userData as ProfileRow)?.role !== "admin") {
    redirect("/login?returnUrl=/admin/applications");
  }

  // Fetch applications
  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select("id,gig_id,talent_id,status,message,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (applicationsError) {
    console.error("Error fetching applications:", applicationsError);
    return <AdminApplicationsClient applications={[]} user={user} />;
  }

  // Transform the data to match the expected structure
  const transformedApplications = (applications || []).map((app: ApplicationRow) => ({
    ...app,
    gigs: null, // We'll fetch gig data separately if needed
    talent: null, // We'll fetch talent data separately if needed
  }));

  return <AdminApplicationsClient applications={transformedApplications} user={user} />;
}
