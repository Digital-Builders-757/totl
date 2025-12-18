import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ONBOARDING_PATH,
  PATHS,
  isAuthRoute,
  isPublicPath,
} from "@/lib/constants/routes";
import { decidePostAuthRedirect } from "@/lib/routing/decide-redirect";
import { determineDestination } from "@/lib/utils/determine-destination";
import {
  hasClientAccess,
  hasTalentAccess,
  needsAdminAccess,
  needsClientAccess,
  needsTalentAccess,
} from "@/lib/utils/route-access";
import type { Database } from "@/types/supabase";

type AccountType = "unassigned" | "talent" | "client";
type ProfileRow = {
  role: Database["public"]["Tables"]["profiles"]["Row"]["role"];
  account_type: AccountType | null;
  is_suspended: boolean | null;
};

const isAssetOrApi = (path: string) =>
  path.startsWith("/_next") ||
  path.startsWith("/favicon") ||
  path.startsWith("/images") ||
  path.startsWith("/api/") || // Allow all API routes (including /api/auth/*) to bypass middleware
  path.includes(".");


export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const res = NextResponse.next();
  const debugRouting = process.env.DEBUG_ROUTING === "1";

  if (isAssetOrApi(path)) {
    return res;
  }

  // NOTE: returnUrl handling is delegated to the shared routing decision brain where applicable.
  const signedOut = req.nextUrl.searchParams.get("signedOut") === "true";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isAuthRoute(path) || isPublicPath(path) || path === ONBOARDING_PATH) {
      return res;
    }
    const redirectUrl = new URL(PATHS.LOGIN, req.url);
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

  if (debugRouting) {
    console.info("[totl][middleware] auth.getUser()", {
      path,
      userId: user?.id ?? null,
      email: user?.email ?? null,
    });
  }

  if (!user) {
    if (isAuthRoute(path) || isPublicPath(path) || path === ONBOARDING_PATH) {
      return res;
    }
    if (!isPublicPath(path)) {
      const redirectUrl = new URL(PATHS.LOGIN, req.url);
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

  if (debugRouting) {
    console.info("[totl][middleware] profile lookup", {
      path,
      userId: user.id,
      role: profile?.role ?? null,
      accountType: profile?.account_type ?? null,
      isSuspended: profile?.is_suspended ?? null,
      profileMissing: !profile,
      profileErrorCode: profileError?.code ?? null,
      profileErrorMessage: profileError?.message ?? null,
    });
  }

  // If profile is missing, allow through on safe routes so AuthProvider can create/hydrate it.
  // Only force redirect on routes that truly require a completed profile.
  if (!profile) {
    const isSafeForProfileBootstrap =
      isAuthRoute(path) ||
      isPublicPath(path) ||
      path === ONBOARDING_PATH ||
      path === PATHS.TALENT_DASHBOARD;

    if (isSafeForProfileBootstrap) {
      return res;
    }

    const redirectUrl = new URL(PATHS.LOGIN, req.url);
    redirectUrl.searchParams.set("returnUrl", path);
    return NextResponse.redirect(redirectUrl);
  }

  const isAdmin = profile?.role === "admin";
  const accountType: AccountType = (profile?.account_type ?? "unassigned") as AccountType;

  if (debugRouting) {
    console.info("[totl][middleware] access flags", {
      path,
      userId: user.id,
      isAdmin,
      accountType,
      needsOnboarding: !isAdmin && accountType === "unassigned",
      signedOut,
    });
  }

  // Admins should not "fall into" Talent/Client terminals (often caused by hardcoded client redirects).
  // Keep this narrowly scoped: only routes that explicitly require non-admin access are redirected.
  if (isAdmin && (needsClientAccess(path) || needsTalentAccess(path))) {
    if (debugRouting) {
      console.info("[totl][middleware] redirect admin to admin dashboard", {
        from: path,
        to: PATHS.ADMIN_DASHBOARD,
        userId: user.id,
        role: profile.role ?? null,
        accountType: profile.account_type ?? null,
        reason: "admin_on_non_admin_terminal",
      });
    }
    return NextResponse.redirect(new URL(PATHS.ADMIN_DASHBOARD, req.url));
  }

  if (profile?.is_suspended && path !== PATHS.SUSPENDED) {
    return NextResponse.redirect(new URL(PATHS.SUSPENDED, req.url));
  }

  // MVP: Default unassigned users to Talent Dashboard (all signups are talent)
  // Only check onboarding for genuinely new users, but redirect to Talent Dashboard instead
  const needsOnboarding = !isAdmin && accountType === "unassigned";
  const onAuthRoute = isAuthRoute(path);

  // If user needs onboarding but has a role, sync account_type and redirect to appropriate dashboard
  // Handle both talent and client roles symmetrically
  // Allow public routes (like /client/apply) to be accessible even during onboarding
  if (needsOnboarding && profile?.role === "talent" && path !== PATHS.TALENT_DASHBOARD && !isPublicPath(path)) {
    // User has talent role but account_type is unassigned - redirect to Talent Dashboard
    // The sync will happen in handleLoginRedirect or on next page load
    return NextResponse.redirect(new URL(PATHS.TALENT_DASHBOARD, req.url));
  }

  if (needsOnboarding && profile?.role === "client" && path !== PATHS.CLIENT_DASHBOARD && !isPublicPath(path)) {
    // User has client role but account_type is unassigned - redirect to Client Dashboard
    // The sync will happen in handleLoginRedirect or on next page load
    return NextResponse.redirect(new URL(PATHS.CLIENT_DASHBOARD, req.url));
  }

  // Only redirect to onboarding if user has no role at all (shouldn't happen with MVP flow)
  // Allow public routes (like /client/apply) to be accessible even during onboarding
  // Exclude /talent/dashboard to prevent infinite redirect loop when user is already on that page
  if (
    needsOnboarding &&
    !profile?.role &&
    path !== ONBOARDING_PATH &&
    path !== PATHS.CHOOSE_ROLE &&
    path !== PATHS.TALENT_DASHBOARD &&
    !isPublicPath(path)
  ) {
    // Default to Talent Dashboard instead of onboarding page
    return NextResponse.redirect(new URL(PATHS.TALENT_DASHBOARD, req.url));
  }

  if (!needsOnboarding && path === ONBOARDING_PATH && !isAdmin) {
    const destination = determineDestination(profile);
    return NextResponse.redirect(new URL(destination, req.url));
  }

  if (onAuthRoute && user) {
    // Allow access to auth routes when signedOut=true to avoid redirect loops while cookies are clearing
    if ((path === PATHS.LOGIN || path === PATHS.CHOOSE_ROLE) && signedOut) {
      return res;
    }
    const profileAccess = { role: profile.role ?? null, account_type: profile.account_type ?? null };
    const decision = decidePostAuthRedirect({
      pathname: path,
      // Preserve existing behavior: don't honor returnUrl while onboarding is unresolved or for admins.
      returnUrlRaw: !needsOnboarding && !isAdmin ? req.nextUrl.searchParams.get("returnUrl") : null,
      signedOut,
      profile: profileAccess,
      fallback: PATHS.TALENT_DASHBOARD,
    });

    if (debugRouting) {
      console.info("[totl][middleware] decidePostAuthRedirect", {
        path,
        userId: user.id,
        profile: profileAccess,
        decision,
      });
    }

    if (decision.type === "redirect") {
      return NextResponse.redirect(new URL(decision.to, req.url));
    }
    return res;
  }

  if (path === PATHS.HOME && !needsOnboarding) {
    const profileAccess = { role: profile.role ?? null, account_type: profile.account_type ?? null };
    const decision = decidePostAuthRedirect({
      pathname: path,
      returnUrlRaw: null,
      signedOut,
      profile: profileAccess,
      fallback: PATHS.TALENT_DASHBOARD,
    });

    if (decision.type === "redirect") {
      return NextResponse.redirect(new URL(decision.to, req.url));
    }
    return res;
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
      const redirectUrl = new URL(PATHS.LOGIN, req.url);
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
      const redirectUrl = new URL(PATHS.LOGIN, req.url);
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
      const redirectUrl = new URL(PATHS.LOGIN, req.url);
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

