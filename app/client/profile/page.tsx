import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ClientProfileForm from "@/components/client-profile-form";

export const dynamic = "force-dynamic";

export default async function ClientProfilePage() {
  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Supabase environment variables not found - redirecting to login");
    redirect("/login?returnUrl=/client/profile");
  }

  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  if (profile.role !== "client") {
    redirect("/dashboard");
  }

  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Company Profile</h1>
          <p className="text-gray-600 mt-2">
            Add your company information to make your gigs more attractive to talent
          </p>
        </div>
        <ClientProfileForm initialData={clientProfile} />
      </div>
    </div>
  );
}
