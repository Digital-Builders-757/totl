import { createServerClient, createBrowserClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/** Use in React Server Components (read-only cookies) */
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Only throw when the function is *called* (runtime), not at import.
  if (!url || !anon) {
    throw new Error("Missing Supabase environment variables");
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
export async function createSupabaseActionClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Only throw when the function is *called* (runtime), not at import.
  if (!url || !anon) {
    throw new Error("Missing Supabase environment variables");
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
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Only throw when the function is *called* (runtime), not at import.
  if (!url || !anon) {
    throw new Error("Missing Supabase environment variables");
  }

  return createBrowserClient<Database>(url, anon);
}

// Legacy export for backward compatibility
export const createSupabaseClient = createSupabaseBrowserClient;
