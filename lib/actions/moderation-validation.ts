
export type ValidationResult = { error?: string; success?: boolean };

export function validateFlagContent(
  resourceId: string | undefined,
  reason: string | undefined
): ValidationResult {
  if (!resourceId) {
    return { error: "Resource and reason are required." };
  }
  if (!reason || !reason.trim()) {
    return { error: "Resource and reason are required." };
  }
  return { success: true };
}

export function validateUserAuth(user: { id: string } | null | undefined, authError: Error | null): ValidationResult {
  if (authError || !user) {
    return { error: "You need to be signed in to report gigs." };
  }
  return { success: true };
}

export function validateAdminAuth(
  user: { id: string } | null | undefined,
  profile: { role?: string } | null | undefined
): ValidationResult {
  if (!user) {
    return { error: "Not authenticated." };
  }
  if (!profile || profile.role !== "admin") {
    return { error: "Not authorized." };
  }
  return { success: true };
}

