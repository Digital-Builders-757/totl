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

  // Log 406 or other profile query errors to Sentry for debugging
  if (profileError && profileError.code !== "PGRST116") {
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
  }

  // If profile doesn't exist, create it
  if (profileError && profileError.code === "PGRST116") {
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

  // Check if profile exists
  const { data: existingProfile, error: profileCheckError } = await supabase
    .from("profiles")
    .select("id, role, display_name")
    .eq("id", user.id)
    .single();

  // If profile doesn't exist, create it
  if (profileCheckError && profileCheckError.code === "PGRST116") {
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
      // Check if talent profile already exists
      const { data: existingTalentProfile } = await supabase
        .from("talent_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

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
      .single();

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

/**
 * Server-side login handler that ensures profile exists and redirects appropriately
 * This function clears cache and ensures fresh session data
 */
export async function handleLoginRedirect() {
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
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // Log profile query errors to Sentry for debugging redirect loops
  if (profileError && profileError.code !== "PGRST116") {
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
        profileResult: profileResult,
        timestamp: new Date().toISOString(),
      },
      level: "error",
    });
  }

  // If we still don't have a role after ensureProfileExists, try one more time
  // to determine it from talent_profiles or client_profiles
  if (!profile?.role && !profileError) {
    // Check talent_profiles first
    const { data: talentProfile } = await supabase
      .from("talent_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (talentProfile) {
      // Update profile with talent role and wait for it to complete
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: "talent" })
        .eq("id", user.id);
      
      if (!updateError) {
        // Longer delay to ensure database consistency and prevent middleware redirect loop
        await new Promise((resolve) => setTimeout(resolve, 200));
        // Revalidate to clear cache
        revalidatePath("/", "layout");
        revalidatePath("/choose-role");
        // Verify the update was successful before redirecting
        const { data: verifyProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        
        if (verifyProfile?.role === "talent") {
          redirect("/talent/dashboard");
        }
        // If verification failed, fall through to next check
      }
    } else {
      // Check client_profiles
      const { data: clientProfile } = await supabase
        .from("client_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (clientProfile) {
        // Update profile with client role and wait for it to complete
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ role: "client" })
          .eq("id", user.id);
        
        if (!updateError) {
          // Longer delay to ensure database consistency and prevent middleware redirect loop
          await new Promise((resolve) => setTimeout(resolve, 200));
          // Revalidate to clear cache
          revalidatePath("/", "layout");
          revalidatePath("/choose-role");
          // Verify the update was successful before redirecting
          const { data: verifyProfile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          
          if (verifyProfile?.role === "client") {
            redirect("/client/dashboard");
          }
          // If verification failed, fall through to next check
        }
      }
    }
  }

  // Redirect based on role
  if (profile?.role === "talent") {
    redirect("/talent/dashboard");
  } else if (profile?.role === "client") {
    redirect("/client/dashboard");
  } else if (profile?.role === "admin") {
    redirect("/admin/dashboard");
  } else {
    // Last resort - if we still don't have a role, check user metadata
    const roleFromMetadata = (user.user_metadata?.role as string) || "talent";
    
    // Try to update profile one more time with metadata role
    const { error: metadataUpdateError } = await supabase
      .from("profiles")
      .update({ role: roleFromMetadata as "talent" | "client" | "admin" })
      .eq("id", user.id);
    
    if (!metadataUpdateError) {
      // Longer delay to ensure database consistency and prevent middleware redirect loop
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Revalidate to clear cache
      revalidatePath("/", "layout");
      revalidatePath("/choose-role");
      
      // Verify the update was successful before redirecting
      const { data: verifyProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      // Redirect based on verified role
      if (verifyProfile?.role === "talent") {
        redirect("/talent/dashboard");
      } else if (verifyProfile?.role === "client") {
        redirect("/client/dashboard");
      } else if (verifyProfile?.role === "admin") {
        redirect("/admin/dashboard");
      } else if (roleFromMetadata === "talent") {
        // Fallback to metadata if verification didn't work but update succeeded
        redirect("/talent/dashboard");
      } else if (roleFromMetadata === "client") {
        redirect("/client/dashboard");
      } else if (roleFromMetadata === "admin") {
        redirect("/admin/dashboard");
      }
    }
    
    // Only redirect to choose-role if we truly can't determine or set the role
    // Log this to Sentry as it indicates a problem
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
        profileError: profileError,
        timestamp: new Date().toISOString(),
      },
      level: "warning",
    });
    
    redirect("/choose-role");
  }
}


