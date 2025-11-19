import { redirect, notFound } from "next/navigation";
import { AdminApplicationDetailClient } from "./admin-application-detail-client";
import { AdminHeader } from "@/components/admin/admin-header";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { type ProfileRow } from "@/types/database-helpers";

export const dynamic = "force-dynamic";

interface AdminApplicationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminApplicationDetailPage({
  params,
}: AdminApplicationDetailPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?returnUrl=/admin/applications/${id}`);
  }

  // Get user role from profiles table
  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id as string)
    .single();

  if (userError || (userData as ProfileRow)?.role !== "admin") {
    redirect(`/login?returnUrl=/admin/applications/${id}`);
  }

  // Fetch application with joined gig data (no client_profiles join - it doesn't have direct FK)
  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select(
      `
      id,
      gig_id,
      talent_id,
      status,
      message,
      created_at,
      updated_at,
      gigs (
        id,
        client_id,
        title,
        description,
        category,
        location,
        compensation,
        duration,
        date,
        application_deadline,
        status,
        image_url,
        created_at
      )
    `
    )
    .eq("id", id)
    .single();

  // Fetch talent profile data separately
  let talentData = null;
  let talentProfileData = null;
  let clientProfileData = null;

  if (application && !applicationError) {
    // Get talent profile (profiles table) - use maybeSingle() to handle missing profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", application.talent_id)
      .maybeSingle();

    // Get talent_profiles data - use maybeSingle() to handle missing talent profiles
    if (profile) {
      const { data: talentProfile } = await supabase
        .from("talent_profiles")
        .select(
          `
          id,
          first_name,
          last_name,
          phone,
          age,
          location,
          experience,
          experience_years,
          specialties,
          portfolio_url,
          height,
          measurements,
          hair_color,
          eye_color
        `
        )
        .eq("user_id", profile.id)
        .maybeSingle();

      talentData = profile;
      talentProfileData = talentProfile || null;
    }

    // Get client_profile data - gigs.client_id → profiles.id → client_profiles.user_id
    if (application.gigs && application.gigs.client_id) {
      const { data: clientProfile } = await supabase
        .from("client_profiles")
        .select("company_name, contact_name, contact_email")
        .eq("user_id", application.gigs.client_id)
        .maybeSingle();

      clientProfileData = clientProfile || null;
    }
  }

  // Combine the data
  const applicationWithDetails = application
    ? {
        ...application,
        gigs: application.gigs
          ? {
              ...application.gigs,
              client_profiles: clientProfileData,
            }
          : null,
        talent_profiles: talentData
          ? {
              ...talentData,
              talent_profiles: talentProfileData,
            }
          : null,
      }
    : null;

  if (applicationError || !applicationWithDetails) {
    console.error("Error fetching application:", applicationError);
    notFound();
  }

  return (
    <>
      <AdminHeader user={user} notificationCount={0} />
      <AdminApplicationDetailClient application={applicationWithDetails} user={user} />
    </>
  );
}

