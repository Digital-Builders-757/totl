// lib/supabase-server.ts
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "../../types/database";

export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  );
}
