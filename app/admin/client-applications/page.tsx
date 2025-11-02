import { redirect } from "next/navigation";
import { AdminClientApplicationsClient } from "./admin-client-applications-client";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { Database } from "@/types/supabase";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

type ClientApplication = Database["public"]["Tables"]["client_applications"]["Row"];

export default async function AdminClientApplicationsPage() {
  const supabase = await createSupabaseServer();

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?returnUrl=/admin/client-applications");
  }

  // Get user role from profiles table
  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: Database["public"]["Tables"]["profiles"]["Row"]["role"] }>();

  if (userError || userData?.role !== "admin") {
    redirect("/login?returnUrl=/admin/client-applications");
  }

  // Fetch client applications
  const { data: applications, error: applicationsError } = await supabase
    .from("client_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (applicationsError) {
    console.error("Error fetching client applications:", applicationsError);
    return <AdminClientApplicationsClient applications={[]} user={user} />;
  }

  return <AdminClientApplicationsClient applications={applications || []} user={user} />;
}






