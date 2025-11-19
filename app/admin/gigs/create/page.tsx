import { redirect } from "next/navigation";
import { CreateGigForm } from "./create-gig-form";
import { AdminHeader } from "@/components/admin/admin-header";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { type ProfileRow } from "@/types/database-helpers";

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

  if (userError || (userData as ProfileRow)?.role !== "admin") {
    redirect("/login?returnUrl=/admin/gigs/create");
  }

  return (
    <>
      <AdminHeader user={user} notificationCount={0} />
      <CreateGigForm />
    </>
  );
}
