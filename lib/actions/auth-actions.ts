"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";

/**
 * Ensures a profile exists for the current user and updates it with name from auth metadata if missing
 * This is called after login to ensure the profile is properly set up
 * Returns profile data including role and account_type to avoid duplicate queries
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

  // Check if profile exists - fetch role and account_type to avoid duplicate queries
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, account_type, display_name")
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

    // Create profile with account_type set to talent (MVP: all signups are talent)
    // Even if role in metadata is "client" (e.g., admin-created), account_type starts as "talent"
    // Users can apply to become Career Builder (client) through the application process
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      role: role as "talent" | "client" | "admin",
      account_type: "talent", // MVP: All new accounts start as talent, regardless of role in metadata
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

    // Fetch the created profile to return complete data (consistent with update paths)
    const { data: createdProfile } = await supabase
      .from("profiles")
      .select("role, account_type, display_name, avatar_url, avatar_path, subscription_status, subscription_plan, subscription_current_period_end")
      .eq("id", user.id)
      .maybeSingle<{
        role: string | null;
        account_type: string | null;
        display_name: string | null;
        avatar_url: string | null;
        avatar_path: string | null;
        subscription_status: string | null;
        subscription_plan: string | null;
        subscription_current_period_end: string | null;
      }>();

    revalidatePath("/", "layout");
    // Return the created profile data to avoid duplicate queries
    return { 
      success: true, 
      created: true,
      profile: { 
        role: (createdProfile?.role ?? role) as "talent" | "client" | "admin" | null, 
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

    // Fetch the updated profile to return complete data (consistent with creation path)
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("role, account_type, display_name, avatar_url, avatar_path, subscription_status, subscription_plan, subscription_current_period_end")
      .eq("id", user.id)
      .maybeSingle<{
        role: string | null;
        account_type: string | null;
        display_name: string | null;
        avatar_url: string | null;
        avatar_path: string | null;
        subscription_status: string | null;
        subscription_plan: string | null;
        subscription_current_period_end: string | null;
      }>();

    revalidatePath("/", "layout");
    
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
    // MVP: account_type should be "talent" unless user already has client_profile (approved Career Builder)
    // Check if client_profile exists to determine if account_type should be "client"
    const { data: clientProfileCheck } = await supabase
      .from("client_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    const accountType = clientProfileCheck ? "client" : "talent"; // MVP: Default to talent unless already approved
    
    const { error: updateRoleError } = await supabase
      .from("profiles")
      .update({ 
        role: role as "talent" | "client" | "admin",
        account_type: accountType as "talent" | "client" // Sync account_type with approval status
      })
      .eq("id", user.id);

    if (updateRoleError) {
      console.error("Error updating profile role:", updateRoleError);
      return { error: "Failed to update profile role" };
    }

    // Fetch the updated profile to return complete data (consistent with other update paths)
    const { data: updatedRoleProfile } = await supabase
      .from("profiles")
      .select("role, account_type, display_name, avatar_url, avatar_path, subscription_status, subscription_plan, subscription_current_period_end")
      .eq("id", user.id)
      .maybeSingle<{
        role: string | null;
        account_type: string | null;
        display_name: string | null;
        avatar_url: string | null;
        avatar_path: string | null;
        subscription_status: string | null;
        subscription_plan: string | null;
        subscription_current_period_end: string | null;
      }>();

    revalidatePath("/", "layout");
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
    .select("role, account_type, display_name, avatar_url, avatar_path, subscription_status, subscription_plan, subscription_current_period_end")
    .eq("id", user.id)
    .maybeSingle<{
      role: string | null;
      account_type: string | null;
      display_name: string | null;
      avatar_url: string | null;
      avatar_path: string | null;
      subscription_status: string | null;
      subscription_plan: string | null;
      subscription_current_period_end: string | null;
    }>();

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
    // Create profile with account_type set to talent (MVP: all signups are talent)
    // Even if role in metadata is "client" (e.g., admin-created), account_type starts as "talent"
    // Users can apply to become Career Builder (client) through the application process
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      role: role as "talent" | "client" | "admin",
      account_type: "talent", // MVP: All new accounts start as talent, regardless of role in metadata
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

// Match middleware.ts logic for consistency - exclude public client routes
const needsClientAccess = (path: string) =>
  path.startsWith("/client/") &&
  path !== "/client/apply" &&
  path !== "/client/apply/success" &&
  path !== "/client/application-status" &&
  path !== "/client/signup";
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
      redirect("/talent/dashboard");
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
        redirect("/admin/dashboard");
        return;
      }
      if (role === "client" || accountType === "client") {
        redirect("/client/dashboard");
        return;
      }
      // Default to talent dashboard
      redirect("/talent/dashboard");
      return;
    }
    
    // Fallback if profileResult doesn't have profile data
    redirect("/talent/dashboard");
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
    redirect("/talent/dashboard");
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
  
  const safeUrl = isSafeReturnUrl(returnUrl);

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
    redirect("/talent/dashboard");
    return;
  }

  // Revalidate paths once before redirect (batch operation)
  revalidatePath("/", "layout");

  // Check return URL first
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

  // Fast path redirects based on role/account_type
  if (isAdmin) {
    redirect("/admin/dashboard");
    return;
  }

  if (effectiveAccountType === "client" || role === "client") {
    redirect("/client/dashboard");
    return;
  }

  if (effectiveAccountType === "talent" || role === "talent") {
    redirect("/talent/dashboard");
    return;
  }

  // Fallback: try to get role from metadata and update SYNCHRONOUSLY before redirect
  const roleFromMetadata = (user.user_metadata?.role as string) || "talent";
  try {
    await supabase
      .from("profiles")
      .update({ role: roleFromMetadata as "talent" | "client" | "admin", account_type: roleFromMetadata === "client" ? "client" : "talent" })
      .eq("id", user.id);
    
    // Ensure talent_profiles exists if role is talent
    if (roleFromMetadata === "talent") {
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
  } catch (metadataUpdateError) {
    console.error("Error updating profile from metadata:", metadataUpdateError);
    // Continue anyway - redirect to dashboard
  }

  // MVP: Default fallback to Talent Dashboard (all signups are talent)
  // Redirect after ensuring profile exists
  redirect("/talent/dashboard");
}


