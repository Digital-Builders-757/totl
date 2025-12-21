import { test, expect } from "@playwright/test";
import { loginWithCredentials } from "../helpers/auth";
import { createSupabaseAdminClientForTests } from "../helpers/supabase-admin";

test("client accepts an application and creates booking", async ({ page }) => {
  test.setTimeout(240_000);

  const timestamp = Date.now();
  // Creating role=client is intentionally gated by the Career Builder approval pipeline.
  // This test proves the end state (client accepts application → booking created) using the approved path.
  const applicantEmail = `pw-booking-client-${timestamp}@example.com`;
  const talentEmail = `pw-booking-talent-${timestamp}@example.com`;
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "TestPassword123!";

  // Test-only admin client for deterministic DB setup and verification.
  const admin = createSupabaseAdminClientForTests();

  // 1) Create users via server admin API (avoids inbox dependencies; aligns with other deterministic specs).
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const ensureAdminRes = await page.request.post(`${baseUrl}/api/admin/create-user`, {
    data: {
      email: "admin@totlagency.com",
      password: "AdminPassword123!",
      firstName: "Admin",
      lastName: "TOTL",
      role: "admin",
    },
  });
  expect(ensureAdminRes.ok()).toBeTruthy();

  // Applicant starts as talent; promotion to client happens via approval pipeline.
  const createTalentRes = await page.request.post(`${baseUrl}/api/admin/create-user`, {
    data: {
      email: applicantEmail,
      password,
      firstName: "Booking",
      lastName: "Client",
      role: "talent",
    },
  });
  expect(createTalentRes.ok()).toBeTruthy();

  // 2) Login as applicant and submit Career Builder application (authenticated).
  await loginWithCredentials(page, { email: applicantEmail, password });
  await page.goto("/client/apply");
  await expect(page.locator("#companyName")).toBeVisible({ timeout: 30_000 });
  await page.fill("#companyName", `PW Booking Company ${timestamp}`);
  await page.fill("#phone", "555-555-5555");
  await page.locator("#industry").click();
  await page.getByRole("option", { name: "Fashion" }).click();
  await page.fill("#businessDescription", "Deterministic booking accept proof company.");
  await page.fill("#needsDescription", "Deterministic booking accept proof needs.");
  await page.getByRole("button", { name: "Submit Application" }).click();
  await expect(page).toHaveURL(/\/client\/apply\/success/, { timeout: 30_000 });

  // 3) Admin approves the Career Builder application.
  await page.context().clearCookies();
  await loginWithCredentials(page, { email: "admin@totlagency.com", password: "AdminPassword123!" });
  await page.goto("/admin/client-applications");
  await expect(page.getByText("Applications", { exact: true })).toBeVisible({ timeout: 30_000 });
  await page.getByPlaceholder("Search by company, name, email, or industry...").fill(applicantEmail);
  const row = page.locator("tr", { hasText: applicantEmail }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.getByRole("button").last().click();
  await page.getByRole("menuitem", { name: "Approve" }).click();
  await expect(page.getByText("Approve Career Builder Application")).toBeVisible({ timeout: 20_000 });
  await page.fill("#approve-notes", "Approved for booking accept proof");
  await page.getByRole("button", { name: "Approve & Send Email" }).click();
  await expect(page.getByText("Application Approved")).toBeVisible({ timeout: 20_000 });

  // 4) Login as applicant again; should now route to client dashboard (promotion complete).
  await page.context().clearCookies();
  await loginWithCredentials(page, { email: applicantEmail, password });
  await expect(page).toHaveURL(/\/client\/dashboard/, { timeout: 60_000 });

  // 5) Create a second talent user for the application (role=talent is allowed via admin API).
  const createTalentApplicantRes = await page.request.post(`${baseUrl}/api/admin/create-user`, {
    data: {
      email: talentEmail,
      password,
      firstName: "Booking",
      lastName: "Talent",
      role: "talent",
    },
  });
  expect(createTalentApplicantRes.ok()).toBeTruthy();

  // 6) Resolve user ids from auth emails (using admin client).
  const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  expect(usersError).toBeNull();
  const clientUser = usersPage.users.find((u) => u.email?.toLowerCase() === applicantEmail.toLowerCase());
  const talentUser = usersPage.users.find((u) => u.email?.toLowerCase() === talentEmail.toLowerCase());
  expect(clientUser?.id).toBeTruthy();
  expect(talentUser?.id).toBeTruthy();
  const clientId = clientUser?.id;
  const talentId = talentUser?.id;
  if (!clientId || !talentId) {
    throw new Error("Failed to resolve client/talent user ids from admin listUsers()");
  }

  // 7) Insert gig + application deterministically (admin setup).
  const gigTitle = `PW Booking Accept ${timestamp}`;
  const { data: gig, error: gigError } = await admin
    .from("gigs")
    .insert({
      client_id: clientId,
      title: gigTitle,
      description: "Playwright deterministic gig for booking accept proof.",
      category: "Commercial",
      location: "New York, NY",
      compensation: "$1000",
      duration: "1 day",
      date: "2025-12-31",
      status: "active",
    })
    .select("id")
    .single();
  expect(gigError).toBeNull();
  expect(gig?.id).toBeTruthy();
  if (!gig?.id) {
    throw new Error("Failed to create gig for booking accept proof");
  }

  const { error: applicationError } = await admin.from("applications").insert({
    gig_id: gig.id,
    talent_id: talentId,
    status: "new",
    message: "Playwright deterministic application for booking accept proof.",
  });
  expect(applicationError).toBeNull();

  // 8) Login as client and accept the application via UI.
  await loginWithCredentials(page, { email: applicantEmail, password }, { returnUrl: "/client/applications" });
  await page.goto("/client/applications");
  await expect(page.getByText(gigTitle)).toBeVisible({ timeout: 30_000 });

  // Click Accept in the row that contains our gig title (more deterministic than “first button”).
  const gigRow = page.locator("tr", { hasText: gigTitle }).first();
  const acceptButton = gigRow.locator('[data-test="accept-application"]').first();
  await expect(acceptButton).toBeVisible({ timeout: 20_000 });
  await acceptButton.click();

  // 9) Verify booking created in DB (idempotent accept primitive should create exactly one booking).
  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .select("id, gig_id, talent_id, status")
    .eq("gig_id", gig.id)
    .eq("talent_id", talentId)
    .maybeSingle();
  expect(bookingError).toBeNull();
  expect(booking?.id).toBeTruthy();
  expect(booking?.gig_id).toBe(gig.id);
  expect(booking?.talent_id).toBe(talentId);
});


