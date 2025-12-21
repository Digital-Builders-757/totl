import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Test-only Supabase admin client.
 *
 * IMPORTANT:
 * - Do NOT import `@/lib/supabase-admin-client` in Playwright/Vitest, because it contains `import "server-only"`.
 * - This helper is safe for Node test runners and uses env vars (no Next runtime assumptions).
 */
export function createSupabaseAdminClientForTests() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "http://127.0.0.1:54321";

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for tests");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}


