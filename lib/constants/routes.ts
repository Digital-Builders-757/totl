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
  PATHS.GIGS,
  PATHS.TALENT_LANDING,
  PATHS.SUSPENDED,
  PATHS.CLIENT_SIGNUP,
  PATHS.CLIENT_APPLY,
  PATHS.CLIENT_APPLY_SUCCESS,
  PATHS.CLIENT_APPLICATION_STATUS,
];

export const PUBLIC_ROUTE_PREFIXES: readonly string[] = [PREFIXES.TALENT, PREFIXES.GIGS];

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
 * This includes public routes plus public prefixes (e.g. /talent/[slug], /gigs/[id]),
 * but explicitly excludes known protected subtrees that share those prefixes.
 */
export function isPublicPath(pathname: string): boolean {
  if (isPublicRoute(pathname)) return true;

  const isPrefixedPublic = PUBLIC_ROUTE_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isPrefixedPublic) return false;

  // /talent/[slug] is public, but /talent/dashboard, /talent/profile, /talent/settings/*, /talent/subscribe/* are protected.
  if (pathname.startsWith(PREFIXES.TALENT)) {
    const isTalentProtected =
      isPathOrChild(pathname, PATHS.TALENT_DASHBOARD) ||
      isPathOrChild(pathname, PATHS.TALENT_PROFILE) ||
      isPathOrChild(pathname, PREFIXES.TALENT_SETTINGS) ||
      isPathOrChild(pathname, PATHS.TALENT_SUBSCRIBE);

    return !isTalentProtected;
  }

  return true;
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


