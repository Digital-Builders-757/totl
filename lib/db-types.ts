import type { Database, Tables } from "@/types/database";

// Re-export for convenience
export type { Database } from "@/types/database";

// Use the generated Tables helper type for cleaner syntax
export type Row<T extends keyof Database["public"]["Tables"]> = Tables<T>;
export type Insert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Update<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// View types using Tables helper
export type ViewRow<T extends keyof Database["public"]["Views"]> = Tables<T>;

// Convenient id types using the generated Database schema
export type ProfileId = Database["public"]["Tables"]["profiles"]["Row"]["id"];
export type TalentId = Database["public"]["Tables"]["talent_profiles"]["Row"]["user_id"];
export type ClientId = Database["public"]["Tables"]["client_profiles"]["Row"]["user_id"];
export type GigId = Database["public"]["Tables"]["gigs"]["Row"]["id"];
export type ApplicationId = Database["public"]["Tables"]["applications"]["Row"]["id"];
export type BookingId = Database["public"]["Tables"]["bookings"]["Row"]["id"];

// Helper types for Supabase query results
export type QueryResult<T> = {
  data: T | null;
  error: Error | null;
};

export type QueryData<T> = T extends QueryResult<infer U> ? U : never;

// Type helpers for safe queries
export type SafeQuery<T> = T extends { data: infer D; error: unknown }
  ? D extends null
    ? never
    : D
  : never;

// Cast user ID to specific table ID type
export function castUserId<T extends keyof Database["public"]["Tables"]>(
  userId: string
): Database["public"]["Tables"][T]["Row"]["id"] {
  return userId as Database["public"]["Tables"][T]["Row"]["id"];
}

// Specific typed row aliases using the generated Tables type
export type ProfileRow = Tables<"profiles">;
export type TalentProfileRow = Tables<"talent_profiles">;
export type ClientProfileRow = Tables<"client_profiles">;
export type GigRow = Tables<"gigs">;
export type ApplicationRow = Tables<"applications">;
export type BookingRow = Tables<"bookings">;
export type PortfolioItemRow = Tables<"portfolio_items">;

// Typed view aliases using the generated Tables type for views
export type AdminTalentDashboardRow = Tables<"admin_talent_dashboard">;
export type AdminBookingsDashboardRow = Tables<"admin_bookings_dashboard">;

// Helper for extracting data from Supabase results
export function extractData<T>(result: { data: T | null; error: unknown }): T | null {
  return result.data;
}
