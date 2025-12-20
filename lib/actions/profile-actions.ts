"use server";

import "server-only";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { Database } from "@/types/supabase";

type ActionResult = { ok: true } | { ok: false; error: string };

const talentProfileSchema = z.object({
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  phone: z.string().nullish(),
  age: z.number().int().min(18).max(100).nullish(),
  location: z.string().max(100).nullish(),
  experience: z.string().max(500).nullish(),
  portfolio_url: z.string().url().nullish(),
  height: z.string().max(20).nullish(),
  measurements: z.string().max(100).nullish(),
  hair_color: z.string().max(30).nullish(),
  eye_color: z.string().max(30).nullish(),
  shoe_size: z.string().max(10).nullish(),
  languages: z.array(z.string().min(1).max(50)).nullish(),
});

const clientProfileSchema = z.object({
  company_name: z.string().min(2).max(100),
  industry: z.string().nullish(),
  website: z.string().url().nullish(),
  contact_name: z.string().max(100).nullish(),
  contact_email: z.string().email(),
  contact_phone: z.string().nullish(),
  company_size: z.string().nullish(),
});

type TalentProfilesInsert = Database["public"]["Tables"]["talent_profiles"]["Insert"];
type ClientProfilesInsert = Database["public"]["Tables"]["client_profiles"]["Insert"];
type TalentProfilesUpdate = Database["public"]["Tables"]["talent_profiles"]["Update"];
type ProfilesUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export async function upsertTalentProfileAction(
  input: z.infer<typeof talentProfileSchema>
): Promise<ActionResult> {
  const parsed = talentProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Authentication error. Please log in again." };

  const values: TalentProfilesInsert = {
    user_id: user.id,
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    phone: parsed.data.phone ?? null,
    age: parsed.data.age ?? null,
    location: parsed.data.location ?? null,
    experience: parsed.data.experience ?? null,
    portfolio_url: parsed.data.portfolio_url ?? null,
    height: parsed.data.height ?? null,
    measurements: parsed.data.measurements ?? null,
    hair_color: parsed.data.hair_color ?? null,
    eye_color: parsed.data.eye_color ?? null,
    shoe_size: parsed.data.shoe_size ?? null,
    languages: parsed.data.languages ?? null,
  };

  const { error } = await supabase.from("talent_profiles").upsert(values, { onConflict: "user_id" });
  if (error) return { ok: false, error: error.message };

  const displayName = `${parsed.data.first_name} ${parsed.data.last_name}`.trim();
  const { error: nameError } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (nameError) {
    // Non-fatal: profile data was saved; display_name is cosmetic.
    console.warn("[totl] upsertTalentProfileAction: display_name update failed", {
      userId: user.id,
      message: nameError.message,
    });
  }

  return { ok: true };
}

export async function upsertClientProfileAction(
  input: z.infer<typeof clientProfileSchema>
): Promise<ActionResult> {
  const parsed = clientProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Authentication error. Please log in again." };

  const values: ClientProfilesInsert = {
    user_id: user.id,
    company_name: parsed.data.company_name,
    industry: parsed.data.industry ?? null,
    website: parsed.data.website ?? null,
    contact_name: parsed.data.contact_name ?? null,
    contact_email: parsed.data.contact_email,
    contact_phone: parsed.data.contact_phone ?? null,
    company_size: parsed.data.company_size ?? null,
  };

  const { error } = await supabase.from("client_profiles").upsert(values, { onConflict: "user_id" });
  if (error) return { ok: false, error: error.message };

  const { error: nameError } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.company_name })
    .eq("id", user.id);

  if (nameError) {
    console.warn("[totl] upsertClientProfileAction: display_name update failed", {
      userId: user.id,
      message: nameError.message,
    });
  }

  return { ok: true };
}

const talentPersonalInfoSchema = z.object({
  phone: z.string().min(1).max(50),
  age: z.number().int().min(16).max(100).nullable(),
  location: z.string().min(1).max(100),
  height: z.string().max(20).nullable(),
  measurements: z.string().max(100).nullable(),
  hair_color: z.string().max(30).nullable(),
  eye_color: z.string().max(30).nullable(),
  shoe_size: z.string().max(10).nullable(),
  languages: z.array(z.string().min(1).max(50)).nullable(),
  instagram_handle: z.string().max(50).nullable(),
});

export async function updateTalentPersonalInfoAction(
  input: z.infer<typeof talentPersonalInfoSchema>
): Promise<ActionResult> {
  const parsed = talentPersonalInfoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, error: "Authentication error. Please log in again." };

  const talentPatch: TalentProfilesUpdate = {
    phone: parsed.data.phone,
    age: parsed.data.age,
    location: parsed.data.location,
    height: parsed.data.height,
    measurements: parsed.data.measurements,
    hair_color: parsed.data.hair_color,
    eye_color: parsed.data.eye_color,
    shoe_size: parsed.data.shoe_size,
    languages: parsed.data.languages,
    updated_at: new Date().toISOString(),
  };

  const { error: talentError } = await supabase
    .from("talent_profiles")
    .update(talentPatch)
    .eq("user_id", user.id);

  if (talentError) return { ok: false, error: talentError.message };

  const profilePatch: ProfilesUpdate = {
    instagram_handle: parsed.data.instagram_handle,
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profilePatch)
    .eq("id", user.id);

  if (profileError) return { ok: false, error: profileError.message };

  return { ok: true };
}

const talentProfessionalInfoSchema = z.object({
  experience: z.string().min(1).max(500),
  portfolio_url: z.string().url().nullable(),
  specialties: z.array(z.string().min(1).max(50)).nullable(),
});

export async function updateTalentProfessionalInfoAction(
  input: z.infer<typeof talentProfessionalInfoSchema>
): Promise<ActionResult> {
  const parsed = talentProfessionalInfoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, error: "Authentication error. Please log in again." };

  const patch: TalentProfilesUpdate = {
    experience: parsed.data.experience,
    portfolio_url: parsed.data.portfolio_url,
    specialties: parsed.data.specialties,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("talent_profiles").update(patch).eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}


