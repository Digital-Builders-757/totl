import { createServerClient, createBrowserClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function validateEnvVars() {
  if (!URL || !ANON) {
    throw new Error("Missing Supabase environment variables");
  }
}

/** Use in React Server Components (read-only cookies) */
export async function createSupabaseServerClient() {
  validateEnvVars();
  const cookieStore = await cookies();

  return createServerClient<Database>(URL!, ANON!, {
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
  validateEnvVars();
  const cookieStore = await cookies(); // <-- MUST await
  return createServerClient<Database>(URL!, ANON!, {
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
  validateEnvVars();
  return createBrowserClient<Database>(URL!, ANON!);
}

// Legacy export for backward compatibility
export const createSupabaseClient = createSupabaseBrowserClient;
