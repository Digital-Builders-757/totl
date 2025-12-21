import type { Page } from "@playwright/test";

interface SafeGotoOptions {
  timeoutMs?: number;
}

/**
 * Safe navigation helper for local Next builds where the first request can
 * transiently fail (e.g., compilation / cold start / connection reset).
 *
 * Avoids `networkidle` and keeps behavior consistent across specs.
 */
export async function safeGoto(page: Page, url: string, opts?: SafeGotoOptions) {
  const timeoutMs = opts?.timeoutMs ?? 60_000;

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  } catch {
    // Retry once (common on Windows + cold server start).
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  }
}


