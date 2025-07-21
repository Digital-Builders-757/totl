import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminApplicationsClient } from "./admin-applications-client";
import type { Database } from "@/types/database";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?returnUrl=/admin/applications");
  }

  // Get user role from users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userError || userData?.role !== "admin") {
    redirect("/login?returnUrl=/admin/applications");
  }

  // Fetch applications
  const { data: applications, error: applicationsError } = await supabase
    .from("client_applications")
    .select(
      `
      id, 
      first_name, 
      last_name, 
      company_name, 
      email, 
      phone, 
      industry, 
      business_description, 
      needs_description, 
      website, 
      status, 
      admin_notes, 
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

  return <AdminApplicationsClient applications={applications || []} user={user} />;
}
