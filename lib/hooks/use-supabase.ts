"use client";

import { useMemo } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Custom hook to get a properly typed Supabase client in client components
 * 
 * @returns {SupabaseClient<Database> | null} Fully typed Supabase client or null if not available
 * @note Returns null instead of throwing to prevent render errors. Components should handle null case.
 */
export function useSupabase(): SupabaseClient<Database> | null {
  const client = useMemo(() => {
    const supabase = createSupabaseBrowser();
    
    // Return null instead of throwing to avoid React render errors
    // Components should check for null before using
    if (!supabase) {
      console.warn("Supabase client not available - missing env vars or not in browser");
      return null;
    }
    
    return supabase;
  }, []);

  return client;
}

