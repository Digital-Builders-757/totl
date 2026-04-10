import { describe, expect, it } from "vitest";

import {
  type GigReferenceLinkFormRow,
  parseReferenceLinksForDatabase,
  parseStoredReferenceLinksForDisplay,
  referenceLinksToFormRows,
} from "./gig-reference-links";

describe("parseReferenceLinksForDatabase", () => {
  it("accepts empty input", () => {
    const r = parseReferenceLinksForDatabase([]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it("rejects non-http(s) URL", () => {
    const r = parseReferenceLinksForDatabase([
      { url: "javascript:alert(1)", label: "x", kind: "reel" },
    ]);
    expect(r.ok).toBe(false);
  });

  it("normalizes order indices", () => {
    const r = parseReferenceLinksForDatabase([
      { url: "https://a.example", label: "A", kind: "reel" },
      { url: "https://b.example", label: "B", kind: "social" },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data[0].sort_order).toBe(0);
      expect(r.data[1].sort_order).toBe(1);
    }
  });

  it("rejects legacy campaign kind on write", () => {
    const r = parseReferenceLinksForDatabase([
      { url: "https://x.example", label: "X", kind: "campaign" as GigReferenceLinkFormRow["kind"] },
    ]);
    expect(r.ok).toBe(false);
  });
});

describe("referenceLinksToFormRows", () => {
  it("sorts by sort_order", () => {
    const rows = referenceLinksToFormRows([
      { url: "https://second.test", label: "2", kind: "reel", sort_order: 1 },
      { url: "https://first.test", label: "1", kind: "reel", sort_order: 0 },
    ]);
    expect(rows.map((r) => r.label)).toEqual(["1", "2"]);
  });

  it("maps legacy campaign to other in the editor", () => {
    const rows = referenceLinksToFormRows([
      { url: "https://x.test", label: "X", kind: "campaign", sort_order: 0 },
    ]);
    expect(rows[0].kind).toBe("other");
  });
});

describe("parseStoredReferenceLinksForDisplay", () => {
  it("filters bad URLs", () => {
    const out = parseStoredReferenceLinksForDisplay([
      { url: "https://ok.test/", label: "ok", kind: "reel", sort_order: 0 },
      { url: "javascript:bad", label: "bad", kind: "reel", sort_order: 1 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].url).toBe("https://ok.test/");
  });

  it("still shows legacy campaign rows from DB", () => {
    const out = parseStoredReferenceLinksForDisplay([
      { url: "https://legacy.test/", label: "Old", kind: "campaign", sort_order: 0 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("campaign");
  });
});
