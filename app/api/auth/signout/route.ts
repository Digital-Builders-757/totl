import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export async function POST() {
  let supabaseError: Error | null = null;
  
  try {
    const supabase = await createSupabaseServer();
    
    // Sign out from Supabase (clears server-side session)
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      supabaseError = signOutError;
      console.error("Supabase sign-out error:", signOutError);
      // Log to Sentry but don't fail the request (cookies still need to be cleared)
      try {
        const Sentry = await import("@sentry/nextjs");
        Sentry.captureException(signOutError, {
          tags: { feature: "auth", error_type: "supabase_signout_error" },
        });
      } catch {
        // Sentry not available, skip
      }
    }
  } catch (error) {
    console.error("Error creating Supabase server client:", error);
    // Continue to clear cookies even if Supabase client creation fails
  }
  
  // Clear all Supabase-related cookies by inspection (not guessing chunks)
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // Create response early so we can set cookies in it
  const response = NextResponse.json({ success: true });
  
  // Patterns to match Supabase cookies
  const supabaseCookiePatterns: string[] = [];
  
  if (supabaseUrl) {
    const projectRef = supabaseUrl.split("//")[1].split(".")[0];
    const cookieBaseName = `sb-${projectRef}-auth-token`;
    supabaseCookiePatterns.push(cookieBaseName);
  }
  
  // Add legacy patterns
  supabaseCookiePatterns.push("sb-access-token", "sb-refresh-token", "sb-user-token");
  
  // Find and clear all cookies matching Supabase patterns
  const cookiesToClear = new Set<string>();
  
  for (const cookie of allCookies) {
    const cookieName = cookie.name;
    
    // Check if cookie matches any Supabase pattern
    for (const pattern of supabaseCookiePatterns) {
      if (cookieName === pattern || cookieName.startsWith(`${pattern}.`)) {
        cookiesToClear.add(cookieName);
        break;
      }
    }
    
    // Also check for generic patterns
    if (cookieName.startsWith("sb-") || cookieName.includes("auth-token")) {
      cookiesToClear.add(cookieName);
    }
  }
  
  // Clear all matching cookies
  for (const cookieName of cookiesToClear) {
    cookieStore.delete(cookieName);
    response.cookies.delete(cookieName);
    response.cookies.set(cookieName, "", {
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }
  
  // Set cache headers to prevent caching of sign out response
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  
  return response;
}
