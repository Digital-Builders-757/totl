import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

/**
 * Health check endpoint for Supabase configuration
 * 
 * Checks:
 * - Server-side env vars (SUPABASE_URL, SUPABASE_ANON_KEY)
 * - Client-side env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
 * - Supabase connection (basic query)
 * 
 * GET /api/health/supabase
 */
export async function GET() {
  const checks = {
    server: {
      hasUrl: !!process.env.SUPABASE_URL,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      urlLength: process.env.SUPABASE_URL?.length || 0,
      anonKeyLength: process.env.SUPABASE_ANON_KEY?.length || 0,
    },
    client: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    },
    connection: {
      status: "unknown" as "ok" | "error" | "unknown",
      error: null as string | null,
    },
  };

  // Test Supabase connection
  try {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    
    if (error) {
      checks.connection.status = "error";
      checks.connection.error = error.message;
    } else {
      checks.connection.status = "ok";
    }
  } catch (err) {
    checks.connection.status = "error";
    checks.connection.error = err instanceof Error ? err.message : String(err);
  }

  const allChecksPass =
    checks.server.hasUrl &&
    checks.server.hasAnonKey &&
    checks.client.hasUrl &&
    checks.client.hasAnonKey &&
    checks.connection.status === "ok";

  return NextResponse.json(
    {
      status: allChecksPass ? "healthy" : "unhealthy",
      checks,
      timestamp: new Date().toISOString(),
      release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "unknown",
    },
    {
      status: allChecksPass ? 200 : 503,
    }
  );
}
