import { redirect } from "next/navigation";
import { ProfileEditor } from "./profile-editor";
import { PrefetchLink } from "@/components/ui/prefetch-link";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import {
  type ProfileRow,
  type TalentProfileRow,
  type ClientProfileRow,
} from "@/types/database-helpers";
import type { Database } from "@/types/supabase";

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

  const supabase = await createSupabaseServer();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch profile data with explicit column selection
  const [{ data: profile }, { data: talent }, { data: client }, { data: portfolioItems }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, role, display_name, avatar_url, avatar_path, email_verified, subscription_status, subscription_plan, subscription_current_period_end, created_at, updated_at"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("talent_profiles")
      .select(
        "id, user_id, first_name, last_name, phone, age, location, experience, portfolio_url, height, measurements, hair_color, eye_color, shoe_size, languages, experience_years, specialties, weight, created_at, updated_at"
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
    supabase
      .from("portfolio_items")
      .select("id, talent_id, title, description, caption, image_url, created_at, updated_at")
      .eq("talent_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  // Generate signed URL with image transformations for avatar if path exists
  let avatarSrc: string | null = null;
  if (profile?.avatar_path) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_path, 60 * 60 * 24 * 7, {
        transform: {
          width: 200,
          height: 200,
          resize: "cover",
        },
      }); // 7 days with optimizations
    avatarSrc = signed?.signedUrl ?? null;
  }

  // Portfolio items already have image_url from the database
  const portfolioItemsWithUrls = (portfolioItems || []).map((item: Database["public"]["Tables"]["portfolio_items"]["Row"]) => ({
    ...item,
    imageUrl: item.image_url || undefined,
  }));

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
              {profile?.role === "talent" && (
                <>
                  <PrefetchLink href="/talent/dashboard" className="hover:text-white transition-colors">
                    Dashboard
                  </PrefetchLink>
                  <span>→</span>
                  <span className="text-white">Settings</span>
                </>
              )}
              {profile?.role === "client" && (
                <>
                  <PrefetchLink href="/client/dashboard" className="hover:text-white transition-colors">
                    Dashboard
                  </PrefetchLink>
                  <span>→</span>
                  <span className="text-white">Settings</span>
                </>
              )}
              {profile?.role === "admin" && (
                <>
                  <PrefetchLink href="/admin/dashboard" className="hover:text-white transition-colors">
                    Admin Dashboard
                  </PrefetchLink>
                  <span>→</span>
                  <span className="text-white">Settings</span>
                </>
              )}
            </nav>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                <p className="text-gray-300">Manage your account and profile information</p>
              </div>
              {profile?.role === "talent" && (
                <PrefetchLink
                  href="/talent/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </PrefetchLink>
              )}
              {profile?.role === "client" && (
                <PrefetchLink
                  href="/client/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </PrefetchLink>
              )}
              {profile?.role === "admin" && (
                <PrefetchLink
                  href="/admin/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Admin
                </PrefetchLink>
              )}
            </div>
          </div>

          <ProfileEditor
            user={user}
            profile={profile as ProfileRow}
            talent={talent as TalentProfileRow | null}
            client={client as ClientProfileRow | null}
            avatarSrc={avatarSrc}
            portfolioItems={portfolioItemsWithUrls}
          />
        </div>
      </div>
    </div>
  );
}
