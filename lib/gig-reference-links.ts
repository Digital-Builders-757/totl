import { z } from "zod";

import type { Json } from "@/types/database";

/** Values persisted on new saves (matches Career Builder / talent-facing language). */
export const GIG_REFERENCE_LINK_KINDS = ["company", "reel", "social", "portfolio", "press", "other"] as const;

/** Older rows may still carry this; readable for display and mapped when loading the editor. */
const LEGACY_REFERENCE_LINK_KINDS = ["campaign"] as const;

export type GigReferenceLinkKind = (typeof GIG_REFERENCE_LINK_KINDS)[number];

const WRITE_KIND_SET = new Set<string>(GIG_REFERENCE_LINK_KINDS);
const READ_KIND_SET = new Set<string>([...GIG_REFERENCE_LINK_KINDS, ...LEGACY_REFERENCE_LINK_KINDS]);

export type GigReferenceLinkStored = {
  url: string;
  label: string;
  /** Write path uses `GIG_REFERENCE_LINK_KINDS` only; reads may include legacy values (e.g. `campaign`). */
  kind: string;
  sort_order: number;
};

export type GigReferenceLinkFormRow = {
  url: string;
  label: string;
  kind: GigReferenceLinkKind | "";
};

const MAX_LINKS = 15;
const MAX_LABEL = 120;
const MAX_URL = 2048;

const storedLinkSchema = z.object({
  url: z
    .string()
    .min(1)
    .max(MAX_URL)
    .refine((u) => {
      const l = u.toLowerCase();
      return l.startsWith("https://") || l.startsWith("http://");
    }, "URL must start with http:// or https://"),
  label: z.string().min(1).max(MAX_LABEL),
  kind: z.enum(GIG_REFERENCE_LINK_KINDS),
  sort_order: z.number().int().min(0).max(999),
});

const storedLinksArraySchema = z.array(storedLinkSchema).max(MAX_LINKS);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isWritableLinkKind(v: unknown): v is GigReferenceLinkKind {
  return typeof v === "string" && WRITE_KIND_SET.has(v);
}

function isReadableLinkKind(v: unknown): v is string {
  return typeof v === "string" && READ_KIND_SET.has(v);
}

function normalizeKindForForm(kind: string): GigReferenceLinkKind | "" {
  if (isWritableLinkKind(kind)) return kind;
  if (kind === "campaign") return "other";
  return "";
}

/** Normalize DB / unknown JSON into form rows (best-effort for edit surface). */
export function referenceLinksToFormRows(raw: Json | null | undefined): GigReferenceLinkFormRow[] {
  if (raw === null || raw === undefined) return [];
  if (!Array.isArray(raw)) return [];

  type Decorated = { item: Record<string, Json | undefined>; order: number };

  const decorated: Decorated[] = [];
  raw.forEach((entry, idx) => {
    if (!isRecord(entry)) return;
    const obj: Record<string, Json | undefined> = {};
    for (const [k, v] of Object.entries(entry)) {
      obj[k] = v as Json | undefined;
    }
    const orderRaw = obj.sort_order;
    const order =
      typeof orderRaw === "number" && Number.isFinite(orderRaw) ? orderRaw : idx;
    decorated.push({ item: obj, order });
  });

  decorated.sort((a, b) => a.order - b.order);

  const out: GigReferenceLinkFormRow[] = [];
  for (const { item } of decorated) {
    const url = typeof item.url === "string" ? item.url : "";
    const label = typeof item.label === "string" ? item.label : "";
    const kindRaw = typeof item.kind === "string" ? item.kind : "";
    const kind = kindRaw ? normalizeKindForForm(kindRaw) : "";
    out.push({ url, label, kind });
  }
  return out;
}

function normalizeUrl(url: string): string {
  return url.trim();
}

/** Server-side: validate form rows and produce JSON for `gigs.reference_links`. */
export function parseReferenceLinksForDatabase(
  rows: GigReferenceLinkFormRow[]
): { ok: true; data: GigReferenceLinkStored[] } | { ok: false; error: string } {
  const nonEmpty = rows
    .map((r) => ({
      url: normalizeUrl(r.url),
      label: r.label.trim(),
      kind: r.kind,
    }))
    .filter((r) => r.url.length > 0 || r.label.length > 0 || r.kind !== "");

  if (nonEmpty.length === 0) {
    return { ok: true, data: [] };
  }

  const built: GigReferenceLinkStored[] = [];
  for (let i = 0; i < nonEmpty.length; i++) {
    const r = nonEmpty[i];
    if (!r.kind || !isWritableLinkKind(r.kind)) {
      return { ok: false, error: "Each reference link needs a type (company site, reel, social, etc.)." };
    }
    if (!r.label) {
      return { ok: false, error: "Each reference link needs a short label." };
    }
    if (r.label.length > MAX_LABEL) {
      return { ok: false, error: `Labels must be at most ${MAX_LABEL} characters.` };
    }
    if (!r.url) {
      return { ok: false, error: "Each reference link needs a URL." };
    }
    if (r.url.length > MAX_URL) {
      return { ok: false, error: `URLs must be at most ${MAX_URL} characters.` };
    }
    const lower = r.url.toLowerCase();
    if (!lower.startsWith("https://") && !lower.startsWith("http://")) {
      return { ok: false, error: "Links must start with http:// or https://." };
    }

    built.push({
      url: r.url,
      label: r.label,
      kind: r.kind,
      sort_order: i,
    });
  }

  if (built.length > MAX_LINKS) {
    return { ok: false, error: `You can add at most ${MAX_LINKS} reference links.` };
  }

  const zod = storedLinksArraySchema.safeParse(built);
  if (!zod.success) {
    const first = zod.error.errors[0];
    const msg = first ? `${first.path.join(".")}: ${first.message}` : "Invalid reference links.";
    return { ok: false, error: msg };
  }

  return { ok: true, data: zod.data };
}

export function isSafeHttpUrlForDisplay(url: string): boolean {
  const t = url.trim().toLowerCase();
  return t.startsWith("https://") || t.startsWith("http://");
}

const kindLabel: Record<GigReferenceLinkKind, string> = {
  company: "Company / website",
  reel: "Reel",
  social: "Social",
  portfolio: "Body of work",
  press: "Press",
  other: "Other",
};

const legacyKindLabel: Record<string, string> = {
  campaign: "Campaign",
};

export function referenceLinkKindLabel(kind: string): string {
  if (isWritableLinkKind(kind)) return kindLabel[kind];
  return legacyKindLabel[kind] ?? kind;
}

/** Read-only surfaces: coerce DB JSON into sorted links, skipping invalid entries. */
export function parseStoredReferenceLinksForDisplay(raw: Json | null | undefined): GigReferenceLinkStored[] {
  if (raw === null || raw === undefined) return [];
  if (!Array.isArray(raw)) return [];

  const out: GigReferenceLinkStored[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const url = typeof item.url === "string" ? item.url.trim() : "";
    const label = typeof item.label === "string" ? item.label.trim() : "";
    const kind = item.kind;
    const sort_order =
      typeof item.sort_order === "number" && Number.isFinite(item.sort_order) ? item.sort_order : out.length;
    if (!url || !label || !isReadableLinkKind(kind)) continue;
    if (!isSafeHttpUrlForDisplay(url)) continue;
    out.push({ url, label, kind, sort_order });
  }
  return out.sort((a, b) => a.sort_order - b.sort_order);
}
