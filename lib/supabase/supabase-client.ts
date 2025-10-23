// lib/supabase-client.ts
// Centralized Supabase client helpers for the TOTL Agency project
// This file provides consistent client creation patterns across the application

import "server-only";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Creates a Supabase server client for Server Components
 * Uses the function pattern for Next.js 15+ compatibility
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

/**
 * Creates a Supabase action client for Server Actions
 * Uses the function pattern for Next.js 15+ compatibility
 */
export async function createSupabaseActionClient() {
  const cookieStore = await cookies();

  return createServerActionClient<Database>({
    cookies: async () => cookieStore,
  });
}

// Re-export the browser client for convenience
export { createSupabaseBrowser } from "./supabase-browser";
