import { describe, expect, it } from "vitest";

import {
  categoryForOpportunitySelect,
  selectValueFromCategory,
  validateAdminCreateGigFields,
  validateClientOpportunityRequired,
} from "./opportunity-form-helpers";

describe("categoryForOpportunitySelect", () => {
  it('maps "other" to "others"', () => {
    expect(categoryForOpportunitySelect("other")).toBe("others");
  });

  it("maps legacy editorial to a visible category", () => {
    expect(categoryForOpportunitySelect("editorial")).toBe("modeling");
  });

  it("handles empty input", () => {
    expect(categoryForOpportunitySelect("")).toBe("others");
    expect(categoryForOpportunitySelect(null)).toBe("others");
  });
});

describe("selectValueFromCategory", () => {
  it("returns undefined for empty string", () => {
    expect(selectValueFromCategory("")).toBeUndefined();
    expect(selectValueFromCategory("   ")).toBeUndefined();
  });

  it("returns undefined for non-visible canonical other", () => {
    expect(selectValueFromCategory("other")).toBeUndefined();
  });

  it("returns the value when visible", () => {
    expect(selectValueFromCategory("modeling")).toBe("modeling");
    expect(selectValueFromCategory("others")).toBe("others");
  });
});

describe("validateClientOpportunityRequired", () => {
  const valid = {
    title: "T",
    description: "D",
    category: "modeling",
    location: "NYC",
    duration: "1 day",
    compensation: "$100",
    date: "2026-01-01",
  };

  it("accepts a complete payload", () => {
    const r = validateClientOpportunityRequired(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.title).toBe("T");
      expect(r.data.category).toBe("modeling");
    }
  });

  it("rejects missing category with targeted message", () => {
    const r = validateClientOpportunityRequired({ ...valid, category: "  " });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.missingFields).toContain("category");
      expect(r.message).toContain("opportunity type");
    }
  });

  it("rejects invalid category value", () => {
    const r = validateClientOpportunityRequired({ ...valid, category: "not-a-real-category" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.missingFields).toContain("category");
    }
  });
});

describe("validateAdminCreateGigFields", () => {
  it("accepts visible category", () => {
    const r = validateAdminCreateGigFields({
      title: "T",
      description: "D",
      category: "modeling",
      location: "NYC",
    });
    expect(r.ok).toBe(true);
  });

  it("rejects other as invalid for admin dropdown", () => {
    const r = validateAdminCreateGigFields({
      title: "T",
      description: "D",
      category: "other",
      location: "NYC",
    });
    expect(r.ok).toBe(false);
  });
});
