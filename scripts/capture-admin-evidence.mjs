import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "screenshots", "ui-audit-2026-03-03-v2");
const ROUTES = [
  "/admin/dashboard",
  "/admin/applications",
  "/admin/users",
  "/admin/gigs",
  "/admin/client-applications",
  "/admin/talent",
  "/admin/moderation",
];
const VIEWPORTS = [
  { width: 390, height: 844, label: "390x844" },
  { width: 360, height: 800, label: "360x800" },
  { width: 1440, height: 900, label: "1440x900" },
];

function routeSlug(route) {
  return route.replace(/^\/admin\//, "").replaceAll("/", "-");
}

async function loginAsAdmin(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForFunction(
    () => document.querySelector('[data-testid="login-hydrated"]')?.textContent?.trim() === "ready",
    null,
    { timeout: 60_000 }
  );
  await page.fill('[data-testid="email"]', "admin@totlagency.com");
  await page.fill('[data-testid="password"]', "AdminPassword123!");
  await page.click('[data-testid="login-button"]');
  await page.waitForURL((url) => !/\/login(\?|$)/.test(url.pathname), { timeout: 20_000 });
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();

    await loginAsAdmin(page);

    for (const route of ROUTES) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(1500);
      const filename = `admin__${routeSlug(route)}__${viewport.label}__loaded.png`;
      const outPath = path.join(OUT_DIR, filename);
      await page.screenshot({ path: outPath });
      console.log(`saved ${filename}`);
    }

    await context.close();
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
