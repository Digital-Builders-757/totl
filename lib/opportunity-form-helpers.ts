import {
  normalizeGigCategory,
  VISIBLE_GIG_CATEGORIES,
} from "@/lib/constants/gig-categories";

const VISIBLE_SET = new Set<string>(VISIBLE_GIG_CATEGORIES);

/**
 * Maps a DB or raw category string to a value that exists in the opportunity type dropdown.
 * Canonical `"other"` is not in the visible list; it maps to `"others"`.
 */
export function categoryForOpportunitySelect(raw: string | null | undefined): string {
  const n = normalizeGigCategory(raw);
  const v = n === "other" ? "others" : n;
  if (VISIBLE_SET.has(v)) return v;
  return "others";
}

/**
 * Radix Select: use `undefined` when nothing is selected, never `""`.
 * Only returns a value when it matches a visible category (avoids runtime errors).
 */
export function selectValueFromCategory(category: string): string | undefined {
  const t = category.trim();
  if (!t) return undefined;
  if (VISIBLE_SET.has(t)) return t;
  return undefined;
}

export type ClientOpportunityTrimmedFields = {
  title: string;
  description: string;
  category: string;
  location: string;
  duration: string;
  compensation: string;
  date: string;
};

export function trimClientOpportunityFields(input: {
  title: string;
  description: string;
  category: string;
  location: string;
  duration: string;
  compensation: string;
  date: string;
}): ClientOpportunityTrimmedFields {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    location: input.location.trim(),
    duration: input.duration.trim(),
    compensation: input.compensation.trim(),
    date: input.date.trim(),
  };
}

const FIELD_LABELS: Record<string, string> = {
  title: "Opportunity title",
  description: "Description",
  category: "Opportunity type",
  location: "Location",
  duration: "Duration",
  compensation: "Compensation",
  date: "Production date",
};

/**
 * Validates Career Builder / shared post-gig required fields (create + edit payloads).
 */
export function validateClientOpportunityRequired(input: {
  title: string;
  description: string;
  category: string;
  location: string;
  duration: string;
  compensation: string;
  date: string;
}):
  | { ok: true; data: ClientOpportunityTrimmedFields }
  | { ok: false; missingFields: string[]; message: string } {
  const data = trimClientOpportunityFields(input);
  const missingFields: string[] = [];
  if (!data.title) missingFields.push("title");
  if (!data.description) missingFields.push("description");
  if (!data.category) missingFields.push("category");
  if (!data.location) missingFields.push("location");
  if (!data.duration) missingFields.push("duration");
  if (!data.compensation) missingFields.push("compensation");
  if (!data.date) missingFields.push("date");

  if (missingFields.length > 0) {
    const message =
      missingFields.includes("category") && missingFields.length === 1
        ? "Please choose an opportunity type."
        : missingFields.includes("category")
          ? "Please choose an opportunity type and complete the other required fields."
          : `Please fill in: ${missingFields.map((k) => FIELD_LABELS[k] ?? k).join(", ")}.`;
    return { ok: false, missingFields, message };
  }

  if (!VISIBLE_SET.has(data.category)) {
    return {
      ok: false,
      missingFields: ["category"],
      message: "Please choose a valid opportunity type.",
    };
  }

  return { ok: true, data };
}

export function fieldErrorsFromMissing(missingFields: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of missingFields) {
    out[key] = "This field is required.";
  }
  return out;
}

export type AdminCreateGigTrimmedFields = {
  title: string;
  description: string;
  category: string;
  location: string;
};

/** Admin `/admin/gigs/create` form: required marketing fields only (compensation/duration differ from Career Builder). */
export function validateAdminCreateGigFields(input: {
  title: string;
  description: string;
  category: string;
  location: string;
}):
  | { ok: true; data: AdminCreateGigTrimmedFields }
  | { ok: false; missingFields: string[]; message: string } {
  const data: AdminCreateGigTrimmedFields = {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    location: input.location.trim(),
  };
  const missingFields: string[] = [];
  if (!data.title) missingFields.push("title");
  if (!data.description) missingFields.push("description");
  if (!data.category) missingFields.push("category");
  if (!data.location) missingFields.push("location");

  if (missingFields.length > 0) {
    return {
      ok: false,
      missingFields,
      message: "Please fill in all required fields.",
    };
  }

  if (!VISIBLE_SET.has(data.category)) {
    return {
      ok: false,
      missingFields: ["category"],
      message: "Please choose a valid opportunity type.",
    };
  }

  return { ok: true, data };
}
