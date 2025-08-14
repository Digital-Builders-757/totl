"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseActionClient } from "@/lib/supabase-client";
import type { Database } from "@/types/supabase";

type ProfilesRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfilesUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type TalentInsert = Database["public"]["Tables"]["talent_profiles"]["Insert"];
type ClientInsert = Database["public"]["Tables"]["client_profiles"]["Insert"];

function assertUserId(user: { id?: string }): asserts user is { id: ProfilesRow["id"] } {
  if (!user.id) throw new Error("Missing user id");
}

export async function updateBasicProfile(formData: FormData) {
  const supabase = await createSupabaseActionClient();
  const {
    data: { user },
    error: sessionErr,
  } = await supabase.auth.getUser();

  if (sessionErr || !user) {
    return { error: "Not authenticated" };
  }

  assertUserId(user);
  const display_name = String(formData.get("display_name") ?? "").trim();

  const patch: ProfilesUpdate = { display_name };
  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
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
  const supabase = await createSupabaseActionClient();
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
  const supabase = await createSupabaseActionClient();
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
  const supabase = await createSupabaseActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  assertUserId(user);
  const values: TalentInsert = {
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
    .upsert(values, { onConflict: "user_id" })
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
  const supabase = await createSupabaseActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  assertUserId(user);
  const values: ClientInsert = {
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
    .upsert(values, { onConflict: "user_id" })
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
  const supabase = await createSupabaseActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  assertUserId(user);

  const file = formData.get("avatar") as File | null;
  if (!file) {
    return { error: "No file provided" };
  }

  if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
    return { error: "Invalid file type" };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "File too large" };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;

  // Optional: delete previous avatar(s) to avoid orphans
  const { data: list } = await supabase.storage.from("avatars").list(user.id);
  if (list?.length) {
    await supabase.storage.from("avatars").remove(list.map((f) => `${user.id}/${f.name}`));
  }

  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (upErr) {
    return { error: upErr.message };
  }

  // Store the storage path, not a signed URL
  const patch: ProfilesUpdate = { avatar_path: path };
  const { error: updErr } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select("id,display_name,avatar_url,avatar_path,email_verified,created_at,updated_at")
    .single();

  if (updErr) {
    return { error: updErr.message };
  }

  revalidatePath("/settings");
  return { success: true, avatarPath: path };
}
