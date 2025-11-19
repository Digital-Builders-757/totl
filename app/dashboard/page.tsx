import { redirect } from "next/navigation";
import { DashboardClient } from "./client";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();

  // Get user profile data directly - use maybeSingle() to prevent 406 errors
  const { data: profile, error } = await supabase.from("profiles").select("*").maybeSingle();

  // âœ… Fixed: Proper type guards
  if (error) {
    console.error("Error fetching profile:", error);
    redirect("/login");
  }

  if (!profile) {
    console.error("No profile found");
    redirect("/login");
  }

  // Now safe to access profile.role
  return <DashboardClient userRole={profile.role} />;
}
