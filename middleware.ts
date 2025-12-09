import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

type AccountType = "unassigned" | "talent" | "client";
type ProfileRow = {
  role: Database["public"]["Tables"]["profiles"]["Row"]["role"];
  account_type: AccountType;
  is_suspended: boolean | null;
};

const publicRoutes = [
  "/", 
  "/about", 
  "/gigs", 
  "/talent", 
  "/suspended", 
  "/client/signup", 
  "/client/apply", 
  "/client/apply/success",
  "/client/application-status"
];
const authRoutes = [
  "/login",
  "/reset-password",
  "/update-password",
  "/verification-pending",
  "/choose-role",
];
const onboardingPath = "/onboarding/select-account-type";

const isAssetOrApi = (path: string) =>
  path.startsWith("/_next") ||
  path.startsWith("/favicon") ||
  path.startsWith("/images") ||
  path.startsWith("/api/") || // Allow all API routes (including /api/auth/*) to bypass middleware
  path.includes(".");

const safeReturnUrl = (value: string | null): string | null => {
  if (!value) return null;
  if (value.includes("://") || value.startsWith("//")) return null;
  if (!value.startsWith("/")) return null;
  return value;
};

// Helper functions to check access - fail-safe: deny access if profile is null
// Used for route protection to prevent unauthorized access
const hasTalentAccess = (profile: ProfileRow | null): boolean => {
  if (!profile) return false; // Security: Fail-safe - deny access if profile is null
  return profile.account_type === "talent" || profile.role === "talent";
};

const hasClientAccess = (profile: ProfileRow | null): boolean => {
  if (!profile) return false; // Security: Fail-safe - deny access if profile is null
  // Check both account_type and role for consistency with hasTalentAccess
  // This handles sync mismatch cases where role is set but account_type is unassigned
  return profile.account_type === "client" || profile.role === "client";
};

// Determines redirect destination - allows default fallback for null profiles
// Separate from access control to handle routing vs security differently
const determineDestination = (profile: ProfileRow | null) => {
  if (!profile) return "/talent/dashboard"; // MVP: Default to Talent Dashboard for routing
  if (profile.role === "admin") return "/admin/dashboard";
  // Check both account_type and role for client (handles sync mismatch cases)
  if (profile.account_type === "client" || profile.role === "client") return "/client/dashboard";
  // Check both account_type and role for talent (handles sync mismatch cases)
  if (profile.account_type === "talent" || profile.role === "talent") return "/talent/dashboard";
  // MVP: Default unassigned users to Talent Dashboard (all signups are talent)
  return "/talent/dashboard";
};

const needsClientAccess = (path: string) => 
  path.startsWith("/client/") && 
  path !== "/client/apply" && 
  path !== "/client/apply/success" &&
  path !== "/client/application-status" &&
  path !== "/client/signup";
const needsTalentAccess = (path: string) => path.startsWith("/talent/") && path !== "/talent";
const needsAdminAccess = (path: string) => path.startsWith("/admin/");

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const res = NextResponse.next();

  if (isAssetOrApi(path)) {
    return res;
  }

  const returnUrl = safeReturnUrl(req.nextUrl.searchParams.get("returnUrl"));
  const signedOut = req.nextUrl.searchParams.get("signedOut") === "true";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (authRoutes.includes(path) || publicRoutes.includes(path) || path === onboardingPath) {
      return res;
    }
    const redirectUrl = new URL("/login", req.url);
    // searchParams.set() automatically URL-encodes the value, so don't use encodeURIComponent()
    redirectUrl.searchParams.set("returnUrl", path);
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (authRoutes.includes(path) || publicRoutes.includes(path) || path === onboardingPath) {
      return res;
    }
    if (!publicRoutes.includes(path)) {
      const redirectUrl = new URL("/login", req.url);
      // searchParams.set() automatically URL-encodes the value, so don't use encodeURIComponent()
      redirectUrl.searchParams.set("returnUrl", path);
      return NextResponse.redirect(redirectUrl);
    }
    return res;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, account_type, is_suspended")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Middleware profile query error:", profileError);
  }

  // Security: If profile is null for authenticated user, redirect to login to force re-authentication
  // This prevents access control bypass and ensures profile is created
  // Handle both cases: missing profile (no error) and query errors (profileError exists)
  if (!profile) {
    // Profile doesn't exist or query failed - redirect to login to trigger profile creation/re-authentication
    // This prevents unauthorized access when profile query fails
    const redirectUrl = new URL("/login", req.url);
    // searchParams.set() automatically URL-encodes the value, so don't use encodeURIComponent()
    redirectUrl.searchParams.set("returnUrl", path);
    return NextResponse.redirect(redirectUrl);
  }

  const isAdmin = profile?.role === "admin";
  const accountType: AccountType = (profile?.account_type ?? "unassigned") as AccountType;

  if (profile?.is_suspended && path !== "/suspended") {
    return NextResponse.redirect(new URL("/suspended", req.url));
  }

  // MVP: Default unassigned users to Talent Dashboard (all signups are talent)
  // Only check onboarding for genuinely new users, but redirect to Talent Dashboard instead
  const needsOnboarding = !isAdmin && accountType === "unassigned";
  const onAuthRoute = authRoutes.includes(path);

  // If user needs onboarding but has a role, sync account_type and redirect to appropriate dashboard
  // Handle both talent and client roles symmetrically
  // Allow public routes (like /client/apply) to be accessible even during onboarding
  if (needsOnboarding && profile?.role === "talent" && path !== "/talent/dashboard" && !publicRoutes.includes(path)) {
    // User has talent role but account_type is unassigned - redirect to Talent Dashboard
    // The sync will happen in handleLoginRedirect or on next page load
    return NextResponse.redirect(new URL("/talent/dashboard", req.url));
  }

  if (needsOnboarding && profile?.role === "client" && path !== "/client/dashboard" && !publicRoutes.includes(path)) {
    // User has client role but account_type is unassigned - redirect to Client Dashboard
    // The sync will happen in handleLoginRedirect or on next page load
    return NextResponse.redirect(new URL("/client/dashboard", req.url));
  }

  // Only redirect to onboarding if user has no role at all (shouldn't happen with MVP flow)
  // Allow public routes (like /client/apply) to be accessible even during onboarding
  // Exclude /talent/dashboard to prevent infinite redirect loop when user is already on that page
  if (needsOnboarding && !profile?.role && path !== onboardingPath && path !== "/choose-role" && path !== "/talent/dashboard" && !publicRoutes.includes(path)) {
    // Default to Talent Dashboard instead of onboarding page
    return NextResponse.redirect(new URL("/talent/dashboard", req.url));
  }

  if (!needsOnboarding && path === onboardingPath && !isAdmin) {
    const destination = determineDestination(profile);
    return NextResponse.redirect(new URL(destination, req.url));
  }

  if (onAuthRoute && user) {
    // Allow access to auth routes when signedOut=true to avoid redirect loops while cookies are clearing
    if ((path === "/login" || path === "/choose-role") && signedOut) {
      return res;
    }
    if (returnUrl && !needsOnboarding && !isAdmin) {
      const returnPath = new URL(returnUrl, req.url);
      const target = returnPath.pathname;
      if (
        (!needsClientAccess(target) || hasClientAccess(profile)) &&
        (!needsTalentAccess(target) || hasTalentAccess(profile)) &&
        (!target.startsWith("/admin/") || isAdmin)
      ) {
        return NextResponse.redirect(returnPath);
      }
    }
    const destination = determineDestination(profile);
    return NextResponse.redirect(new URL(destination, req.url));
  }

  if (path === "/" && !needsOnboarding) {
    const destination = determineDestination(profile);
    return NextResponse.redirect(new URL(destination, req.url));
  }

  if (!isAdmin) {
    if (needsAdminAccess(path)) {
      const destination = determineDestination(profile);
      // Prevent infinite redirect loop: don't redirect if already on destination
      if (destination !== path) {
        return NextResponse.redirect(new URL(destination, req.url));
      }
      // Security: If user doesn't have admin access and is already on destination, redirect to login
      // This prevents unauthorized access when destination matches current path
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("returnUrl", path);
      return NextResponse.redirect(redirectUrl);
    }
    if (needsClientAccess(path) && !hasClientAccess(profile)) {
      const destination = determineDestination(profile);
      // Prevent infinite redirect loop: don't redirect if already on destination
      if (destination !== path) {
        return NextResponse.redirect(new URL(destination, req.url));
      }
      // Security: If user doesn't have client access and is already on destination, redirect to login
      // This prevents unauthorized access when destination matches current path
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("returnUrl", path);
      return NextResponse.redirect(redirectUrl);
    }
    if (needsTalentAccess(path) && !hasTalentAccess(profile)) {
      const destination = determineDestination(profile);
      // Prevent infinite redirect loop: don't redirect if already on destination
      // Security: If user doesn't have talent access and is already on destination, redirect to login
      // This prevents unauthorized access for users with null role and unassigned account_type
      if (destination !== path) {
        return NextResponse.redirect(new URL(destination, req.url));
      }
      // User is already on destination but doesn't have access - redirect to login to force re-authentication
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("returnUrl", path);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

