"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { Database } from "@/types/supabase";

type GigInsert = Database["public"]["Tables"]["gigs"]["Insert"];

export async function createGigAction(input: {
  title: string;
  description: string;
  category: string;
  location: string;
  compensation: string;
  duration: string;
  date: string;
  application_deadline?: string | null;
}): Promise<{ ok: true; gigId: string } | { ok: false; error: string }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, error: "Not authenticated" };

  const payload: GigInsert = {
    client_id: user.id,
    title: input.title,
    description: input.description,
    category: input.category,
    location: input.location,
    compensation: input.compensation,
    duration: input.duration,
    date: input.date,
    application_deadline: input.application_deadline ?? null,
    status: "active",
  };

  const { data, error } = await supabase
    .from("gigs")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed to create gig" };

  return { ok: true, gigId: data.id };
}


