import { redirect } from "next/navigation";
import { DashboardClient } from "./client";
import { PATHS } from "@/lib/constants/routes";
import { PROFILE_ROLE_SELECT } from "@/lib/db/selects";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(PATHS.LOGIN);
  }

  // Auth-critical: never select '*'
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(PROFILE_ROLE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    console.error("Error fetching profile:", error);
    redirect(PATHS.LOGIN);
  }

  // Now safe to access profile.role
  return <DashboardClient userRole={profile.role} />;
}
