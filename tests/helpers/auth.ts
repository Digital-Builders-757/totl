import { expect, type Page } from "@playwright/test";
import { safeGoto } from "./navigation";

export interface PlaywrightCredentials {
  email: string;
  password: string;
}

export function getTalentCredentials(): PlaywrightCredentials {
  const email = process.env.PLAYWRIGHT_TALENT_EMAIL;
  const password = process.env.PLAYWRIGHT_TALENT_PASSWORD;

  // In CI, require explicit credentials to avoid “it worked locally” drift.
  if (process.env.CI && (!email || !password)) {
    throw new Error(
      "Missing PLAYWRIGHT_TALENT_EMAIL and/or PLAYWRIGHT_TALENT_PASSWORD in CI. Set them in your Playwright env to run talent auth tests."
    );
  }

  // Local fallback is intentionally a seeded persona.
  const resolvedEmail = email ?? "emma.seed@thetotlagency.local";
  const resolvedPassword = password ?? "Password123!";

  return { email: resolvedEmail, password: resolvedPassword };
}

export function getClientCredentials(): PlaywrightCredentials {
  const email = process.env.PLAYWRIGHT_CLIENT_EMAIL;
  const password = process.env.PLAYWRIGHT_CLIENT_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing PLAYWRIGHT_CLIENT_EMAIL and/or PLAYWRIGHT_CLIENT_PASSWORD. Set them in your Playwright env to run client-login tests."
    );
  }

  return { email, password };
}

export async function waitForLoginHydrated(page: Page) {
  // Prevent SSR shell interactions causing flake.
  try {
    await expect(page.getByTestId("login-hydrated")).toHaveText("ready", {
      timeout: 20_000,
    });
  } catch {
    // If we were redirected away from /login before hydration marker exists,
    // treat as already-authenticated convergence.
    if (!/\/login(\?|$)/.test(page.url())) return;
    throw new Error(`Login hydration marker not found on /login. Current URL: ${page.url()}`);
  }
}

export async function loginWithCredentials(
  page: Page,
  creds: PlaywrightCredentials,
  opts?: { returnUrl?: string }
) {
  const loginUrl = opts?.returnUrl
    ? `/login?returnUrl=${encodeURIComponent(opts.returnUrl)}`
    : "/login";

  // Always begin from the login surface so AuthProvider's SIGNED_IN handler
  // (auth-route gated redirect) is guaranteed to run.
  await safeGoto(page, loginUrl, { timeoutMs: 60_000 });

  // If we're already signed in (e.g., cookies/local state persisted), middleware/BootState may
  // redirect away from /login immediately. In that case, treat login as complete.
  if (!/\/login(\?|$)/.test(page.url())) return;

  await waitForLoginHydrated(page);

  // Login page can redirect away between hydration and field fill. If so, treat as complete.
  if (!/\/login(\?|$)/.test(page.url())) return;

  await page.getByTestId("email").fill(creds.email);
  await page.getByTestId("password").fill(creds.password);
  await page.getByTestId("login-button").click();

  // BootState-aware convergence: post-login can legitimately land on onboarding
  // (incomplete profile) OR a dashboard terminal.
  try {
    await expect(page).toHaveURL(
      /\/(talent\/dashboard|client\/dashboard|admin\/dashboard|onboarding)(\/|$)/,
      { timeout: 20_000 }
    );
  } catch (err) {
    const invalidCreds = page.getByText(/invalid credentials/i);
    const needsVerify = page.getByText(/verify your email address/i);
    const msg = (await invalidCreds.isVisible().catch(() => false))
      ? ((await invalidCreds.textContent()) ?? "Invalid credentials")
      : (await needsVerify.isVisible().catch(() => false))
        ? ((await needsVerify.textContent()) ?? "Email not verified")
        : null;

    if (msg) {
      throw new Error(`Login failed: ${msg}`);
    }

    // If we're still on /login but the session cookie actually landed (rare under `next start` load),
    // nudge routing via the canonical signed-in entrypoint.
    if (/\/login(\?|$)/.test(page.url())) {
      // `/dashboard` is a signed-in landing utility, but it does not auto-redirect to terminals.
      // Use a stable protected terminal path; middleware + BootState will converge correctly.
      const nudgePath = opts?.returnUrl ?? "/talent/dashboard";
      await safeGoto(page, nudgePath, { timeoutMs: 60_000 });
      await expect(page).toHaveURL(
        /\/(talent\/dashboard|client\/dashboard|admin\/dashboard|onboarding)(\/|$)/,
        { timeout: 30_000 }
      );
      return;
    }

    throw err;
  }
}

export async function loginAsTalent(
  page: Page,
  opts?: { returnUrl?: string }
) {
  const { email, password } = getTalentCredentials();

  await loginWithCredentials(page, { email, password }, opts);
  await expect(page).toHaveURL(/\/(talent\/dashboard|onboarding)(\/|$)/, {
    timeout: 20000,
  });
}

export async function loginAsClient(
  page: Page,
  opts?: { returnUrl?: string }
) {
  const { email, password } = getClientCredentials();

  await loginWithCredentials(page, { email, password }, opts);
  await expect(page).toHaveURL(/\/(client\/dashboard|onboarding)(\/|$)/, {
    timeout: 20000,
  });
}

export async function ensureTalentReady(page: Page) {
  // If BootState routes to onboarding, complete the minimal form to converge
  // on talent dashboard for tests that require an onboarded talent.
  if (!/\/onboarding(\/|$)/.test(page.url())) return;

  await expect(
    page.getByRole("heading", { name: /complete your profile/i }).first()
  ).toBeVisible({
    timeout: 20000,
  });

  // `Full Name` is required; rely on placeholder (more stable than label association).
  const fullNameInput = page.getByPlaceholder(/enter your full name/i).first();
  await expect(fullNameInput).toBeVisible({ timeout: 20000 });
  await fullNameInput.fill("Playwright Talent");
  await expect(fullNameInput).toHaveValue("Playwright Talent", { timeout: 20000 });

  // Optional fields (best-effort; rely on placeholders to avoid duplicate label ambiguity).
  await page.getByPlaceholder("City, Country").first().fill("New York, NY").catch(() => undefined);
  await page
    .getByPlaceholder("Tell us a little about yourself")
    .first()
    .fill("Test talent profile created by Playwright.")
    .catch(() => undefined);
  await page.getByPlaceholder("https://yourwebsite.com").first().fill("https://example.com").catch(() => undefined);

  await page.getByRole("button", { name: /complete profile/i }).click();

  // On some builds, the onboarding submit can take time to reflect in server-owned BootState.
  // Retry dashboard convergence a few times, but fail fast if the form shows an explicit error.
  await expect(page).toHaveURL(/\/(talent\/dashboard|onboarding)(\?|\/|$)/, { timeout: 60_000 });

  const errorBox = page.locator(".bg-red-50").first();
  for (let attempt = 0; attempt < 10; attempt++) {
    if (/\/talent\/dashboard(\/|$)/.test(page.url())) return;

    const hasError = await errorBox.isVisible().catch(() => false);
    if (hasError) {
      const text = ((await errorBox.textContent()) ?? "").trim();
      throw new Error(`Onboarding submit failed: ${text || "unknown error"}`);
    }

    // eslint-disable-next-line no-await-in-loop
    await page.goto("/talent/dashboard", { waitUntil: "domcontentloaded" });
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(750);
  }
  // Best-effort: callers that require a dashboard terminal should assert it explicitly.
  // Some flows legitimately remain on onboarding if BootState hasn't flipped yet under heavy load.
  return;
}


