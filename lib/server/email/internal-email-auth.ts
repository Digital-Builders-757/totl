import "server-only";

import { NextResponse } from "next/server";

export const INTERNAL_EMAIL_HEADER = "x-totl-internal-email-key";

export function getInternalEmailKey() {
  const configured = process.env.INTERNAL_EMAIL_API_KEY;
  if (configured) return configured;

  // In production (including most hosted previews), require explicit configuration.
  if (process.env.NODE_ENV === "production") return null;

  // In non-production, allow a stable default ONLY for local development.
  // If this is a hosted preview environment (or a non-local site URL), do not use a guessable default.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const looksRemote = Boolean(siteUrl) && !/(localhost|127\.0\.0\.1)/i.test(siteUrl);
  const isHostedPreview = Boolean(
    process.env.VERCEL ||
      process.env.NETLIFY ||
      process.env.RENDER ||
      process.env.FLY_APP_NAME ||
      process.env.RAILWAY_ENVIRONMENT
  );

  if (looksRemote || isHostedPreview) return null;

  return "dev-internal-email-key";
}

export function requireInternalEmailRequest(request: Request) {
  const expected = getInternalEmailKey();
  const provided = request.headers.get(INTERNAL_EMAIL_HEADER);

  if (!expected || !provided || provided !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

