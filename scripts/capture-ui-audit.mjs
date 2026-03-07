import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "screenshots", "ui-audit-2026-03-03-v2");
const PASSWORD = "Password123!";

const viewports = [
  { width: 390, height: 844, label: "390x844" },
  { width: 360, height: 800, label: "360x800" },
  { width: 1440, height: 900, label: "1440x900" },
];

const roles = [
  {
    role: "admin",
    email: "admin@totlagency.com",
    password: "AdminPassword123!",
    routes: [
      "/admin/dashboard",
      "/admin/gigs",
      "/admin/users",
      "/admin/applications",
      "/admin/client-applications",
      "/admin/talent",
    ],
  },
  {
    role: "client",
    email: "cameron.seed@thetotlagency.local",
    password: PASSWORD,
    routes: [
      "/client/dashboard",
      "/client/gigs",
      "/client/applications",
      "/client/bookings",
      "/client/profile",
    ],
  },
  {
    role: "talent",
    email: "emma.seed@thetotlagency.local",
    password: PASSWORD,
    routes: [
      "/talent/dashboard",
      "/talent/profile",
      "/talent/subscribe",
      "/talent/settings/billing",
    ],
  },
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
    // Accept partial idle if realtime polling/websocket traffic keeps network alive.
  }
  await page.waitForSelector("body", { timeout: 10_000 });
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
      // If hydration marker text is delayed, proceed; submit may still work after fields are available.
    }

    const emailField = page.getByTestId("email");
    const passwordField = page.getByTestId("password");
    await emailField.fill(email);
    await passwordField.fill(password);
    await page.getByTestId("login-button").click({ timeout: 15_000 });
    try {
      await page.waitForURL((url) => !/\/login(\?|$)/.test(url.pathname), { timeout: 25_000 });
    } catch {
      // Some environments complete auth redirect after a delayed bootstrap tick.
      await page.waitForTimeout(12_000);
    }

    if (!/\/login(\?|$)/.test(page.url())) {
      return;
    }

    // Retry once when mobile/hydration timing leaves us on login after submit.
    if (attempt === 1) {
      await page.waitForTimeout(800);
    }
  }
}

async function discoverTalentSlug(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto(`${BASE_URL}/talent`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await ensureLoaded(page);
    const links = await page.locator('a[href^="/talent/"]').evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("href")).filter(Boolean)
    );
    const candidate = links.find((href) => /^\/talent\/(?!dashboard|profile|subscribe|settings)([^/?#]+)$/.test(href));
    return candidate ?? null;
  } catch {
    return null;
  } finally {
    await context.close();
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const manifest = [];

  // Reachability probe
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    let reachable = false;
    let reason = "";
    try {
      const response = await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 120_000 });
      reachable = Boolean(response && response.ok());
      reason = reachable ? "ok" : `HTTP_${response?.status() ?? "unknown"}`;
    } catch (e) {
      reason = e instanceof Error ? e.message : String(e);
    }
    manifest.push({
      filename: "(probe)",
      route: "/",
      viewport: "390x844",
      role: "anonymous",
      status: reachable ? "success" : "fail",
      path: "",
      reason,
    });
    await ctx.close();
  }

  const talentPublicRoute = await discoverTalentSlug(browser);
  if (talentPublicRoute) {
    roles.find((r) => r.role === "talent")?.routes.push(talentPublicRoute);
  }

  for (const roleCfg of roles) {
    for (const vp of viewports) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });
      let loginOk = false;
      let loginReason = "";
      try {
        await login(page, roleCfg.email, roleCfg.password);
        if (/\/login(\?|$)/.test(page.url())) {
          loginReason = "remained_on_login";
        } else {
          loginOk = true;
        }
      } catch (e) {
        loginReason = e instanceof Error ? e.message : String(e);
      }

      if (!loginOk) {
        for (const route of roleCfg.routes) {
          manifest.push({
            filename: `${roleCfg.role}__${routeSlug(route)}__${vp.label}__loaded.png`,
            route,
            viewport: vp.label,
            role: roleCfg.role,
            status: "fail",
            path: "",
            reason: `login_failed:${loginReason}`,
          });
        }
        await context.close();
        continue;
      }

      for (const route of roleCfg.routes) {
        const filename = `${roleCfg.role}__${routeSlug(route)}__${vp.label}__loaded.png`;
        const outputPath = path.join(OUT_DIR, filename);
        try {
          await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
          await ensureLoaded(page);

          if (/\/login(\?|$)/.test(page.url())) {
            manifest.push({
              filename,
              route,
              viewport: vp.label,
              role: roleCfg.role,
              status: "fail",
              path: "",
              reason: "auth_redirect_to_login",
            });
            continue;
          }

          await page.screenshot({ path: outputPath });
          manifest.push({
            filename,
            route,
            viewport: vp.label,
            role: roleCfg.role,
            status: "success",
            path: outputPath,
            reason: "",
          });
        } catch (e) {
          manifest.push({
            filename,
            route,
            viewport: vp.label,
            role: roleCfg.role,
            status: "fail",
            path: "",
            reason: e instanceof Error ? e.message : String(e),
          });
        }
      }

      await context.close();
    }
  }

  await browser.close();

  const manifestPath = path.join(OUT_DIR, "manifest.json");
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  process.stdout.write(`Saved manifest to ${manifestPath}\n`);
  process.stdout.write(`Captured rows: ${manifest.length}\n`);
}

main().catch((err) => {
  process.stderr.write(`${String(err)}\n`);
  process.exitCode = 1;
});
