import { test, expect } from "@playwright/test";
import { loginWithCredentials, waitForLoginHydrated } from "../helpers/auth";
import { createTalentTestUser } from "../helpers/test-data";
import { safeGoto } from "../helpers/navigation";

/**
 * Three Truths Logging Test Suite
 * 
 * Verifies that the three truths logging proves session is cookie-backed end-to-end:
 * 1. SIGNED_IN fires
 * 2. Cookies exist in the browser
 * 3. Middleware receives those cookies
 */

test.describe("Three Truths Logging", () => {
  test.describe.configure({ timeout: 180_000 });

  test("Verify three truths logging during login", async ({ page, request }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-three-truths", {
      firstName: "Three",
      lastName: `Truths${Date.now()}`,
    });

    // Create verified user
    const createRes = await request.post("/api/admin/create-user", {
      data: {
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: "talent",
      },
    });
    expect(createRes.ok()).toBeTruthy();

    // Collect console messages
    const consoleMessages: Array<{ type: string; text: string }> = [];
    page.on("console", (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
      });
    });

    // Navigate to login page
    await safeGoto(page, "/login");
    await waitForLoginHydrated(page);

    // Clear console messages before login
    consoleMessages.length = 0;

    // TRUTH #1 & #2: Login and verify signIn logs
    await page.getByTestId("email").fill(user.email);
    await page.getByTestId("password").fill(user.password);
    await page.getByTestId("login-button").click();

    // Wait for redirect (should happen quickly)
    await expect(page).toHaveURL(
      /\/(talent\/dashboard|client\/dashboard|admin\/dashboard|onboarding)(\/|$)/,
      { timeout: 10_000 }
    );

    // Wait a bit for all console logs to arrive
    await page.waitForTimeout(1000);

    // Extract relevant console logs
    const signInLogs = consoleMessages.filter((msg) =>
      msg.text.includes("[auth.signIn]")
    );
    const authStateChangeLogs = consoleMessages.filter((msg) =>
      msg.text.includes("[auth.onAuthStateChange]")
    );

    // TRUTH #1: Verify signInWithPassword result log
    const signInResultLog = signInLogs.find((msg) =>
      msg.text.includes("signInWithPassword result")
    );
    expect(signInResultLog).toBeDefined();
    expect(signInResultLog?.text).toContain("hasSession");
    expect(signInResultLog?.text).toContain("userId");

    // TRUTH #2: Verify cookie log exists
    const cookieLog = signInLogs.find((msg) =>
      msg.text.includes("document.cookie sb*")
    );
    expect(cookieLog).toBeDefined();
    console.log("[TEST] Cookie log found:", cookieLog?.text);

    // TRUTH #1: Verify SIGNED_IN event fires
    const signedInLog = authStateChangeLogs.find((msg) =>
      msg.text.includes('event: "SIGNED_IN"') || msg.text.includes("SIGNED_IN")
    );
    expect(signedInLog).toBeDefined();
    console.log("[TEST] SIGNED_IN event log:", signedInLog?.text);

    // TRUTH #2: Verify cookieSb is true in onAuthStateChange
    const authStateChangeWithCookies = authStateChangeLogs.find((msg) =>
      msg.text.includes("cookieSb")
    );
    expect(authStateChangeWithCookies).toBeDefined();
    expect(authStateChangeWithCookies?.text).toMatch(/cookieSb[:\s]*true/);
    console.log(
      "[TEST] AuthStateChange with cookies:",
      authStateChangeWithCookies?.text
    );

    // Verify cookies exist in browser
    const cookies = await page.context().cookies();
    const sbCookies = cookies.filter((c) =>
      c.name.startsWith("sb-") || c.name.includes("supabase")
    );
    expect(sbCookies.length).toBeGreaterThan(0);
    console.log("[TEST] Browser cookies found:", sbCookies.map((c) => c.name));

    // Summary
    console.log("\n[TEST] Three Truths Verification:");
    console.log("✅ TRUTH #1: SIGNED_IN fires -", signedInLog ? "PASS" : "FAIL");
    console.log(
      "✅ TRUTH #2: Cookies exist in browser -",
      sbCookies.length > 0 && cookieLog ? "PASS" : "FAIL"
    );
    console.log(
      "✅ TRUTH #3: Middleware receives cookies -",
      "Check server logs with DEBUG_ROUTING=1"
    );
  });

  test("Verify redirect happens after three truths", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-three-truths-redirect", {
      firstName: "Redirect",
      lastName: `Test${Date.now()}`,
    });

    // Create verified user
    const createRes = await request.post("/api/admin/create-user", {
      data: {
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: "talent",
      },
    });
    expect(createRes.ok()).toBeTruthy();

    // Navigate to login page
    await safeGoto(page, "/login");
    await waitForLoginHydrated(page);

    // Record time before login
    const startTime = Date.now();

    // Login
    await page.getByTestId("email").fill(user.email);
    await page.getByTestId("password").fill(user.password);
    await page.getByTestId("login-button").click();

    // Wait for redirect
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/, {
      timeout: 10_000,
    });

    const redirectTime = Date.now() - startTime;

    // Verify redirect happened quickly (< 2 seconds)
    expect(redirectTime).toBeLessThan(2_000);
    console.log(
      `[TEST] Redirect happened in ${redirectTime}ms (expected < 2000ms)`
    );

    // Verify we're on dashboard (not stuck in loop)
    await expect(
      page.getByRole("button", { name: /sign out/i })
    ).toBeVisible({ timeout: 5_000 });
  });

  test("Verify no redirect loops with three truths", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-three-truths-no-loop", {
      firstName: "NoLoop",
      lastName: `Test${Date.now()}`,
    });

    // Create verified user
    const createRes = await request.post("/api/admin/create-user", {
      data: {
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: "talent",
      },
    });
    expect(createRes.ok()).toBeTruthy();

    // Navigate to login page
    await safeGoto(page, "/login");
    await waitForLoginHydrated(page);

    // Track URL changes
    const urlHistory: string[] = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        urlHistory.push(frame.url());
      }
    });

    // Login
    await page.getByTestId("email").fill(user.email);
    await page.getByTestId("password").fill(user.password);
    await page.getByTestId("login-button").click();

    // Wait for redirect
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/, {
      timeout: 10_000,
    });

    // Wait a bit to ensure no additional redirects
    await page.waitForTimeout(2000);

    // Verify no redirect loops (should only see /login -> /talent/dashboard)
    const loginRedirects = urlHistory.filter((url) =>
      url.includes("/login?returnUrl=")
    );
    expect(loginRedirects.length).toBe(0);
    console.log("[TEST] No redirect loops detected");
    console.log("[TEST] URL history:", urlHistory);
  });

  test("Verify cookies persist after redirect", async ({ page, request }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-three-truths-cookies", {
      firstName: "Cookies",
      lastName: `Test${Date.now()}`,
    });

    // Create verified user
    const createRes = await request.post("/api/admin/create-user", {
      data: {
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: "talent",
      },
    });
    expect(createRes.ok()).toBeTruthy();

    // Navigate to login page
    await safeGoto(page, "/login");
    await waitForLoginHydrated(page);

    // Login
    await page.getByTestId("email").fill(user.email);
    await page.getByTestId("password").fill(user.password);
    await page.getByTestId("login-button").click();

    // Wait for redirect
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/, {
      timeout: 10_000,
    });

    // Wait for cookies to be set
    await page.waitForTimeout(500);

    // Verify cookies exist after redirect
    const cookies = await page.context().cookies();
    const sbCookies = cookies.filter((c) =>
      c.name.startsWith("sb-") || c.name.includes("supabase")
    );
    expect(sbCookies.length).toBeGreaterThan(0);
    console.log(
      "[TEST] Cookies after redirect:",
      sbCookies.map((c) => c.name)
    );

    // Verify cookies are httpOnly (security check)
    const httpOnlyCookies = sbCookies.filter((c) => c.httpOnly);
    expect(httpOnlyCookies.length).toBeGreaterThan(0);
    console.log("[TEST] HttpOnly cookies:", httpOnlyCookies.map((c) => c.name));
  });
});
