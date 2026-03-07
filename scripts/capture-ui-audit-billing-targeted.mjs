import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "screenshots", "ui-audit-2026-03-03-v2");

const VIEWPORTS = [
  { width: 390, height: 844, label: "390x844" },
  { width: 360, height: 800, label: "360x800" },
  { width: 1440, height: 900, label: "1440x900" },
];

function routeSlug(route) {
  const parts = route.replace(/^\//, "").split("/").filter(Boolean);
  if (parts.length > 1 && ["admin", "client", "talent"].includes(parts[0])) {
    return parts.slice(1).join("-");
  }
  return parts.join("-");
}

async function ensureLoaded(page) {
  await page.waitForLoadState("domcontentloaded", { timeout: 20_000 });
  await page.waitForTimeout(900);
  try {
    await page.waitForLoadState("networkidle", { timeout: 8000 });
  } catch {
    // Keep moving if live polling prevents networkidle.
  }
}

async function login(page, email, password) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await ensureLoaded(page);

    if (!/\/login(\?|$)/.test(page.url())) return;

    const hydrated = page.getByTestId("login-hydrated");
    await hydrated.waitFor({ state: "attached", timeout: 60_000 });
    try {
      await page.waitForFunction(
        () => document.querySelector('[data-testid="login-hydrated"]')?.textContent?.trim() === "ready",
        null,
        { timeout: 60_000 }
      );
    } catch {
      // Continue submit attempt if marker text is delayed.
    }

    await page.getByTestId("email").fill(email);
    await page.getByTestId("password").fill(password);
    await page.getByTestId("login-button").click({ timeout: 15_000 });
    try {
      await page.waitForURL((url) => !/\/login(\?|$)/.test(url.pathname), { timeout: 25_000 });
    } catch {
      await page.waitForTimeout(12_000);
    }

    if (!/\/login(\?|$)/.test(page.url())) return;

    if (attempt === 1) {
      await page.waitForTimeout(800);
    }
  }

  throw new Error("remained_on_login_after_retries");
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const manifest = [];
  const route = "/talent/settings/billing";

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();

    const filename = `talent__${routeSlug(route)}__${viewport.label}__loaded.png`;
    const outPath = path.join(OUT_DIR, filename);

    try {
      await login(page, "emma.seed@thetotlagency.local", "Password123!");
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await ensureLoaded(page);
      await page.screenshot({ path: outPath });
      manifest.push({
        filename,
        route,
        role: "talent",
        viewport: viewport.label,
        status: "success",
        path: outPath,
      });
      process.stdout.write(`saved ${filename}\n`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      manifest.push({
        filename,
        route,
        role: "talent",
        viewport: viewport.label,
        status: "fail",
        path: "",
        reason,
      });
      process.stdout.write(`failed ${filename}: ${reason}\n`);
    } finally {
      await context.close();
    }
  }

  await browser.close();

  const manifestPath = path.join(OUT_DIR, "manifest-billing-targeted.json");
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  process.stdout.write(`Saved manifest to ${manifestPath}\n`);
  process.stdout.write(`Captured rows: ${manifest.length}\n`);
}

main().catch((error) => {
  process.stderr.write(`${String(error)}\n`);
  process.exitCode = 1;
});
