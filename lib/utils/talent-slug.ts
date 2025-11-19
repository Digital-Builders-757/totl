/**
 * Helper functions for generating talent profile slugs
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createNameSlug } from "./slug";
import type { Database } from "@/types/supabase";

type TalentProfile = Database["public"]["Tables"]["talent_profiles"]["Row"];

/**
 * Generate a slug from talent profile data
 */
export function getTalentSlug(talent: TalentProfile | { first_name: string; last_name: string }): string {
  return createNameSlug(talent.first_name, talent.last_name);
}

/**
 * Generate a slug from talent_id by fetching the profile
 * This is for cases where we only have the talent_id
 */
export async function getTalentSlugFromId(
  supabase: SupabaseClient<Database>,
  talentId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("talent_profiles")
      .select("first_name, last_name")
      .eq("user_id", talentId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return createNameSlug(data.first_name, data.last_name);
  } catch (error) {
    console.error("Error fetching talent profile for slug:", error);
    return null;
  }
}

