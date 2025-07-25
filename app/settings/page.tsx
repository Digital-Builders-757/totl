import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/SettingsForm";

// Force dynamic rendering to prevent build-time issues
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration Error</h2>
          <p className="text-gray-600 mb-4">
            Supabase is not configured. Please check your environment variables.
          </p>
        </div>
      </div>
    );
  }

  const supabase = createServerComponentClient({ cookies });

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
  }

  // Get role-specific profile
  let roleProfile = null;
  if (profile?.role === "talent") {
    const { data: talentProfile } = await supabase
      .from("talent_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    roleProfile = talentProfile;
  } else if (profile?.role === "client") {
    const { data: clientProfile } = await supabase
      .from("client_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    roleProfile = clientProfile;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your account and profile information</p>
          </div>

          <SettingsForm
            user={user}
            profile={profile}
            roleProfile={roleProfile}
            userRole={profile?.role}
          />
        </div>
      </div>
    </div>
  );
}
