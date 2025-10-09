import { redirect } from "next/navigation";
import { AdminDashboardClient } from "./admin-dashboard-client";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { type ProfileRow } from "@/types/database-helpers";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createSupabaseServer();

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?returnUrl=/admin/dashboard");
  }

  // Get user role from profiles table
  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id as string)
    .single();

  if (userError || (userData as ProfileRow)?.role !== "admin") {
    redirect("/login?returnUrl=/admin/dashboard");
  }

  // Fetch dashboard data
  const { data: gigs } = await supabase
    .from("gigs")
    .select("id,title,client_id,status,location,compensation,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: applications } = await supabase
    .from("applications")
    .select("id,gig_id,talent_id,status,message,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <AdminDashboardClient
      user={user}
      gigs={(gigs || []) as any} // eslint-disable-line @typescript-eslint/no-explicit-any
      applications={(applications || []) as any} // eslint-disable-line @typescript-eslint/no-explicit-any
    />
  );
}
