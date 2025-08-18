import type { Database } from "@/types/database";

export type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Insert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Update<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// View types
export type ViewRow<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

// Convenient id types
export type ProfileId = Row<"profiles">["id"];
export type TalentId = Row<"talent_profiles">["user_id"];
export type ClientId = Row<"client_profiles">["user_id"];
export type GigId = Row<"gigs">["id"];
export type ApplicationId = Row<"applications">["id"];
export type BookingId = Row<"bookings">["id"];

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

// Specific typed row aliases for common queries
export type ProfileRow = Row<"profiles">;
export type TalentProfileRow = Row<"talent_profiles">;
export type ClientProfileRow = Row<"client_profiles">;
export type GigRow = Row<"gigs">;
export type ApplicationRow = Row<"applications">;
export type BookingRow = Row<"bookings">;
export type PortfolioItemRow = Row<"portfolio_items">;

// Typed view aliases
export type AdminTalentDashboardRow = ViewRow<"admin_talent_dashboard">;
export type AdminBookingsDashboardRow = ViewRow<"admin_bookings_dashboard">;

// Helper for extracting data from Supabase results
export function extractData<T>(result: { data: T | null; error: unknown }): T | null {
  return result.data;
}
