"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import {
  sanitizeSavedSearchParams,
  type SavedSearchParams,
} from "@/lib/utils/saved-search-params";
import type { Json } from "@/types/supabase";

export type { SavedSearchParams } from "@/lib/utils/saved-search-params";

const MAX_SAVED_SEARCHES_PER_USER = 25;

export interface SavedSearch {
  id: string;
  name: string;
  params: SavedSearchParams;
  created_at: string;
}

export async function listSavedSearches(): Promise<
  { ok: true; data: SavedSearch[] } | { ok: false; error: string }
> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("saved_searches")
      .select("id, name, params, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching saved searches", error);
      return { ok: false, error: "Failed to load saved searches" };
    }

    const searches: SavedSearch[] = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      params: sanitizeSavedSearchParams(row.params),
      created_at: row.created_at,
    }));

    return { ok: true, data: searches };
  } catch (err) {
    logger.error("Unexpected error listing saved searches", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

export async function saveSearch(
  name: string,
  params: SavedSearchParams
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Unauthorized" };
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return { ok: false, error: "Name is required" };
    }

    if (trimmedName.length > 64) {
      return { ok: false, error: "Name must be 64 characters or less" };
    }

    const { count } = await supabase
      .from("saved_searches")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (typeof count === "number" && count >= MAX_SAVED_SEARCHES_PER_USER) {
      return {
        ok: false,
        error: `You can save up to ${MAX_SAVED_SEARCHES_PER_USER} searches. Delete one to save a new one.`,
      };
    }

    const sanitized = sanitizeSavedSearchParams(params);

    const { data, error } = await supabase
      .from("saved_searches")
      .insert({
        user_id: user.id,
        name: trimmedName,
        params: sanitized as Json,
      })
      .select("id")
      .single();

    if (error) {
      logger.error("Error saving search", error);
      if (error.code === "23505") {
        return { ok: false, error: "A saved search with this name already exists" };
      }
      return { ok: false, error: "Failed to save search" };
    }

    return { ok: true, id: data.id };
  } catch (err) {
    logger.error("Unexpected error saving search", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

export async function deleteSavedSearch(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("saved_searches")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting saved search", error);
      return { ok: false, error: "Failed to delete saved search" };
    }

    return { ok: true };
  } catch (err) {
    logger.error("Unexpected error deleting saved search", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}
