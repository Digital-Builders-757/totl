/**
 * Canonical column selection helpers for Supabase queries
 * Use these to ensure consistent column selection across the app
 */

// Core table selections
export const selectProfile = [
  "id",
  "role",
  "display_name",
  "avatar_url",
  "email_verified",
  "created_at",
  "updated_at",
].join(",");

export const selectTalentProfile = [
  "id",
  "user_id",
  "first_name",
  "last_name",
  "phone",
  "age",
  "location",
  "experience",
  "portfolio_url",
  "height",
  "measurements",
  "hair_color",
  "eye_color",
  "shoe_size",
  "languages",
  "created_at",
  "updated_at",
].join(",");

export const selectClientProfile = [
  "id",
  "user_id",
  "company_name",
  "industry",
  "website",
  "contact_name",
  "contact_email",
  "contact_phone",
  "company_size",
  "created_at",
  "updated_at",
].join(",");

export const selectGig = [
  "id",
  "client_id",
  "title",
  "description",
  "category",
  "location",
  "compensation",
  "duration",
  "date",
  "application_deadline",
  "requirements",
  "status",
  "image_url",
  "created_at",
  "updated_at",
].join(",");

export const selectApplication = [
  "id",
  "gig_id",
  "talent_id",
  "status",
  "message",
  "created_at",
  "updated_at",
].join(",");

export const selectBooking = [
  "id",
  "gig_id",
  "talent_id",
  "status",
  "compensation",
  "notes",
  "created_at",
  "updated_at",
].join(",");

export const selectPortfolioItem = [
  "id",
  "talent_id",
  "title",
  "description",
  "image_url",
  "created_at",
  "updated_at",
].join(",");

// Common joined selections
export const selectGigWithClient = `
  ${selectGig},
  client_profiles!inner(${selectClientProfile})
`;

export const selectApplicationWithGig = `
  ${selectApplication},
  gigs!inner(${selectGig})
`;

export const selectApplicationWithTalent = `
  ${selectApplication},
  talent_profiles!inner(${selectTalentProfile})
`;

export const selectApplicationWithGigAndTalent = `
  ${selectApplication},
  gigs!inner(${selectGig}),
  talent_profiles!inner(${selectTalentProfile})
`;

// Minimal selections for lists
export const selectGigList = [
  "id",
  "title",
  "location",
  "compensation",
  "status",
  "created_at",
].join(",");

export const selectApplicationList = ["id", "gig_id", "talent_id", "status", "created_at"].join(
  ","
);

export const selectTalentList = [
  "id",
  "user_id",
  "first_name",
  "last_name",
  "location",
  "experience",
].join(",");
