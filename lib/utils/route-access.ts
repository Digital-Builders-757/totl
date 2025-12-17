import { PATHS, PREFIXES } from "@/lib/constants/routes";

export type AccountType = "unassigned" | "talent" | "client";

// Minimal shape used across middleware/server-actions/client to avoid drift.
// Keep this intentionally small: routing needs only role/account_type.
export type ProfileAccessLike =
  | {
      role: string | null;
      account_type: AccountType | null;
    }
  | null;

// Helper functions to check access - fail-safe: deny access if profile is null
export function hasTalentAccess(profile: ProfileAccessLike): boolean {
  if (!profile) return false;
  return profile.account_type === "talent" || profile.role === "talent";
}

export function hasClientAccess(profile: ProfileAccessLike): boolean {
  if (!profile) return false;
  // Check both account_type and role for consistency with hasTalentAccess
  // This handles sync mismatch cases where role is set but account_type is unassigned
  return profile.account_type === "client" || profile.role === "client";
}

export function needsClientAccess(path: string) {
  return (
    path.startsWith(PREFIXES.CLIENT) &&
    path !== PATHS.CLIENT_APPLY &&
    path !== PATHS.CLIENT_APPLY_SUCCESS &&
    path !== PATHS.CLIENT_APPLICATION_STATUS &&
    path !== PATHS.CLIENT_SIGNUP
  );
}

export function needsTalentAccess(path: string) {
  if (path === PATHS.TALENT_LANDING) return false;

  // Public: /talent/[slug] (public profiles) should remain accessible while signed out.
  // Private: dashboard + profile editor + settings + subscribe flow.
  const privateTalentPrefixes = [
    PATHS.TALENT_DASHBOARD,
    PATHS.TALENT_PROFILE,
    PREFIXES.TALENT_SETTINGS,
    PATHS.TALENT_SUBSCRIBE,
  ] as const;

  return privateTalentPrefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

export function needsAdminAccess(path: string) {
  return path.startsWith(PREFIXES.ADMIN);
}


