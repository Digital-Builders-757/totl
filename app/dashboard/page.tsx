export const dynamic = "force-dynamic";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { TriangleIcon as ExclamationTriangleIcon } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardClient } from "./client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/database";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

  // Get user profile data directly - no need for getSession since middleware handles auth
  const { data: profile, error } = await supabase.from("profiles").select("*").single();

  if (error || !profile) {
    redirect("/login");
  }

  // 6. Render the user's profile information
  return <DashboardClient userRole={profile.role} />;
}
