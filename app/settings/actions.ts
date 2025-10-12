"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

function assertUserId(user: { id?: string }): asserts user is { id: string } {
  if (!user.id) throw new Error("Missing user id");
}

export async function updateBasicProfile(formData: FormData) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: sessionErr,
  } = await supabase.auth.getUser();

  if (sessionErr || !user) {
    return { error: "Not authenticated" };
  }

  assertUserId(user);
  const display_name = String(formData.get("display_name") ?? "").trim();

  const patch = { display_name };
  const { error } = await supabase
    .from("profiles")
    .update(patch as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    .eq("id", user.id as string)
    .select("id,display_name,avatar_url,avatar_path,email_verified,created_at,updated_at")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updateEmail(newEmail: string) {
  "use server";
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) {
    return { error: error.message };
  }

  return { success: true }; // Supabase will send a confirmation email
}

export async function changePassword(password: string) {
  "use server";
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase.auth.updateUser({ password });
  return error ? { error: error.message } : { success: true };
}

export async function upsertTalentProfile(payload: {
  first_name: string;
  last_name: string;
  phone?: string;
  age?: number;
  location?: string;
  experience?: string;
  portfolio_url?: string;
  height?: string;
  measurements?: string;
  hair_color?: string;
  eye_color?: string;
  shoe_size?: string;
  languages?: string[];
  specialties?: string[];
}) {
  "use server";
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  assertUserId(user);
  const values = {
    user_id: user.id,
    first_name: payload.first_name,
    last_name: payload.last_name,
    phone: payload.phone,
    age: payload.age,
    location: payload.location,
    experience: payload.experience,
    portfolio_url: payload.portfolio_url,
    height: payload.height,
    measurements: payload.measurements,
    hair_color: payload.hair_color,
    eye_color: payload.eye_color,
    shoe_size: payload.shoe_size,
    languages: payload.languages,
    specialties: payload.specialties,
  };
  const { error } = await supabase
    .from("talent_profiles")
    .upsert(values as any, { onConflict: "user_id" }) // eslint-disable-line @typescript-eslint/no-explicit-any
    .select("user_id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function upsertClientProfile(payload: {
  company_name: string;
  industry?: string;
  website?: string;
  contact_name?: string;
  contact_email: string;
  contact_phone?: string;
  company_size?: string;
}) {
  "use server";
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  assertUserId(user);
  const values = {
    user_id: user.id,
    company_name: payload.company_name,
    industry: payload.industry,
    website: payload.website,
    contact_name: payload.contact_name,
    contact_email: payload.contact_email,
    contact_phone: payload.contact_phone,
    company_size: payload.company_size,
  };
  const { error } = await supabase
    .from("client_profiles")
    .upsert(values as any, { onConflict: "user_id" }) // eslint-disable-line @typescript-eslint/no-explicit-any
    .select("user_id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  "use server";

  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Authentication failed" };
    }

    assertUserId(user);

    const file = formData.get("avatar") as File | null;
    if (!file || file.size === 0) {
      return { error: "No file provided" };
    }

    // Enhanced file validation
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return { error: "Invalid file type. Please use JPEG, PNG, GIF, or WebP" };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` };
    }

    // Generate optimized path following user-specific folder pattern
    const ext =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : "gif";
    const timestamp = Date.now();
    const path = `${user.id}/avatar-${timestamp}.${ext}`;

    // Upload new file first
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      return { error: "Failed to upload image. Please try again." };
    }

    // Update database with new path
    const patch = {
      avatar_path: path,
      updated_at: new Date().toISOString(),
    };
    const { error: updateError } = await supabase
      .from("profiles")
      .update(patch as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .eq("id", user.id as string)
      .select("id,display_name,avatar_url,avatar_path,email_verified,created_at,updated_at")
      .single();

    if (updateError) {
      // Rollback: remove the uploaded file
      await supabase.storage.from("avatars").remove([path]);
      console.error("Database update error:", updateError);
      return { error: "Failed to update profile. Please try again." };
    }

    // Clean up old avatars after successful update
    try {
      const { data: list } = await supabase.storage.from("avatars").list(user.id);
      if (list && list.length > 1) {
        const filesToDelete = list.map((f) => `${user.id}/${f.name}`).filter((p) => p !== path); // Keep only the new file

        if (filesToDelete.length > 0) {
          await supabase.storage.from("avatars").remove(filesToDelete);
        }
      }
    } catch (cleanupError) {
      // Log but don't fail the operation for cleanup errors
      console.warn("Avatar cleanup warning:", cleanupError);
    }

    revalidatePath("/settings");
    return {
      success: true,
      avatarPath: path,
      message: "Avatar updated successfully",
    };
  } catch (error) {
    console.error("Unexpected avatar upload error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
