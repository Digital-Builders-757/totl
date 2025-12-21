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
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const explicitUrl = process.env.SUPABASE_URL;
  const url = publicUrl || explicitUrl;

  if (!url) {
    throw new Error(
      "Missing SUPABASE URL for tests. Set NEXT_PUBLIC_SUPABASE_URL (preferred) or SUPABASE_URL."
    );
  }

  if (publicUrl && explicitUrl && publicUrl !== explicitUrl) {
    throw new Error(
      `Supabase URL mismatch for tests. NEXT_PUBLIC_SUPABASE_URL (${publicUrl}) !== SUPABASE_URL (${explicitUrl}). ` +
        "Fix env parity so Playwright/Vitest target the same project as the app."
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for tests");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}


