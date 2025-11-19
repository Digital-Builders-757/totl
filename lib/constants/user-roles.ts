/**
 * User Role Display Names
 * 
 * Maps database enum values to user-friendly display names.
 * Database enum: 'talent' | 'client' | 'admin'
 * 
 * Note: Database structure uses 'client' but UI displays as 'Career Builder'
 */

export const USER_ROLE_DISPLAY_NAMES = {
  talent: "Talent",
  client: "Career Builder",
  admin: "Admin",
} as const;

export const USER_ROLE_DESCRIPTIONS = {
  talent: "Actors and models who apply to gigs",
  client: "Companies who post gigs and hire talent",
  admin: "TOTL Agency staff who oversee the platform",
} as const;

export type UserRole = keyof typeof USER_ROLE_DISPLAY_NAMES;

/**
 * Get display name for a user role
 */
export function getRoleDisplayName(role: UserRole): string {
  return USER_ROLE_DISPLAY_NAMES[role];
}

/**
 * Get description for a user role
 */
export function getRoleDescription(role: UserRole): string {
  return USER_ROLE_DESCRIPTIONS[role];
}

/**
 * Check if a role is a Career Builder (client)
 */
export function isCareerBuilder(role: string): boolean {
  return role === "client";
}

/**
 * Check if a role is Admin
 */
export function isAdmin(role: string): boolean {
  return role === "admin";
}

/**
 * Check if a role is Talent
 */
export function isTalent(role: string): boolean {
  return role === "talent";
}

