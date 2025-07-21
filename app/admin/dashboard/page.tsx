import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "./admin-dashboard-client";
import type { Database } from "@/types/database";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?returnUrl=/admin/dashboard");
  }

  // Get user role from users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userError || userData?.role !== "admin") {
    redirect("/login?returnUrl=/admin/dashboard");
  }

  // Fetch dashboard data (gigs, applications, etc.)
  const { data: gigs, error: gigsError } = await supabase
    .from("gigs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  return <AdminDashboardClient user={user} gigs={gigs || []} applications={applications || []} />;
}
