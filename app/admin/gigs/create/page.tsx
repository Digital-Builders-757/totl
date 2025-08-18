import { redirect } from "next/navigation";
import { CreateGigForm } from "./create-gig-form";
import { createSupabaseServer } from "@/lib/supabase-server";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function CreateGigPage() {
  const supabase = await createSupabaseServer();

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?returnUrl=/admin/gigs/create");
  }

  // Get user role from profiles table
  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id as string)
    .single();

  if (userError || (userData as any)?.role !== "admin") {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    redirect("/login?returnUrl=/admin/gigs/create");
  }

  return <CreateGigForm />;
}
