import { redirect } from "next/navigation";
import { AdminDashboardClient } from "./admin-dashboard-client";
import { createSupabaseServerClient } from "@/lib/supabase-client";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();

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
    .eq("id", user.id)
    .single();

  if (userError || userData?.role !== "admin") {
    redirect("/login?returnUrl=/admin/dashboard");
  }

  // Fetch dashboard data (gigs, applications, etc.)
  const { data: gigs } = await supabase
    .from("gigs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  return <AdminDashboardClient user={user} gigs={gigs || []} applications={applications || []} />;
}
