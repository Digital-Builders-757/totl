export const PATHS = {
  // Public
  HOME: "/",
  ABOUT: "/about",
  GIGS: "/gigs",
  TALENT_LANDING: "/talent",
  SUSPENDED: "/suspended",

  // Client application flow (Career Builder)
  CLIENT_SIGNUP: "/client/signup",
  CLIENT_APPLY: "/client/apply",
  CLIENT_APPLY_SUCCESS: "/client/apply/success",
  CLIENT_APPLICATION_STATUS: "/client/application-status",

  // Auth
  LOGIN: "/login",
  RESET_PASSWORD: "/reset-password",
  UPDATE_PASSWORD: "/update-password",
  VERIFICATION_PENDING: "/verification-pending",
  CHOOSE_ROLE: "/choose-role",

  // Onboarding
  ONBOARDING: "/onboarding",
  ONBOARDING_SELECT_ACCOUNT_TYPE: "/onboarding/select-account-type",

  // Dashboards
  TALENT_DASHBOARD: "/talent/dashboard",
  CLIENT_DASHBOARD: "/client/dashboard",
  ADMIN_DASHBOARD: "/admin/dashboard",

  // Talent (private + misc)
  TALENT_PROFILE: "/talent/profile",
  TALENT_SUBSCRIBE: "/talent/subscribe",
  TALENT_SIGNUP: "/talent/signup",
} as const;

export const PREFIXES = {
  TALENT: "/talent/",
  GIGS: "/gigs/",
  CLIENT: "/client/",
  ADMIN: "/admin/",
  TALENT_SETTINGS: "/talent/settings",
  ONBOARDING: "/onboarding",
  SETTINGS: "/settings",
  PROFILE: "/profile",
} as const;

export type Path = (typeof PATHS)[keyof typeof PATHS];
export type Prefix = (typeof PREFIXES)[keyof typeof PREFIXES];

export type PostAuthFallback = typeof PATHS.TALENT_DASHBOARD | typeof PATHS.CHOOSE_ROLE;

export const PUBLIC_ROUTES: readonly string[] = [
  PATHS.HOME,
  PATHS.ABOUT,
  PATHS.SUSPENDED,
  PATHS.CLIENT_SIGNUP,
  // NOTE: PATHS.GIGS and PATHS.TALENT_LANDING removed per Approach B + G1:
  // - /gigs (list) requires sign-in
  // - /talent (directory) is disabled
];

// Removed PUBLIC_ROUTE_PREFIXES - too broad for Approach B + G1.
// Public dynamic routes are now handled explicitly in isPublicPath().

export const AUTH_ROUTES: readonly string[] = [
  PATHS.LOGIN,
  PATHS.RESET_PASSWORD,
  PATHS.UPDATE_PASSWORD,
  PATHS.VERIFICATION_PENDING,
  PATHS.CHOOSE_ROLE,
];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname);
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname);
}

export function isPathOrChild(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`);
}

export function isSignedInAllowedPath(pathname: string): boolean {
  return SIGNED_IN_ALLOWED_PREFIXES.some((p) => isPathOrChild(pathname, p));
}

/**
 * Public means "safe to remain on while signed out".
 * 
 * Approach B + G1 Policy:
 * - /talent/[slug] is public (marketing profiles)
 * - /gigs/[id] is public (gig detail pages for published gigs)
 * - /gigs (list) requires sign-in
 * - /talent (directory) is disabled
 * - /gigs/[id]/apply requires sign-in (talent-only)
 */
export function isPublicPath(pathname: string): boolean {
  // Explicit public routes
  if (isPublicRoute(pathname)) return true;

  // /talent is now a public marketing page (not a directory)
  if (pathname === PATHS.TALENT_LANDING) {
    return true;
  }

  // Hard deny: /gigs list requires sign-in
  if (pathname === PATHS.GIGS) {
    return false;
  }

  // /talent/[slug] - public marketing profile (exactly one segment after /talent/)
  if (pathname.startsWith(PREFIXES.TALENT)) {
    const talentPath = pathname.slice(PREFIXES.TALENT.length);
    const segments = talentPath.split("/").filter(Boolean);
    
    // Must be exactly one segment (the slug), and not a protected talent route
    if (segments.length === 1) {
      const slug = segments[0];
      // Deny protected talent routes even if they look like slugs
      const isTalentProtected =
        slug === "dashboard" ||
        slug === "profile" ||
        slug.startsWith("settings") ||
        slug.startsWith("subscribe") ||
        slug === "signup";
      
      return !isTalentProtected;
    }
    
    // More than one segment = protected (e.g., /talent/dashboard/something)
    return false;
  }

  // /gigs/[id] - public gig detail (exactly one segment after /gigs/)
  // /gigs/[id]/apply - protected (talent-only)
  if (pathname.startsWith(PREFIXES.GIGS)) {
    const gigsPath = pathname.slice(PREFIXES.GIGS.length);
    const segments = gigsPath.split("/").filter(Boolean);
    
    // Must be exactly one segment (the gig ID)
    if (segments.length === 1) {
      return true; // /gigs/[id] is public
    }
    
    // More than one segment = protected (e.g., /gigs/[id]/apply)
    return false;
  }

  return false;
}

// Canonical onboarding entrypoint (BootState routes here when profile completion is required)
export const ONBOARDING_PATH = PATHS.ONBOARDING;

// Used by AuthProvider to prevent redirect churn immediately after SIGNED_IN
export const SIGNED_IN_ALLOWED_PREFIXES: readonly string[] = [
  PREFIXES.SETTINGS,
  PREFIXES.PROFILE,
  PREFIXES.ONBOARDING,
  PATHS.CHOOSE_ROLE,
  PATHS.VERIFICATION_PENDING,

  // Stable signed-in surfaces (avoid churn on SIGNED_IN)
  PATHS.TALENT_DASHBOARD,
  PATHS.TALENT_PROFILE,
  PREFIXES.TALENT_SETTINGS,
  PATHS.TALENT_SUBSCRIBE,
  PATHS.CLIENT_DASHBOARD,
  PATHS.ADMIN_DASHBOARD,
];


