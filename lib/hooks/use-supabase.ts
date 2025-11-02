"use client";

import { useMemo } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Custom hook to get a properly typed Supabase client in client components
 * 
 * @throws {Error} If Supabase client cannot be created (missing env vars or not in browser)
 * @returns {SupabaseClient<Database>} Fully typed Supabase client
 */
export function useSupabase(): SupabaseClient<Database> {
  const client = useMemo(() => {
    const supabase = createSupabaseBrowser();
    
    if (!supabase) {
      throw new Error(
        "Supabase client not available. This component must be used in a browser environment with valid Supabase credentials."
      );
    }
    
    return supabase;
  }, []);

  return client;
}

