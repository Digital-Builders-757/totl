"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";
import type { Database } from "@/types/supabase";

/**
 * Custom hook to get a properly typed Supabase client in client components.
 * 
 * **HARDENING**: 
 * - Pre-mount: Returns `null` (prevents SSR/prerender crashes)
 * - Post-mount: Returns non-null client (or throws if env vars missing)
 * - If env vars are missing, `createSupabaseBrowser()` throws (fail-fast, no zombie state)
 * 
 * **Usage Pattern:**
 * ```tsx
 * const supabase = useSupabase();
 * if (!supabase) {
 *   return <LoadingScreen />;
 * }
 * // Now supabase is guaranteed non-null
 * ```
 * 
 * @returns {SupabaseClient<Database> | null} Client instance (null during pre-mount/SSR)
 * @throws {Error} If Supabase env vars are missing (only after mount)
 */
export function useSupabase(): SupabaseClient<Database> | null {
  // Use ref + state pattern to ensure client is only created after mount
  const clientRef = useRef<SupabaseClient<Database> | null>(null);
  const [client, setClient] = useState<SupabaseClient<Database> | null>(null);

  useEffect(() => {
    // Only create client after mount (client-side only)
    if (typeof window !== 'undefined' && !clientRef.current) {
      // HARDENING: createSupabaseBrowser() always throws if env vars missing
      // This ensures we never have zombie states - if env vars are missing, we crash immediately
      const newClient = createSupabaseBrowser();
      clientRef.current = newClient;
      setClient(newClient);
    }
  }, []);

  // Return null during pre-mount/SSR (prevents build crashes)
  // Components must handle null case with loading UI
  return client;
}

