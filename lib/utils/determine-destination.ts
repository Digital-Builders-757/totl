import { PATHS, type PostAuthFallback } from "@/lib/constants/routes";
import type { ProfileAccessLike } from "@/lib/utils/route-access";

// Determines redirect destination - allows default fallback for null profiles.
// Separate from access control to handle routing vs security differently.
export function determineDestination(
  profile: ProfileAccessLike | null,
  opts?: { fallback?: PostAuthFallback }
) {
  const fallback = opts?.fallback ?? PATHS.TALENT_DASHBOARD;

  if (!profile) return fallback;
  if (profile.role === "admin") return PATHS.ADMIN_DASHBOARD;
  // Check both account_type and role for client (handles sync mismatch cases)
  if (profile.account_type === "client" || profile.role === "client") return PATHS.CLIENT_DASHBOARD;
  // Check both account_type and role for talent (handles sync mismatch cases)
  if (profile.account_type === "talent" || profile.role === "talent") return PATHS.TALENT_DASHBOARD;
  return fallback;
}


