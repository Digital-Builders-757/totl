// AUTO-GENERATED FILE - Database Type Helpers
// This file provides convenient type aliases for database table rows
// Generated from: types/database.ts

import type { Database, Tables, TablesInsert, TablesUpdate } from "./database";

// Table Row Types
export type ProfileRow = Tables<"profiles">;
export type TalentProfileRow = Tables<"talent_profiles">;
export type ClientProfileRow = Tables<"client_profiles">;
export type ApplicationRow = Tables<"applications">;
export type GigRow = Tables<"gigs">;
export type BookingRow = Tables<"bookings">;
export type PortfolioItemRow = Tables<"portfolio_items">;
export type ClientApplicationRow = Tables<"client_applications">;
export type GigRequirementRow = Tables<"gig_requirements">;

// View Row Types
export type AdminTalentDashboardRow = Tables<"admin_talent_dashboard">;
export type AdminBookingsDashboardRow = Tables<"admin_bookings_dashboard">;
export type AdminDashboardCacheRow = Tables<"admin_dashboard_cache">;

// Insert Types
export type ProfileInsert = TablesInsert<"profiles">;
export type TalentProfileInsert = TablesInsert<"talent_profiles">;
export type ClientProfileInsert = TablesInsert<"client_profiles">;
export type ApplicationInsert = TablesInsert<"applications">;
export type GigInsert = TablesInsert<"gigs">;
export type BookingInsert = TablesInsert<"bookings">;
export type PortfolioItemInsert = TablesInsert<"portfolio_items">;

// Update Types
export type ProfileUpdate = TablesUpdate<"profiles">;
export type TalentProfileUpdate = TablesUpdate<"talent_profiles">;
export type ClientProfileUpdate = TablesUpdate<"client_profiles">;
export type ApplicationUpdate = TablesUpdate<"applications">;
export type GigUpdate = TablesUpdate<"gigs">;
export type BookingUpdate = TablesUpdate<"bookings">;
export type PortfolioItemUpdate = TablesUpdate<"portfolio_items">;

// Enum Types
export type ApplicationStatus = Database["public"]["Enums"]["application_status"];
export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type GigStatus = Database["public"]["Enums"]["gig_status"];
export type UserRole = Database["public"]["Enums"]["user_role"];

// Re-export the main Database type
export type { Database } from "./database";
