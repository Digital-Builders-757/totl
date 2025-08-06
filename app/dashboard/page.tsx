export const dynamic = "force-dynamic";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardClient } from "./client";
import type { Database } from "@/types/supabase";

export default async function DashboardPage() {
  const cookieStore = cookies(); // ✅ Fixed: no await needed
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

  // Get user profile data directly - no need for getSession since middleware handles auth
  const { data: profile, error } = await supabase.from("profiles").select("*").single();

  // ✅ Fixed: Proper type guards
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
