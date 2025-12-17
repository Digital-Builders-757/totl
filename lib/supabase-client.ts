import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { Database } from "@/types/supabase";

/**
 * Canonical typed Supabase server client entrypoint.
 *
 * - Use in Server Components (read-only cookies), Server Actions, and Route Handlers.
 * - This wrapper exists to provide a stable import path (`@/lib/supabase-client`) referenced across docs/tools.
 *
 * NOTE: Server Components cannot *persist* cookie writes. `createSupabaseServer()` already guards cookie writes
 * by catching the mutation error in RSC contexts.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  return await createSupabaseServer();
}

/**
 * Canonical typed Supabase server-action client entrypoint.
 *
 * In this codebase, the underlying implementation is shared with `createSupabaseServerClient()`;
 * the distinction is semantic (cookie mutation is only effective in Server Actions/Route Handlers).
 */
export async function createSupabaseActionClient(): Promise<SupabaseClient<Database>> {
  return await createSupabaseServer();
}


