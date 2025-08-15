import { createServerClient, createBrowserClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/** Use in React Server Components (read-only cookies) */
export async function createSupabaseServerClient(): Promise<ReturnType<
  typeof createServerClient<Database>
> | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Don't throw at import time. Only fail when actually called.
  if (!url || !anon) {
    // In production, fail explicitly so you see a 500 at runtime
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing Supabase environment variables");
    }
    // In dev, warn and return a no-op-ish client if you prefer
    console.warn("Missing Supabase env; returning null client in dev");
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set(name, "", { ...options, maxAge: 0 });
      },
    },
  });
}

/** Use in server actions / route handlers (can set/remove cookies) */
export async function createSupabaseActionClient(): Promise<ReturnType<
  typeof createServerClient<Database>
> | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Don't throw at import time. Only fail when actually called.
  if (!url || !anon) {
    // In production, fail explicitly so you see a 500 at runtime
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing Supabase environment variables");
    }
    // In dev, warn and return a no-op-ish client if you prefer
    console.warn("Missing Supabase env; returning null client in dev");
    return null;
  }

  const cookieStore = await cookies(); // <-- MUST await
  return createServerClient<Database>(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set(name, "", { ...options, maxAge: 0 });
      },
    },
  });
}

/** Use in client components */
export function createSupabaseBrowserClient(): ReturnType<
  typeof createBrowserClient<Database>
> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Don't throw at import time. Only fail when actually called.
  if (!url || !anon) {
    // In production, fail explicitly so you see a 500 at runtime
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing Supabase environment variables");
    }
    // In dev, warn and return a no-op-ish client if you prefer
    console.warn("Missing Supabase env; returning null client in dev");
    return null;
  }

  return createBrowserClient<Database>(url, anon);
}

// Legacy export for backward compatibility
export const createSupabaseClient = createSupabaseBrowserClient;
