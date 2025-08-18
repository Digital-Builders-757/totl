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
