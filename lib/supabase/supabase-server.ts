// lib/supabase-server.ts
import "server-only";
import * as Sentry from "@sentry/nextjs";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function createSupabaseServer(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  // Prefer secure, non-public env vars on the server; fall back to NEXT_PUBLIC only if necessary
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase Server Client Debug:', {
      has_SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
      has_SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY),
      has_NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      has_NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
      supabaseAnonKey: supabaseAnonKey ? 'SET' : 'MISSING',
    });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const envState = {
      has_SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
      has_SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY),
      has_NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      has_NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    };
    const err = new Error("Supabase configuration missing: URL or ANON key not set on server");
    Sentry.captureException(err, { extra: envState });
    // Throw early to avoid confusing downstream 401 "Invalid API key" errors
    throw err;
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            // Attempt to set cookies - this will fail in Server Components but succeed in Server Actions/Route Handlers
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          } catch {
            // Cookies can only be modified in Server Actions or Route Handlers
            // In Server Components (pages), this will silently fail which is expected
            // The session will still work correctly with the cookies that are already set
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;
}
