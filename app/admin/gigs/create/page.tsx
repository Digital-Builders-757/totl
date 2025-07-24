import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CreateGigForm } from "./create-gig-form";
import type { Database } from "@/types/database";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function CreateGigPage() {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?returnUrl=/admin/gigs/create");
  }

  // Get user role from users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userError || userData?.role !== "admin") {
    redirect("/login?returnUrl=/admin/gigs/create");
  }

  return <CreateGigForm user={user} />;
}
