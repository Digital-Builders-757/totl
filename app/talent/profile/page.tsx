import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TalentProfileForm from "@/components/talent-profile-form";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function TalentProfilePage() {
  const supabase = createServerComponentClient({ cookies });

  // Get the current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get the user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  // Verify this is a talent user
  if (profile.role !== "talent") {
    redirect("/dashboard");
  }

  // Get the talent profile
  const { data: talentProfile, error: talentError } = await supabase
    .from("talent_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (talentError && talentError.code !== "PGRST116") {
    console.error("Error fetching talent profile:", talentError);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-gray-600 mt-2">
            Add your information to make your profile visible to clients
          </p>
        </div>

        <TalentProfileForm initialData={talentProfile} />
      </div>
    </div>
  );
}
