/**
 * Canonical column-selection constants for public-ish / auth-critical surfaces.
 *
 * Why this file exists:
 * - Constitution: no wildcard selects (must use explicit columns)
 * - RLS does not protect against over-fetching columns that are readable
 * - These selects are intentionally small and UI-driven
 */

// NOTE: These must remain **string literals** (or `as const` literals), not runtime-built strings.
// Supabase's typed `.select()` parser uses the literal type to infer the row shape; computed strings
// degrade into `GenericStringError` and break type-safety.

export const PROFILE_ROLE_SELECT = "id,role" as const;

export const PROFILE_ROUTING_SELECT = "id,role,account_type,is_suspended" as const;

export const PROFILE_GIG_VIEWER_SELECT = "id,role,subscription_status" as const;

export const GIG_PUBLIC_SELECT =
  "id,client_id,title,description,category,location,compensation,date,image_url,status,created_at" as const;

export const GIG_PUBLIC_WITH_CLIENT_PROFILE_SELECT = `
  id,
  client_id,
  title,
  description,
  category,
  location,
  compensation,
  date,
  image_url,
  status,
  created_at,
  profiles:client_id (
    id,
    display_name,
    role
  )
` as const;


