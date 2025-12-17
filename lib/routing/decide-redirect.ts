import {
  PATHS,
  type PostAuthFallback,
  isAuthRoute,
  isSignedInAllowedPath,
} from "@/lib/constants/routes";
import { determineDestination } from "@/lib/utils/determine-destination";
import { safeReturnUrl } from "@/lib/utils/return-url";

import type { ProfileAccessLike } from "@/lib/utils/route-access";
import {
  hasClientAccess,
  hasTalentAccess,
  needsAdminAccess,
  needsClientAccess,
  needsTalentAccess,
} from "@/lib/utils/route-access";


export type Decision = { type: "allow" } | { type: "redirect"; to: string };

function isRoutableProfile(profile: ProfileAccessLike | null): boolean {
  if (!profile) return false;
  if (profile.role === "admin") return true;

  // Preserve middleware behavior: non-admin is only "routable" once account_type is resolved
  // (do not honor returnUrl while account_type is still mid-sync/unassigned).
  return profile.account_type === "talent" || profile.account_type === "client";
}

function canAccessTarget(profile: ProfileAccessLike | null, targetPath: string): boolean {
  const isAdmin = profile?.role === "admin";

  if (needsAdminAccess(targetPath)) return isAdmin;
  if (needsClientAccess(targetPath)) return hasClientAccess(profile);
  if (needsTalentAccess(targetPath)) return hasTalentAccess(profile);

  return true;
}

/**
 * Shared "post-auth redirect" brain for server-side redirecters (middleware/auth-actions).
 * Edge-safe: returns data only; no NextResponse, no Supabase, no Node APIs.
 */
export function decidePostAuthRedirect(params: {
  pathname: string;
  returnUrlRaw?: string | null;
  signedOut?: boolean;
  profile: ProfileAccessLike | null;
  fallback: PostAuthFallback;
}): Decision {
  const { pathname, signedOut, profile, fallback } = params;
  const returnUrl = safeReturnUrl(params.returnUrlRaw ?? null);

  const destination = determineDestination(profile, { fallback });

  // Allow access to auth routes when signedOut=true to avoid redirect loops while cookies are clearing
  if (signedOut && (pathname === PATHS.LOGIN || pathname === PATHS.CHOOSE_ROLE)) {
    return { type: "allow" };
  }

  // If we’re on an auth route while signed in, redirect away.
  if (isAuthRoute(pathname)) {
    // Preserve existing behavior: only honor returnUrl once profile is "routable" (role/account_type resolved),
    // otherwise fall back to the destination.
    if (returnUrl && isRoutableProfile(profile) && canAccessTarget(profile, returnUrl)) {
      return { type: "redirect", to: returnUrl };
    }
    return { type: "redirect", to: destination };
  }

  // Root route redirect
  if (pathname === PATHS.HOME) {
    return { type: "redirect", to: destination };
  }

  return { type: "allow" };
}

/**
 * Client-side "after SIGNED_IN" redirect decision for AuthProvider.
 * Returns null when no redirect should happen.
 */
export function decideSignedInClientRedirect(params: {
  pathname: string;
  profile: ProfileAccessLike | null;
}): string | null {
  const { pathname, profile } = params;

  if (isSignedInAllowedPath(pathname)) return null;

  return determineDestination(profile, { fallback: PATHS.CHOOSE_ROLE });
}


