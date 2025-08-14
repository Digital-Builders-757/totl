import { redirect } from "next/navigation";
import { ProfileEditor } from "./profile-editor";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import type { Database } from "@/types/supabase";

// Force dynamic rendering to prevent build-time issues
export const dynamic = "force-dynamic";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Talent = Database["public"]["Tables"]["talent_profiles"]["Row"];
type Client = Database["public"]["Tables"]["client_profiles"]["Row"];

// Type for the exact columns we select
type ProfileData = Pick<
  Profile,
  | "id"
  | "role"
  | "display_name"
  | "avatar_url"
  | "avatar_path"
  | "email_verified"
  | "created_at"
  | "updated_at"
>;

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

  const supabase = await createSupabaseServerClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch profile data with explicit column selection
  const [{ data: profile }, { data: talent }, { data: client }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, role, display_name, avatar_url, avatar_path, email_verified, created_at, updated_at"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("talent_profiles")
      .select(
        "id, user_id, first_name, last_name, phone, age, location, experience, portfolio_url, height, measurements, hair_color, eye_color, shoe_size, languages, created_at, updated_at"
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("client_profiles")
      .select(
        "id, user_id, company_name, industry, website, contact_name, contact_email, contact_phone, company_size, created_at, updated_at"
      )
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // Generate signed URL for avatar if path exists
  let avatarSrc: string | null = null;
  if (profile?.avatar_path) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_path, 60 * 60 * 24 * 7); // 7 days
    avatarSrc = signed?.signedUrl ?? null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your account and profile information</p>
          </div>

          <ProfileEditor
            user={user}
            profile={profile as ProfileData}
            talent={talent as Talent | null}
            client={client as Client | null}
            avatarSrc={avatarSrc}
          />
        </div>
      </div>
    </div>
  );
}
