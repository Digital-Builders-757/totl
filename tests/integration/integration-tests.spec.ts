import { test, expect, Page } from "@playwright/test";

/**
 * Integration Test Suite
 * Tests end-to-end workflows and cross-role interactions including:
 * - Complete user journey from registration to booking
 * - Cross-role interactions
 * - System integration points
 * - Performance and load testing
 */

// Test data
const talentUser = {
  email: "integration-talent@example.com",
  password: "TestPassword123!",
  firstName: "Integration",
  lastName: "Talent",
  phone: "+1234567890",
};

const clientUser = {
  email: "integration-client@example.com",
  password: "TestPassword123!",
  firstName: "Integration",
  lastName: "Client",
  companyName: "Integration Company",
  phone: "+1234567890",
};

const testGig = {
  title: "Integration Test Gig",
  description: "End-to-end testing gig for integration tests",
  category: "Fashion",
  location: "New York, NY",
  budget: "$1500",
  duration: "1 day",
  startDate: "2025-05-01",
  endDate: "2025-05-01",
};

// Helper functions
async function registerUser(
  page: Page,
  userType: "talent" | "client",
  userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    companyName?: string;
  }
) {
  await page.goto("/choose-role");

  if (userType === "talent") {
    await page.click('[data-testid="apply-as-talent"]');
    await expect(page).toHaveURL(/.*\/talent\/signup/);
  } else {
    await page.click('[data-testid="apply-as-client"]');
    await expect(page).toHaveURL(/.*\/client\/signup/);
  }

  // Fill registration form
  await page.fill('[data-testid="email"]', userData.email);
  await page.fill('[data-testid="password"]', userData.password);
  await page.fill('[data-testid="firstName"]', userData.firstName);
  await page.fill('[data-testid="lastName"]', userData.lastName);
  await page.fill('[data-testid="phone"]', userData.phone);

  if (userType === "client" && userData.companyName) {
    await page.fill('[data-testid="companyName"]', userData.companyName);
  }

  await page.check('[data-testid="termsCheckbox"]');
  await page.check('[data-testid="privacyCheckbox"]');
  await page.click('[data-testid="submit-button"]');

  // Verify redirect to verification page
  await expect(page).toHaveURL(/.*\/verification-pending/);
}

async function loginUser(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('[data-testid="email"]', email);
  await page.fill('[data-testid="password"]', password);
  await page.click('[data-testid="login-button"]');
}

async function createGig(
  page: Page,
  gigData: {
    title: string;
    description: string;
    category: string;
    location: string;
    budget: string;
    duration: string;
    startDate: string;
    endDate: string;
  }
) {
  await page.goto("/admin/gigs/create");

  await page.fill('[data-testid="title"]', gigData.title);
  await page.fill('[data-testid="description"]', gigData.description);
  await page.selectOption('[data-testid="category"]', gigData.category);
  await page.fill('[data-testid="location"]', gigData.location);
  await page.fill('[data-testid="budget"]', gigData.budget);
  await page.fill('[data-testid="duration"]', gigData.duration);
  await page.fill('[data-testid="startDate"]', gigData.startDate);
  await page.fill('[data-testid="endDate"]', gigData.endDate);

  await page.click('[data-testid="submit-gig"]');
  await expect(page.locator("text=Gig created successfully")).toBeVisible();
}

async function applyForGig(page: Page, gigTitle: string) {
  await page.goto("/gigs");

  // Find and click on the gig
  await page.click(`[data-testid="gig-card"]:has-text("${gigTitle}")`);

  // Apply for gig
  await page.click('[data-testid="apply-button"]');

  await page.fill('[data-testid="cover-letter"]', "I am very interested in this opportunity...");
  await page.fill('[data-testid="availability"]', "Available immediately");

  await page.click('[data-testid="submit-application"]');
  await expect(page.locator("text=Application submitted")).toBeVisible();
}

// Test Suite: Complete User Journey
test.describe("Complete User Journey", () => {
  test("End-to-end talent journey", async ({ page }) => {
    // Step 1: Register as talent
    await registerUser(page, "talent", talentUser);

    // Step 2: Login (simulating email verification)
    await loginUser(page, talentUser.email, talentUser.password);
    await expect(page).toHaveURL(/.*\/talent\/dashboard/);

    // Step 3: Complete profile
    await page.goto("/talent/profile");
    await page.fill('[data-testid="firstName"]', talentUser.firstName);
    await page.fill('[data-testid="lastName"]', talentUser.lastName);
    await page.fill('[data-testid="phone"]', talentUser.phone);
    await page.fill('[data-testid="bio"]', "Experienced model with 5 years in the industry");
    await page.click('[data-testid="save-personal-info"]');

    // Step 4: Add portfolio item
    await page.goto("/talent/portfolio");
    await page.click('[data-testid="add-portfolio-item"]');
    await page.fill('[data-testid="title"]', "Fashion Editorial");
    await page.fill('[data-testid="description"]', "High-end fashion shoot");
    await page.selectOption('[data-testid="category"]', "Fashion");
    await page.fill('[data-testid="imageUrl"]', "https://example.com/image.jpg");
    await page.click('[data-testid="submit-portfolio-item"]');

    // Step 5: Browse and apply for gigs
    await page.goto("/gigs");
    await expect(page.locator('[data-testid="gig-card"]')).toBeVisible();

    // Step 6: View application status
    await page.goto("/talent/applications");
    await expect(page.locator('[data-testid="application-card"]')).toBeVisible();
  });

  test("End-to-end client journey", async ({ page }) => {
    // Step 1: Register as client
    await registerUser(page, "client", clientUser);

    // Step 2: Login (simulating email verification)
    await loginUser(page, clientUser.email, clientUser.password);
    await expect(page).toHaveURL(/.*\/client\/dashboard/);

    // Step 3: Complete profile
    await page.goto("/client/profile");
    await page.fill('[data-testid="firstName"]', clientUser.firstName);
    await page.fill('[data-testid="lastName"]', clientUser.lastName);
    await page.fill('[data-testid="phone"]', clientUser.phone);
    await page.fill('[data-testid="companyName"]', clientUser.companyName);
    await page.fill('[data-testid="description"]', "Leading fashion brand");
    await page.click('[data-testid="save-profile"]');

    // Step 4: Create gig
    await createGig(page, testGig);

    // Step 5: Review applications
    await page.goto("/admin/applications");
    await expect(page.locator('[data-testid="application-card"]')).toBeVisible();

    // Step 6: Manage bookings
    await page.goto("/admin/bookings");
    await expect(page.locator('[data-testid="booking-card"]')).toBeVisible();
  });
});

// Test Suite: Cross-Role Interactions
test.describe("Cross-Role Interactions", () => {
  test("Client posts gig, talent applies, client reviews", async ({ page, context }) => {
    // Create new browser context for client
    const clientContext = await context.browser()?.newContext();
    const clientPage = await clientContext?.newPage();

    if (!clientPage) throw new Error("Failed to create client page");

    try {
      // Client creates gig
      await loginUser(clientPage, clientUser.email, clientUser.password);
      await createGig(clientPage, testGig);

      // Talent applies for gig
      await loginUser(page, talentUser.email, talentUser.password);
      await applyForGig(page, testGig.title);

      // Client reviews application
      await clientPage.goto("/admin/applications");
      await clientPage.click('[data-testid="application-card"]:first-child');

      await clientPage.fill('[data-testid="review-notes"]', "Great portfolio, good fit");
      await clientPage.selectOption('[data-testid="status-select"]', "shortlisted");
      await clientPage.click('[data-testid="submit-review"]');

      await expect(clientPage.locator("text=Application reviewed")).toBeVisible();

      // Talent checks application status
      await page.goto("/talent/applications");
      await expect(page.locator('[data-testid="application-status"]')).toContainText("Shortlisted");
    } finally {
      await clientContext?.close();
    }
  });

  test("Complete booking workflow", async ({ page, context }) => {
    // Create new browser context for client
    const clientContext = await context.browser()?.newContext();
    const clientPage = await clientContext?.newPage();

    if (!clientPage) throw new Error("Failed to create client page");

    try {
      // Client creates gig
      await loginUser(clientPage, clientUser.email, clientUser.password);
      await createGig(clientPage, testGig);

      // Talent applies
      await loginUser(page, talentUser.email, talentUser.password);
      await applyForGig(page, testGig.title);

      // Client accepts application and creates booking
      await clientPage.goto("/admin/applications");
      await clientPage.click('[data-testid="application-card"]:first-child');
      await clientPage.click('[data-testid="accept-application"]');
      await clientPage.click('[data-testid="confirm-accept"]');

      // Create booking
      await clientPage.click('[data-testid="create-booking"]');
      await clientPage.fill('[data-testid="booking-date"]', "2025-05-01");
      await clientPage.fill('[data-testid="booking-time"]', "09:00");
      await clientPage.fill('[data-testid="booking-location"]', "Studio A");
      await clientPage.fill('[data-testid="booking-notes"]', "Bring portfolio");
      await clientPage.click('[data-testid="submit-booking"]');

      await expect(clientPage.locator("text=Booking created successfully")).toBeVisible();

      // Talent views booking
      await page.goto("/talent/bookings");
      await expect(page.locator('[data-testid="booking-card"]')).toBeVisible();
    } finally {
      await clientContext?.close();
    }
  });

  test("Talent discovery and contact workflow", async ({ page: _page, context }) => {
    // Create new browser context for client
    const clientContext = await context.browser()?.newContext();
    const clientPage = await clientContext?.newPage();

    if (!clientPage) throw new Error("Failed to create client page");

    try {
      // Client browses talent
      await loginUser(clientPage, clientUser.email, clientUser.password);
      await clientPage.goto("/talent");

      // Search for talent
      await clientPage.fill('[data-testid="search-input"]', "fashion");
      await clientPage.click('[data-testid="search-button"]');

      // View talent profile
      await clientPage.click('[data-testid="talent-card"]:first-child');

      // Contact talent
      await clientPage.click('[data-testid="contact-talent-button"]');
      await clientPage.fill('[data-testid="subject"]', "Potential Collaboration");
      await clientPage.fill('[data-testid="message"]', "Hi, I would like to discuss a project...");
      await clientPage.click('[data-testid="submit-contact"]');

      await expect(clientPage.locator("text=Message sent successfully")).toBeVisible();
    } finally {
      await clientContext?.close();
    }
  });
});

// Test Suite: System Integration Points
test.describe("System Integration Points", () => {
  test("Email notification workflow", async ({ page }) => {
    // Register new user
    await registerUser(page, "talent", {
      ...talentUser,
      email: "email-test@example.com",
    });

    // Verify verification email page
    await expect(page.locator("text=Please check your inbox")).toBeVisible();

    // Test resend functionality
    await page.click('[data-testid="resend-button"]');
    await expect(page.locator("text=Verification email sent")).toBeVisible();
  });

  test("Database consistency across roles", async ({ page, context }) => {
    // Create new browser context for client
    const clientContext = await context.browser()?.newContext();
    const clientPage = await clientContext?.newPage();

    if (!clientPage) throw new Error("Failed to create client page");

    try {
      // Client creates gig
      await loginUser(clientPage, clientUser.email, clientUser.password);
      await createGig(clientPage, testGig);

      // Verify gig appears in public gigs list
      await page.goto("/gigs");
      await expect(page.locator(`text=${testGig.title}`)).toBeVisible();

      // Talent applies
      await loginUser(page, talentUser.email, talentUser.password);
      await applyForGig(page, testGig.title);

      // Verify application appears in client's application list
      await clientPage.goto("/admin/applications");
      await expect(clientPage.locator('[data-testid="application-card"]')).toBeVisible();

      // Verify application appears in talent's application list
      await page.goto("/talent/applications");
      await expect(page.locator('[data-testid="application-card"]')).toBeVisible();
    } finally {
      await clientContext?.close();
    }
  });

  test("File upload and storage integration", async ({ page }) => {
    await loginUser(page, talentUser.email, talentUser.password);
    await page.goto("/talent/portfolio");

    // Test portfolio image upload
    await page.click('[data-testid="add-portfolio-item"]');
    await page.fill('[data-testid="title"]', "Test Upload");
    await page.fill('[data-testid="description"]', "Test description");
    await page.selectOption('[data-testid="category"]', "Fashion");

    // Upload test image
    const fileInput = await page.locator('[data-testid="image-upload"]');
    await fileInput.setInputFiles({
      name: "test-image.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fake-image-data"),
    });

    await page.click('[data-testid="submit-portfolio-item"]');
    await expect(page.locator("text=Portfolio item added")).toBeVisible();
  });
});

// Test Suite: Performance and Load Testing
test.describe("Performance and Load Testing", () => {
  test("Page load performance", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds

    // Test other key pages
    await page.goto("/gigs");
    await page.waitForLoadState("networkidle");

    await page.goto("/talent");
    await page.waitForLoadState("networkidle");
  });

  test("Search performance with large datasets", async ({ page }) => {
    await page.goto("/gigs");

    const startTime = Date.now();

    // Perform search
    await page.fill('[data-testid="search-input"]', "fashion");
    await page.click('[data-testid="search-button"]');
    await page.waitForLoadState("networkidle");

    const searchTime = Date.now() - startTime;
    expect(searchTime).toBeLessThan(2000); // Search should complete within 2 seconds

    // Verify results are displayed
    await expect(page.locator('[data-testid="gig-card"]')).toBeVisible();
  });

  test("Concurrent user simulation", async ({ page: _page, context }) => {
    // Create multiple browser contexts to simulate concurrent users
    const contexts = [];
    const pages = [];

    for (let i = 0; i < 5; i++) {
      const newContext = await context.browser()?.newContext();
      const newPage = await newContext?.newPage();

      if (newContext && newPage) {
        contexts.push(newContext);
        pages.push(newPage);
      }
    }

    try {
      // All users browse gigs simultaneously
      const promises = pages.map(async (p) => {
        await p.goto("/gigs");
        await p.waitForLoadState("networkidle");
        return p.locator('[data-testid="gig-card"]').count();
      });

      const results = await Promise.all(promises);

      // Verify all users can access the page
      results.forEach((count) => {
        expect(count).toBeGreaterThan(0);
      });
    } finally {
      // Clean up contexts
      await Promise.all(contexts.map((ctx) => ctx.close()));
    }
  });
});

// Test Suite: Error Handling and Edge Cases
test.describe("Error Handling and Edge Cases", () => {
  test("Network error handling", async ({ page }) => {
    // Simulate network failure
    await page.route("**/*", (route) => route.abort());

    await page.goto("/");

    // Verify error handling
    await expect(
      page.locator("text=Network error") || page.locator("text=Failed to load")
    ).toBeVisible();
  });

  test("Invalid URL handling", async ({ page }) => {
    // Test non-existent pages
    await page.goto("/non-existent-page");

    // Verify 404 handling
    await expect(page.locator("text=Page not found") || page.locator("text=404")).toBeVisible();
  });

  test("Form submission with invalid data", async ({ page }) => {
    await page.goto("/talent/signup");

    // Submit form with invalid data
    await page.fill('[data-testid="email"]', "invalid-email");
    await page.fill('[data-testid="password"]', "123");
    await page.click('[data-testid="submit-button"]');

    // Verify validation errors are displayed
    await expect(page.locator("text=Invalid email format")).toBeVisible();
    await expect(page.locator("text=Password must be at least 8 characters")).toBeVisible();
  });

  test("Session timeout handling", async ({ page }) => {
    await loginUser(page, talentUser.email, talentUser.password);

    // Simulate session timeout by clearing cookies
    await page.context().clearCookies();

    // Try to access protected page
    await page.goto("/talent/dashboard");

    // Verify redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });
});

// Test Suite: Mobile Responsiveness
test.describe("Mobile Responsiveness", () => {
  test("Mobile navigation", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    // Test mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Test navigation
    await page.click('[data-testid="mobile-menu-item-gigs"]');
    await expect(page).toHaveURL(/.*\/gigs/);
  });

  test("Mobile form interactions", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/talent/signup");

    // Test form on mobile
    await page.fill('[data-testid="email"]', "mobile-test@example.com");
    await page.fill('[data-testid="password"]', "TestPassword123!");
    await page.fill('[data-testid="firstName"]', "Mobile");
    await page.fill('[data-testid="lastName"]', "Test");
    await page.fill('[data-testid="phone"]', "+1234567890");

    // Verify mobile-specific elements
    await expect(page.locator('[data-testid="mobile-submit-button"]')).toBeVisible();
  });
});
