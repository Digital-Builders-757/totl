import { redirect } from "next/navigation";
import { ProfileEditor } from "./profile-editor";
import { SignOutButton } from "./sign-out-button";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { PrefetchLink } from "@/components/ui/prefetch-link";
import { PATHS } from "@/lib/constants/routes";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { publicBucketUrl } from "@/lib/utils/storage-urls";
import {
  type ProfileRow,
  type TalentProfileRow,
  type ClientProfileRow,
} from "@/types/database-helpers";
import type { Database } from "@/types/supabase";

// Force dynamic rendering to prevent build-time issues
export const dynamic = "force-dynamic";

type SupabaseLikeError = { message?: string } | null;

type TalentWithCompCard = Database["public"]["Tables"]["talent_profiles"]["Row"] & {
  bust?: string | null;
  hips?: string | null;
  waist?: string | null;
  suit?: string | null;
  resume_link?: string | null;
};

function isMissingCompCardColumnError(error: SupabaseLikeError): boolean {
  const message = String(error?.message ?? "");
  return /column/i.test(message) && /(bust|hips|waist|suit|resume_link)/i.test(message);
}

export default async function SettingsPage() {
  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <PageShell className="grain-texture" containerClassName="flex min-h-[70vh] items-center justify-center py-8">
        <div className="panel-frosted max-w-md rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-destructive/35 bg-destructive/10 text-destructive">
            ⚠️
          </div>
          <h2 className="text-xl font-semibold text-[var(--oklch-text-primary)]">Configuration Error</h2>
          <p className="mt-2 text-sm text-[var(--oklch-text-secondary)]">
            Supabase is not configured. Please check your environment variables.
          </p>
        </div>
      </PageShell>
    );
  }

  const supabase = await createSupabaseServer();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(PATHS.LOGIN);
  }

  const fetchTalentProfile = async (): Promise<{ data: TalentWithCompCard | null }> => {
    const baseSelect =
      "id, user_id, first_name, last_name, phone, age, location, experience, portfolio_url, height, measurements, hair_color, eye_color, shoe_size, languages, experience_years, specialties, weight, created_at, updated_at";
    const compCardSelect = `${baseSelect}, bust, hips, waist, suit, resume_link`;

    const primary = await supabase
      .from("talent_profiles")
      .select(compCardSelect)
      .eq("user_id", user.id)
      .maybeSingle();

    if (primary.error && isMissingCompCardColumnError(primary.error)) {
      const fallback = await supabase
        .from("talent_profiles")
        .select(baseSelect)
        .eq("user_id", user.id)
        .maybeSingle();
      return { data: fallback.data as unknown as TalentWithCompCard | null };
    }

    return { data: primary.data as unknown as TalentWithCompCard | null };
  };

  // Fetch profile data with explicit column selection
  const [{ data: profile }, { data: talentResult }, { data: client }, { data: portfolioItems }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, role, display_name, avatar_url, avatar_path, email_verified, subscription_status, subscription_plan, subscription_current_period_end, created_at, updated_at"
      )
      .eq("id", user.id)
      .single(),
    fetchTalentProfile(),
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
      .order("created_at", { ascending: false }),
  ]);
  const talent = talentResult ?? null;

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

  // Portfolio image_url stores the storage path; convert to full public URL
  const portfolioItemsWithUrls = (portfolioItems || []).map((item: Database["public"]["Tables"]["portfolio_items"]["Row"]) => ({
    ...item,
    imageUrl: publicBucketUrl("portfolio", item.image_url) ?? item.image_url ?? undefined,
  }));

  return (
    <PageShell className="grain-texture" containerClassName="py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Settings"
          subtitle="Manage your account and profile information"
          breadcrumbs={
            <nav className="flex items-center gap-2 text-sm text-[var(--oklch-text-tertiary)]">
              {profile?.role === "talent" && (
                <>
                  <PrefetchLink
                    href={PATHS.TALENT_DASHBOARD}
                    className="transition-colors hover:text-[var(--oklch-text-primary)]"
                  >
                    Dashboard
                  </PrefetchLink>
                  <span>→</span>
                  <span className="text-[var(--oklch-text-primary)]">Settings</span>
                </>
              )}
              {profile?.role === "client" && (
                <>
                  <PrefetchLink
                    href={PATHS.CLIENT_DASHBOARD}
                    className="transition-colors hover:text-[var(--oklch-text-primary)]"
                  >
                    Dashboard
                  </PrefetchLink>
                  <span>→</span>
                  <span className="text-[var(--oklch-text-primary)]">Settings</span>
                </>
              )}
              {profile?.role === "admin" && (
                <>
                  <PrefetchLink
                    href={PATHS.ADMIN_DASHBOARD}
                    className="transition-colors hover:text-[var(--oklch-text-primary)]"
                  >
                    Admin Dashboard
                  </PrefetchLink>
                  <span>→</span>
                  <span className="text-[var(--oklch-text-primary)]">Settings</span>
                </>
              )}
            </nav>
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {profile?.role === "talent" ? (
                <Button asChild variant="outline" className="panel-frosted min-w-[11rem] justify-center">
                  <PrefetchLink href={PATHS.TALENT_DASHBOARD}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Back to Dashboard
                  </PrefetchLink>
                </Button>
              ) : profile?.role === "client" ? (
                <Button asChild variant="outline" className="panel-frosted min-w-[11rem] justify-center">
                  <PrefetchLink href={PATHS.CLIENT_DASHBOARD}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Back to Dashboard
                  </PrefetchLink>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="panel-frosted min-w-[11rem] justify-center">
                    <PrefetchLink href={PATHS.ADMIN_DASHBOARD}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                      Back to Admin
                    </PrefetchLink>
                  </Button>
                  <SignOutButton />
                </>
              )}
            </div>
          }
        />

        <ProfileEditor
          user={user}
          profile={profile as ProfileRow}
          talent={talent as TalentProfileRow | null}
          client={client as ClientProfileRow | null}
          avatarSrc={avatarSrc}
          portfolioItems={portfolioItemsWithUrls}
        />
      </div>
    </PageShell>
  );
}
