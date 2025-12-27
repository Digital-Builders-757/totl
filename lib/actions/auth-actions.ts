"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PATHS } from "@/lib/constants/routes";
import { decidePostAuthRedirect } from "@/lib/routing/decide-redirect";
import { syncEmailVerifiedForUser } from "@/lib/server/sync-email-verified";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

/**
 * Ensures a profile exists for the current user and updates it with name from auth metadata if missing
 * This is called after login to ensure the profile is properly set up
 * Returns profile data including role and account_type to avoid duplicate queries
 */
export async function ensureProfileExists() {
  const supabase = await createSupabaseServer();
  const shouldDebugEnsureProfile = process.env.DEBUG_ENSURE_PROFILE_EXISTS === "1";

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Immediately after signUp, the server may not have a session yet (email verification flow).
  // Treat that as a no-op instead of an error to avoid noisy "Not authenticated" logs.
  if (authError || !user) {
    return { success: true, skipped: true };
  }

  // Check if profile exists - fetch role and account_type to avoid duplicate queries
  // Include email_verified for sync optimization
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, account_type, display_name, email_verified")
    .eq("id", user.id)
    .maybeSingle();

  // Handle actual errors (not PGRST116 - that doesn't occur with maybeSingle())
  if (profileError) {
    console.error("Error checking profile:", profileError);
    Sentry.captureException(new Error(`Profile query error: ${profileError.message}`), {
      tags: {
        feature: "auth",
        error_type: "profile_query_error",
        error_code: profileError.code || "unknown",
      },
      extra: {
        userId: user.id,
        userEmail: user.email,
        errorCode: profileError.code,
        errorDetails: profileError.details,
        errorMessage: profileError.message,
        errorHint: profileError.hint,
        timestamp: new Date().toISOString(),
      },
      level: "error",
    });
    return { error: "Failed to check existing profile" };
  }

  // If profile doesn't exist, create it
  // With maybeSingle(), no rows returns null data (not an error), so check !profile
  if (!profile) {
    // Extract name from user metadata
    const firstName = (user.user_metadata?.first_name as string) || "";
    const lastName = (user.user_metadata?.last_name as string) || "";
    // Auth bootstrap contract (PR #3): never trust metadata.role for privilege.
    // New accounts are always Talent; Career Builder access is granted only via admin approval.
    const role = "talent" as const;

    // Create display name
    let displayName = "";
    if (firstName && lastName) {
      displayName = `${firstName} ${lastName}`;
    } else if (firstName) {
      displayName = firstName;
    } else if (lastName) {
      displayName = lastName;
    } else {
      // Fallback to email username
      displayName = user.email?.split("@")[0] || "User";
    }

    // Create profile with account_type set to talent (MVP: all signups are talent)
    // Even if role in metadata is "client" (e.g., admin-created), account_type starts as "talent"
    // Users can apply to become Career Builder (client) through the application process
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      role: "talent",
      account_type: "talent",
      display_name: displayName,
      email_verified: user.email_confirmed_at !== null,
    });

    if (insertError) {
      console.error("Error creating profile:", insertError);
      return { error: "Failed to create profile" };
    }

    if (shouldDebugEnsureProfile) {
      console.info("[ensureProfileExists] created profiles row", {
        userId: user.id,
        role: "talent",
        account_type: "talent",
        email_verified: user.email_confirmed_at !== null,
      });
    }

    // Create role-specific profile if talent
    if (role === "talent") {
      const { error: talentError } = await supabase.from("talent_profiles").insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
      });

      if (talentError) {
        console.error("Error creating talent profile:", talentError);
        // Don't fail - profile was created
      }
    }

    // Fetch the created profile to return complete data (consistent with update paths)
    const { data: createdProfile } = await supabase
      .from("profiles")
      .select("role, account_type, email_verified, display_name, avatar_url, avatar_path, subscription_status, subscription_plan, subscription_current_period_end")
      .eq("id", user.id)
      .maybeSingle<{
        role: string | null;
        account_type: string | null;
        email_verified: boolean | null;
        display_name: string | null;
        avatar_url: string | null;
        avatar_path: string | null;
        subscription_status: string | null;
        subscription_plan: string | null;
        subscription_current_period_end: string | null;
      }>();

    // Sync email verification status (idempotent - profile was just created with correct value, but sync ensures consistency)
    const syncResult = await syncEmailVerifiedForUser({
      supabase,
      user,
      currentEmailVerified: createdProfile?.email_verified ?? null,
    });
    if (!syncResult.success) {
      console.error("[ensureProfileExists] email_verified sync failed (create path):", syncResult.error);
    }

    // Note: revalidatePath removed - cannot be called during render.
    // Callers should handle revalidation after mutations.
    // Return the created profile data to avoid duplicate queries
    return { 
      success: true, 
      created: true,
      profile: { 
        role: (createdProfile?.role ?? "talent") as "talent" | "client" | "admin" | null, 
        account_type: (createdProfile?.account_type ?? "talent") as "talent" | "client" | "unassigned",
        display_name: createdProfile?.display_name ?? displayName,
        avatar_url: createdProfile?.avatar_url ?? null,
        avatar_path: createdProfile?.avatar_path ?? null,
        subscription_status: (createdProfile?.subscription_status ?? "none") as "none" | "active" | "canceled" | "past_due",
        subscription_plan: createdProfile?.subscription_plan ?? null,
        subscription_current_period_end: createdProfile?.subscription_current_period_end ?? null,
      }
    };
  }

  // If profile exists but display_name is missing/empty, update it
  if (profile && (!profile.display_name || profile.display_name.trim() === "")) {
    const firstName = (user.user_metadata?.first_name as string) || "";
    const lastName = (user.user_metadata?.last_name as string) || "";

    let displayName = "";
    if (firstName && lastName) {
      displayName = `${firstName} ${lastName}`;
    } else if (firstName) {
      displayName = firstName;
    } else if (lastName) {
      displayName = lastName;
    } else {
      displayName = user.email?.split("@")[0] || "User";
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile display_name:", updateError);
      return { error: "Failed to update profile" };
    }

    if (shouldDebugEnsureProfile) {
      console.info("[ensureProfileExists] updated profiles.display_name", {
        userId: user.id,
      });
    }

    // Fetch the updated profile to return complete data (consistent with creation path)
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("role, account_type, email_verified, display_name, avatar_url, avatar_path, subscription_status, subscription_plan, subscription_current_period_end")
      .eq("id", user.id)
      .maybeSingle<{
        role: string | null;
        account_type: string | null;
        email_verified: boolean | null;
        display_name: string | null;
        avatar_url: string | null;
        avatar_path: string | null;
        subscription_status: string | null;
        subscription_plan: string | null;
        subscription_current_period_end: string | null;
      }>();

    // Sync email verification status before returning (PR #1: ensure no return path escapes sync)
    const syncResult = await syncEmailVerifiedForUser({
      supabase,
      user,
      currentEmailVerified: updatedProfile?.email_verified ?? null,
    });
    if (!syncResult.success) {
      console.error("[ensureProfileExists] email_verified sync failed (display_name update path):", syncResult.error);
    }

    // Note: revalidatePath removed - cannot be called during render.
    // Callers should handle revalidation after mutations.
    
    // Return updated profile data to avoid duplicate queries in auth-provider
    // Use fetched data (which has all fields) - don't fall back to profile since it's missing fields
    return { 
      success: true, 
      updated: true,
      profile: { 
        role: (updatedProfile?.role ?? profile?.role ?? null) as "talent" | "client" | "admin" | null, 
        account_type: (updatedProfile?.account_type ?? profile?.account_type ?? "unassigned") as "talent" | "client" | "unassigned",
        display_name: updatedProfile?.display_name ?? displayName,
        avatar_url: updatedProfile?.avatar_url ?? null,
        avatar_path: updatedProfile?.avatar_path ?? null,
        subscription_status: (updatedProfile?.subscription_status ?? "none") as "none" | "active" | "canceled" | "past_due",
        subscription_plan: updatedProfile?.subscription_plan ?? null,
        subscription_current_period_end: updatedProfile?.subscription_current_period_end ?? null,
      }
    };
  }

  // If profile exists but role is missing/null, try to determine it
  if (profile && !profile.role) {
    // Auth bootstrap contract (PR #3): never trust metadata.role for privilege escalation.
    // Only treat a user as Client (Career Builder) if the system has already created client state.
    // In practice, that means client_profiles exists (created by the admin approval action).
    const { data: clientProfileCheck } = await supabase
      .from("client_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const isApprovedClient = !!clientProfileCheck;
    const role = (isApprovedClient ? "client" : "talent") as "talent" | "client";
    const accountType = (isApprovedClient ? "client" : "talent") as "talent" | "client";
    
    const { error: updateRoleError } = await supabase
      .from("profiles")
      .update({ 
        role,
        account_type: accountType,
      })
      .eq("id", user.id);

    if (updateRoleError) {
      console.error("Error updating profile role:", updateRoleError);
      return { error: "Failed to update profile role" };
    }

    if (shouldDebugEnsureProfile) {
      console.info("[ensureProfileExists] updated profiles.role/account_type (role was missing)", {
        userId: user.id,
        role,
        account_type: accountType,
      });
    }

    // Ensure talent_profiles exists when we resolve to Talent (repair path for manual deletions).
    if (role === "talent") {
      const firstName = (user.user_metadata?.first_name as string) || "";
      const lastName = (user.user_metadata?.last_name as string) || "";
      const { data: existingTalentProfile } = await supabase
        .from("talent_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!existingTalentProfile) {
        const { error: talentError } = await supabase.from("talent_profiles").insert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
        });
        if (talentError) {
          console.error("Error creating talent profile during role repair:", talentError);
        }
      }
    }

    // Fetch the updated profile to return complete data (consistent with other update paths)
    const { data: updatedRoleProfile } = await supabase
      .from("profiles")
      .select("role, account_type, email_verified, display_name, avatar_url, avatar_path, subscription_status, subscription_plan, subscription_current_period_end")
      .eq("id", user.id)
      .maybeSingle<{
        role: string | null;
        account_type: string | null;
        email_verified: boolean | null;
        display_name: string | null;
        avatar_url: string | null;
        avatar_path: string | null;
        subscription_status: string | null;
        subscription_plan: string | null;
        subscription_current_period_end: string | null;
      }>();

    // Sync email verification status before returning (PR #1: ensure no return path escapes sync)
    const syncResult = await syncEmailVerifiedForUser({
      supabase,
      user,
      currentEmailVerified: updatedRoleProfile?.email_verified ?? null,
    });
    if (!syncResult.success) {
      console.error("[ensureProfileExists] email_verified sync failed (role fix path):", syncResult.error);
    }

    // Note: revalidatePath removed - cannot be called during render.
    // Callers should handle revalidation after mutations.
    // Return updated profile data
    return { 
      success: true, 
      roleUpdated: true,
      profile: {
        role: (updatedRoleProfile?.role ?? role) as "talent" | "client" | "admin" | null,
        account_type: (updatedRoleProfile?.account_type ?? accountType) as "talent" | "client" | "unassigned",
        display_name: updatedRoleProfile?.display_name ?? null,
        avatar_url: updatedRoleProfile?.avatar_url ?? null,
        avatar_path: updatedRoleProfile?.avatar_path ?? null,
        subscription_status: (updatedRoleProfile?.subscription_status ?? "none") as "none" | "active" | "canceled" | "past_due",
        subscription_plan: updatedRoleProfile?.subscription_plan ?? null,
        subscription_current_period_end: updatedRoleProfile?.subscription_current_period_end ?? null,
      }
    };
  }

  // Return existing profile data to avoid duplicate queries
  // Fetch complete profile data to match what auth-provider expects
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("role, account_type, email_verified, display_name, avatar_url, avatar_path, subscription_status, subscription_plan, subscription_current_period_end")
    .eq("id", user.id)
    .maybeSingle<{
      role: string | null;
      account_type: string | null;
      email_verified: boolean | null;
      display_name: string | null;
      avatar_url: string | null;
      avatar_path: string | null;
      subscription_status: string | null;
      subscription_plan: string | null;
      subscription_current_period_end: string | null;
    }>();

  // Sync email verification status before returning (PR #1: ensure no return path escapes sync)
  // This is the final fallback - profile exists and is complete, but we still sync to ensure consistency
  const syncResult = await syncEmailVerifiedForUser({
    supabase,
    user,
    currentEmailVerified: existingProfile?.email_verified ?? profile?.email_verified ?? null,
  });
  if (!syncResult.success) {
    console.error("[ensureProfileExists] email_verified sync failed (final path):", syncResult.error);
  }

  return { 
    success: true, 
    exists: true,
    profile: existingProfile ? {
      role: (existingProfile.role ?? null) as "talent" | "client" | "admin" | null,
      account_type: (existingProfile.account_type ?? "unassigned") as "talent" | "client" | "unassigned",
      display_name: existingProfile.display_name ?? null,
      avatar_url: existingProfile.avatar_url ?? null,
      avatar_path: existingProfile.avatar_path ?? null,
      subscription_status: (existingProfile.subscription_status ?? "none") as "none" | "active" | "canceled" | "past_due",
      subscription_plan: existingProfile.subscription_plan ?? null,
      subscription_current_period_end: existingProfile.subscription_current_period_end ?? null,
    } : null
  };
}

/**
 * Ensures profiles are created after signup (backup to database trigger)
 * This is called immediately after signup to ensure profiles exist even if trigger fails
 */
export async function ensureProfilesAfterSignup() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  // Extract name from user metadata (safe for display only; never trust metadata.role for privilege)
  const firstName = (user.user_metadata?.first_name as string) || "";
  const lastName = (user.user_metadata?.last_name as string) || "";
  const desiredRole = "talent" as const;

  // Create display name
  let displayName = "";
  if (firstName && lastName) {
    displayName = `${firstName} ${lastName}`;
  } else if (firstName) {
    displayName = firstName;
  } else if (lastName) {
    displayName = lastName;
  } else {
    displayName = user.email?.split("@")[0] || "User";
  }

  // Check if profile exists - use maybeSingle() to prevent 406 errors
  const { data: existingProfile, error: profileCheckError } = await supabase
    .from("profiles")
    .select("id, role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  // Handle actual errors (not PGRST116 - that doesn't occur with maybeSingle())
  if (profileCheckError) {
    console.error("Error checking profile:", profileCheckError);
    Sentry.captureException(new Error(`Profile check error: ${profileCheckError.message}`), {
      tags: {
        feature: "auth",
        error_type: "profile_check_error",
        error_code: profileCheckError.code || "unknown",
      },
      extra: {
        userId: user.id,
        userEmail: user.email,
        errorCode: profileCheckError.code,
        errorDetails: profileCheckError.details,
        errorMessage: profileCheckError.message,
        timestamp: new Date().toISOString(),
      },
      level: "error",
    });
    return { error: "Failed to check existing profile" };
  }

  // If profile doesn't exist, create it
  // With maybeSingle(), no rows returns null data (not an error), so check !existingProfile
  if (!existingProfile) {
    // Create profile with account_type set to talent (MVP: all signups are talent)
    // Auth bootstrap contract (PR #3): new signups are always Talent in app identity.
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      role: desiredRole,
      account_type: "talent",
      display_name: displayName,
      email_verified: user.email_confirmed_at !== null,
    });

    if (insertError) {
      console.error("Error creating profile after signup:", insertError);
      return { error: "Failed to create profile" };
    }

    // Create role-specific profile if talent
    if (desiredRole === "talent") {
      // Check if talent profile already exists - use maybeSingle() to prevent 406 errors
      const { data: existingTalentProfile } = await supabase
        .from("talent_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingTalentProfile) {
        const { error: talentError } = await supabase.from("talent_profiles").insert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
        });

        if (talentError) {
          console.error("Error creating talent profile after signup:", talentError);
          // Don't fail - profile was created
        }
        }
      }

    // Note: revalidatePath removed - cannot be called during render.
    // Callers should handle revalidation after mutations.
    return { success: true, created: true };
  }

  // If profile exists but display_name is missing/empty, update it
  if (existingProfile && (!existingProfile.display_name || existingProfile.display_name.trim() === "")) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile display_name after signup:", updateError);
      return { error: "Failed to update profile" };
    }

    // Note: revalidatePath removed - cannot be called during render.
    // Callers should handle revalidation after mutations.
    return { success: true, updated: true };
  }

  // Ensure talent profile exists if the existing profile is Talent (repair path; do not create client by metadata)
  if ((existingProfile?.role ?? desiredRole) === "talent" && existingProfile) {
    const { data: existingTalentProfile } = await supabase
      .from("talent_profiles")
      .select("user_id, first_name, last_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingTalentProfile) {
      const { error: talentError } = await supabase.from("talent_profiles").insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
      });

      if (talentError) {
        console.error("Error creating talent profile after signup:", talentError);
        // Don't fail - profile exists
      } else {
        // Note: revalidatePath removed - cannot be called during render.
        // Callers should handle revalidation after mutations.
        return { success: true, talentProfileCreated: true };
      }
    } else if (
      existingTalentProfile &&
      (!existingTalentProfile.first_name || !existingTalentProfile.last_name)
    ) {
      // Update talent profile if name is missing
      const { error: updateTalentError } = await supabase
        .from("talent_profiles")
        .update({
          first_name: firstName || existingTalentProfile.first_name,
          last_name: lastName || existingTalentProfile.last_name,
        })
        .eq("user_id", user.id);

      if (updateTalentError) {
        console.error("Error updating talent profile after signup:", updateTalentError);
      } else {
        // Note: revalidatePath removed - cannot be called during render.
        // Callers should handle revalidation after mutations.
        return { success: true, talentProfileUpdated: true };
      }
    }
  }

  return { success: true, exists: true };
}

/**
 * Server-side login handler that ensures profile exists and redirects appropriately
 * This function clears cache and ensures fresh session data
 */
export async function handleLoginRedirect(returnUrl?: string) {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(PATHS.LOGIN);
  }

  // Get profile with role and account_type in a single query
  // Use maybeSingle() to handle case where profile doesn't exist yet (prevents 406 error)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, account_type")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null; account_type: string | null }>();

  // If profile doesn't exist, ensure it's created
  if (!profile && !profileError) {
    const profileResult = await ensureProfileExists();
    if (profileResult.error) {
      // If profile creation fails, still try to redirect (fallback)
      redirect(PATHS.TALENT_DASHBOARD);
      return;
    }
    
    // Use profile data from ensureProfileExists to avoid duplicate query
    if (profileResult.profile) {
      const accountType = (profileResult.profile.account_type ?? "unassigned") as "unassigned" | "talent" | "client";
      const role = (profileResult.profile.role ?? null) as "talent" | "client" | "admin" | null;
      
      // Revalidate once after profile creation
      revalidatePath("/", "layout");
      
      // Quick redirect based on role
      if (role === "admin") {
        redirect(PATHS.ADMIN_DASHBOARD);
        return;
      }
      if (role === "client" || accountType === "client") {
        redirect(PATHS.CLIENT_DASHBOARD);
        return;
      }
      // Default to talent dashboard
      redirect(PATHS.TALENT_DASHBOARD);
      return;
    }
    
    // Fallback if profileResult doesn't have profile data
    redirect(PATHS.TALENT_DASHBOARD);
    return;
  }

  // Handle actual errors (not PGRST116 - that doesn't occur with maybeSingle())
  if (profileError) {
    console.error("Error checking profile:", profileError);
    Sentry.captureException(new Error(`Login redirect profile query error: ${profileError.message}`), {
      tags: {
        feature: "auth",
        error_type: "login_redirect_profile_error",
        error_code: profileError.code || "unknown",
      },
      extra: {
        userId: user.id,
        userEmail: user.email,
        errorCode: profileError.code,
        errorDetails: profileError.details,
        errorMessage: profileError.message,
        timestamp: new Date().toISOString(),
      },
      level: "error",
    });
    // Fallback redirect instead of throwing
    redirect(PATHS.TALENT_DASHBOARD);
    return;
  }

  const accountType = (profile?.account_type ?? "unassigned") as "unassigned" | "talent" | "client";
  const role = (profile?.role ?? null) as "talent" | "client" | "admin" | null;
  const isAdmin = role === "admin";
  
  // Use role as fallback when account_type is unassigned
  // This handles cases where profile has role but account_type isn't set yet
  const effectiveAccountType = accountType !== "unassigned" 
    ? accountType 
    : role === "talent" 
      ? "talent" 
      : role === "client" 
        ? "client" 
        : accountType;
  
  // CRITICAL FIX: Ensure talent_profiles exists for talent users before redirecting
  // This prevents dashboard loading issues for new accounts
  if (role === "talent" || effectiveAccountType === "talent") {
    const { data: talentProfile, error: talentProfileError } = await supabase
      .from("talent_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (!talentProfile && !talentProfileError) {
      // Talent profile doesn't exist - create it synchronously before redirect
      const firstName = (user.user_metadata?.first_name as string) || "";
      const lastName = (user.user_metadata?.last_name as string) || "";
      
      const { error: createTalentError } = await supabase.from("talent_profiles").insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
      });
      
      if (createTalentError) {
        console.error("Error creating talent profile during login redirect:", createTalentError);
        // Continue anyway - profile exists, talent_profile can be created later
      }
    }
  }
  
  // Sync account_type with role if role exists but account_type is unassigned
  // Do this SYNCHRONOUSLY to ensure data consistency before redirect
  if (role && role !== "admin" && accountType === "unassigned" && effectiveAccountType !== "unassigned") {
    try {
      await supabase
        .from("profiles")
        .update({ account_type: effectiveAccountType as "talent" | "client" })
        .eq("id", user.id);
      // Revalidate after sync completes
      revalidatePath("/", "layout");
    } catch (syncError) {
      console.error("Error syncing account_type with role:", syncError);
      // Continue anyway - effectiveAccountType will be used for routing
    }
  }
  
  // MVP: Default unassigned users to Talent Dashboard (all signups are talent)
  // Only redirect to onboarding if genuinely new user with no role set
  // CRITICAL FIX: Set default role SYNCHRONOUSLY before redirecting
  if (!isAdmin && accountType === "unassigned" && !role) {
    try {
      // Set default to talent and create talent_profile synchronously
      await supabase
        .from("profiles")
        .update({ account_type: "talent", role: "talent" })
        .eq("id", user.id);
      
      // Ensure talent_profiles exists
      const firstName = (user.user_metadata?.first_name as string) || "";
      const lastName = (user.user_metadata?.last_name as string) || "";
      
      const { data: existingTalentProfile } = await supabase
        .from("talent_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (!existingTalentProfile) {
        await supabase.from("talent_profiles").insert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
        });
      }
      
      revalidatePath("/", "layout");
    } catch (defaultError) {
      console.error("Error setting default role:", defaultError);
      // Continue anyway - redirect to dashboard where profile can be created
    }
    
    // Redirect after ensuring profile exists
    redirect(PATHS.TALENT_DASHBOARD);
    return;
  }

  // Revalidate paths once before redirect (batch operation)
  revalidatePath("/", "layout");

  const profileAccess = { role, account_type: effectiveAccountType };

  // Single routing brain: decide redirect outcome (preserves existing fallback behavior)
  const decision = decidePostAuthRedirect({
    pathname: PATHS.LOGIN,
    returnUrlRaw: returnUrl ?? null,
    signedOut: false,
    profile: profileAccess,
    fallback: PATHS.TALENT_DASHBOARD,
  });

  if (decision.type === "redirect") {
    redirect(decision.to);
    return;
  }

  // Fallback: deterministically repair role/account_type (never trust metadata.role).
  // Client status is inferred only from existing client_profiles (created by admin approval action).
  try {
    const { data: clientProfile } = await supabase
      .from("client_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const repairedRole = (clientProfile ? "client" : "talent") as "talent" | "client";
    const repairedAccountType = repairedRole;

    await supabase
      .from("profiles")
      .update({ role: repairedRole, account_type: repairedAccountType })
      .eq("id", user.id);
    
    // Ensure talent_profiles exists if role is talent
    if (repairedRole === "talent") {
      const { data: existingTalentProfile } = await supabase
        .from("talent_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (!existingTalentProfile) {
        const firstName = (user.user_metadata?.first_name as string) || "";
        const lastName = (user.user_metadata?.last_name as string) || "";
        await supabase.from("talent_profiles").insert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
        });
      }
    }
    
    revalidatePath("/", "layout");
  } catch (repairError) {
    console.error("Error repairing profile role/account_type:", repairError);
    // Continue anyway - redirect to dashboard
  }

  // MVP: Default fallback to Talent Dashboard (all signups are talent)
  // Redirect after ensuring profile exists
  redirect(PATHS.TALENT_DASHBOARD);
}


