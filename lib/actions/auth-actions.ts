"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";

/**
 * Ensures a profile exists for the current user and updates it with name from auth metadata if missing
 * This is called after login to ensure the profile is properly set up
 */
export async function ensureProfileExists() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  // Check if profile exists - use maybeSingle() to prevent 406 errors
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, display_name")
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
    const role = (user.user_metadata?.role as string) || "talent";

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

    // Create profile
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      role: role as "talent" | "client" | "admin",
      display_name: displayName,
      email_verified: user.email_confirmed_at !== null,
    });

    if (insertError) {
      console.error("Error creating profile:", insertError);
      return { error: "Failed to create profile" };
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

    revalidatePath("/", "layout");
    return { success: true, created: true };
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

    revalidatePath("/", "layout");
    return { success: true, updated: true };
  }

  // If profile exists but role is missing/null, try to determine it
  if (profile && !profile.role) {
    // First, try to get role from user metadata
    let role = (user.user_metadata?.role as string) || null;
    
    // If not in metadata, check if talent_profile exists (user is talent)
    if (!role) {
      const { data: talentProfile, error: talentError } = await supabase
        .from("talent_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (talentProfile && !talentError) {
        role = "talent";
      } else {
        // Check if client_profile exists
        const { data: clientProfile, error: clientError } = await supabase
          .from("client_profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (clientProfile && !clientError) {
          role = "client";
        } else {
          // Default to talent if we can't determine
          role = "talent";
        }
      }
    }
    
    // Update profile with determined role
    const { error: updateRoleError } = await supabase
      .from("profiles")
      .update({ role: role as "talent" | "client" | "admin" })
      .eq("id", user.id);

    if (updateRoleError) {
      console.error("Error updating profile role:", updateRoleError);
      return { error: "Failed to update profile role" };
    }

    revalidatePath("/", "layout");
    return { success: true, roleUpdated: true };
  }

  return { success: true, exists: true };
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

  // Extract name and role from user metadata
  const firstName = (user.user_metadata?.first_name as string) || "";
  const lastName = (user.user_metadata?.last_name as string) || "";
  const role = (user.user_metadata?.role as string) || "talent";

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
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      role: role as "talent" | "client" | "admin",
      display_name: displayName,
      email_verified: user.email_confirmed_at !== null,
    });

    if (insertError) {
      console.error("Error creating profile after signup:", insertError);
      return { error: "Failed to create profile" };
    }

    // Create role-specific profile if talent
    if (role === "talent") {
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

    revalidatePath("/", "layout");
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

    revalidatePath("/", "layout");
    return { success: true, updated: true };
  }

  // Ensure talent profile exists if role is talent
  if (role === "talent" && existingProfile) {
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
        revalidatePath("/", "layout");
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
        revalidatePath("/", "layout");
        return { success: true, talentProfileUpdated: true };
      }
    }
  }

  return { success: true, exists: true };
}

const isSafeReturnUrl = (returnUrl?: string) => {
  if (!returnUrl) return null;
  if (returnUrl.includes("://") || returnUrl.startsWith("//")) return null;
  if (!returnUrl.startsWith("/")) return null;
  return returnUrl;
};

const needsClientAccess = (path: string) =>
  path.startsWith("/client/") && path !== "/client/apply";
const needsTalentAccess = (path: string) =>
  path.startsWith("/talent/") && path !== "/talent";

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
    redirect("/login");
  }

  // Ensure profile exists and is up to date
  const profileResult = await ensureProfileExists();
  
  // If profile was just created or role was updated, we need to wait a moment
  // for the database to be consistent before querying again
  // Use longer delay for role updates to ensure they propagate
  if (profileResult.created) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  } else if (profileResult.roleUpdated) {
    // Longer delay for role updates to ensure database consistency
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // Revalidate paths to clear any cached data
  revalidatePath("/", "layout");
  revalidatePath("/talent/dashboard");
  revalidatePath("/client/dashboard");
  revalidatePath("/admin/dashboard");
  revalidatePath("/choose-role");

  // Get profile with role - use a fresh query
  // Query immediately after ensureProfileExists (delays already handled above)
  // Use maybeSingle() to handle case where profile doesn't exist yet (prevents 406 error)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, account_type")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null; account_type: string | null }>();

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
        profileResult,
        timestamp: new Date().toISOString(),
      },
      level: "error",
    });
    throw new Error("Failed to check profile");
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
  
  // Sync account_type with role if role exists but account_type is unassigned
  // This ensures consistency for future logins
  let syncSucceeded = false;
  if (role && role !== "admin" && accountType === "unassigned" && effectiveAccountType !== "unassigned") {
    const { error: syncError } = await supabase
      .from("profiles")
      .update({ account_type: effectiveAccountType as "talent" | "client" })
      .eq("id", user.id);
    
    if (syncError) {
      console.error("Error syncing account_type with role:", syncError);
      // Sync failed - account_type remains unassigned in DB
      // This could indicate a data inconsistency that needs manual resolution
      // or a legitimate case where user needs to complete onboarding
      syncSucceeded = false;
    } else {
      syncSucceeded = true;
      // Small delay to ensure database consistency
      await new Promise((resolve) => setTimeout(resolve, 100));
      revalidatePath("/", "layout");
    }
  }
  
  const safeUrl = isSafeReturnUrl(returnUrl);

  // Redirect to onboarding if:
  // 1. Both account_type AND role are unassigned/null (new user)
  // 2. OR account_type is unassigned and sync failed (data inconsistency - ensure onboarding completes)
  // This ensures users complete onboarding even if there's a data inconsistency
  // Note: We check accountType (original DB value) not effectiveAccountType because:
  // - If sync succeeded, accountType is now updated in DB but we still check original to ensure consistency
  // - If sync failed, accountType remains "unassigned" and user should complete onboarding
  // - effectiveAccountType is computed from role and used for redirects, but onboarding check uses original accountType
  if (!isAdmin && accountType === "unassigned" && (!role || !syncSucceeded)) {
    redirect("/onboarding/select-account-type");
    return;
  }

  if (safeUrl && (isAdmin || effectiveAccountType !== "unassigned")) {
    const returnPath = new URL(safeUrl, "http://localhost");
    const target = returnPath.pathname;
    const canAccessReturnUrl =
      (!needsClientAccess(target) || effectiveAccountType === "client") &&
      (!needsTalentAccess(target) || effectiveAccountType === "talent") &&
      (!target.startsWith("/admin/") || isAdmin);

    if (canAccessReturnUrl) {
      redirect(safeUrl);
      return;
    }
  }

  if (isAdmin) {
    redirect("/admin/dashboard");
    return;
  }

  if (effectiveAccountType === "client") {
    redirect("/client/dashboard");
    return;
  }

  if (effectiveAccountType === "talent") {
    redirect("/talent/dashboard");
    return;
  }

  const roleFromMetadata = (user.user_metadata?.role as string) || "talent";

  const { error: metadataUpdateError } = await supabase
    .from("profiles")
    .update({ role: roleFromMetadata as "talent" | "client" | "admin" })
    .eq("id", user.id);

  if (!metadataUpdateError) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    revalidatePath("/", "layout");
    revalidatePath("/choose-role");
    const { data: verifyProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string | null }>();

    if (verifyProfile?.role === "talent") {
      redirect("/talent/dashboard");
      return;
    }
    if (verifyProfile?.role === "client") {
      redirect("/client/dashboard");
      return;
    }
    if (verifyProfile?.role === "admin") {
      redirect("/admin/dashboard");
      return;
    }
  }

  Sentry.captureMessage("Unable to determine user role during login redirect", {
    tags: {
      feature: "auth",
      error_type: "role_undetermined",
    },
    extra: {
      userId: user.id,
      userEmail: user.email,
      userMetadata: user.user_metadata,
      profileData: profile,
      profileError,
      timestamp: new Date().toISOString(),
    },
    level: "warning",
  });

  redirect("/choose-role");
}


