import { test, expect, Page } from "@playwright/test";

/**
 * Talent Functionality Test Suite
 * Tests all talent-related functionality including:
 * - Profile creation and management
 * - Portfolio management
 * - Gig browsing and applications
 * - Dashboard functionality
 */

// Test data
const talentProfile = {
  personalInfo: {
    firstName: "Test",
    lastName: "Talent",
    email: "test-talent@example.com",
    phone: "+1234567890",
    dateOfBirth: "1995-01-01",
    location: "New York, NY",
    bio: "Experienced model with 5 years in the industry",
  },
  physicalStats: {
    height: "5'8\"",
    weight: "130 lbs",
    hairColor: "Brown",
    eyeColor: "Blue",
    bodyType: "Athletic",
    measurements: "34-24-36",
  },
  professionalInfo: {
    experience: "5 years",
    specialties: ["Fashion", "Commercial", "Editorial"],
    languages: ["English", "Spanish"],
    availability: "Available",
    rate: "$500/day",
  },
};

const portfolioItem = {
  title: "Fashion Editorial",
  description: "High-end fashion shoot for Vogue",
  category: "Fashion",
  imageUrl: "https://example.com/image.jpg",
};

// Helper functions
async function loginAsTalent(page: Page) {
  await page.goto("/login");
  await page.fill('[data-testid="email"]', talentProfile.personalInfo.email);
  await page.fill('[data-testid="password"]', "TestPassword123!");
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL(/.*\/talent\/dashboard/);
}

async function fillPersonalInfoForm(page: Page) {
  await page.fill('[data-testid="firstName"]', talentProfile.personalInfo.firstName);
  await page.fill('[data-testid="lastName"]', talentProfile.personalInfo.lastName);
  await page.fill('[data-testid="phone"]', talentProfile.personalInfo.phone);
  await page.fill('[data-testid="dateOfBirth"]', talentProfile.personalInfo.dateOfBirth);
  await page.fill('[data-testid="location"]', talentProfile.personalInfo.location);
  await page.fill('[data-testid="bio"]', talentProfile.personalInfo.bio);
}

async function fillPhysicalStatsForm(page: Page) {
  await page.fill('[data-testid="height"]', talentProfile.physicalStats.height);
  await page.fill('[data-testid="weight"]', talentProfile.physicalStats.weight);
  await page.selectOption('[data-testid="hairColor"]', talentProfile.physicalStats.hairColor);
  await page.selectOption('[data-testid="eyeColor"]', talentProfile.physicalStats.eyeColor);
  await page.selectOption('[data-testid="bodyType"]', talentProfile.physicalStats.bodyType);
  await page.fill('[data-testid="measurements"]', talentProfile.physicalStats.measurements);
}

async function fillProfessionalInfoForm(page: Page) {
  await page.fill('[data-testid="experience"]', talentProfile.professionalInfo.experience);
  await page.fill('[data-testid="rate"]', talentProfile.professionalInfo.rate);
  await page.selectOption(
    '[data-testid="availability"]',
    talentProfile.professionalInfo.availability
  );

  // Select specialties
  for (const specialty of talentProfile.professionalInfo.specialties) {
    await page.check(`[data-testid="specialty-${specialty.toLowerCase()}"]`);
  }

  // Select languages
  for (const language of talentProfile.professionalInfo.languages) {
    await page.check(`[data-testid="language-${language.toLowerCase()}"]`);
  }
}

// Test Suite: Profile Management
test.describe("Talent Profile Management", () => {
  test("Complete profile creation flow", async ({ page }) => {
    await loginAsTalent(page);

    // Navigate to profile page
    await page.click('[data-testid="profile-link"]');
    await expect(page).toHaveURL(/.*\/talent\/profile/);

    // Fill personal information
    await page.click('[data-testid="personal-info-tab"]');
    await fillPersonalInfoForm(page);
    await page.click('[data-testid="save-personal-info"]');

    // Verify success message
    await expect(page.locator("text=Personal information saved")).toBeVisible();

    // Fill physical stats
    await page.click('[data-testid="physical-stats-tab"]');
    await fillPhysicalStatsForm(page);
    await page.click('[data-testid="save-physical-stats"]');

    // Verify success message
    await expect(page.locator("text=Physical stats saved")).toBeVisible();

    // Fill professional info
    await page.click('[data-testid="professional-info-tab"]');
    await fillProfessionalInfoForm(page);
    await page.click('[data-testid="save-professional-info"]');

    // Verify success message
    await expect(page.locator("text=Professional information saved")).toBeVisible();
  });

  test("Profile form validation", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto("/talent/profile");

    // Try to submit empty personal info form
    await page.click('[data-testid="personal-info-tab"]');
    await page.click('[data-testid="save-personal-info"]');

    // Verify validation errors
    await expect(page.locator("text=First name is required")).toBeVisible();
    await expect(page.locator("text=Last name is required")).toBeVisible();
    await expect(page.locator("text=Phone is required")).toBeVisible();
  });

  test("Profile completion status", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto("/talent/dashboard");

    // Check profile completion indicator
    const completionStatus = await page.locator('[data-testid="profile-completion"]');
    await expect(completionStatus).toBeVisible();

    // Verify completion percentage
    const completionPercentage = await page.locator('[data-testid="completion-percentage"]');
    await expect(completionPercentage).toContainText("%");
  });
});

// Test Suite: Portfolio Management
test.describe("Portfolio Management", () => {
  test("Add portfolio item", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto("/talent/portfolio");

    // Click add portfolio item
    await page.click('[data-testid="add-portfolio-item"]');

    // Fill portfolio item form
    await page.fill('[data-testid="title"]', portfolioItem.title);
    await page.fill('[data-testid="description"]', portfolioItem.description);
    await page.selectOption('[data-testid="category"]', portfolioItem.category);
    await page.fill('[data-testid="imageUrl"]', portfolioItem.imageUrl);

    // Submit form
    await page.click('[data-testid="submit-portfolio-item"]');

    // Verify success message
    await expect(page.locator("text=Portfolio item added")).toBeVisible();

    // Verify item appears in portfolio
    await expect(page.locator(`text=${portfolioItem.title}`)).toBeVisible();
  });

  test("Edit portfolio item", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto("/talent/portfolio");

    // Click edit on first portfolio item
    await page.click('[data-testid="edit-portfolio-item"]:first-child');

    // Update title
    await page.fill('[data-testid="title"]', "Updated Title");

    // Submit form
    await page.click('[data-testid="submit-portfolio-item"]');

    // Verify success message
    await expect(page.locator("text=Portfolio item updated")).toBeVisible();

    // Verify updated title appears
    await expect(page.locator("text=Updated Title")).toBeVisible();
  });

  test("Delete portfolio item", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto("/talent/portfolio");

    // Click delete on first portfolio item
    await page.click('[data-testid="delete-portfolio-item"]:first-child');

    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');

    // Verify success message
    await expect(page.locator("text=Portfolio item deleted")).toBeVisible();
  });

  test("Portfolio item validation", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto("/talent/portfolio");

    // Click add portfolio item
    await page.click('[data-testid="add-portfolio-item"]');

    // Try to submit empty form
    await page.click('[data-testid="submit-portfolio-item"]');

    // Verify validation errors
    await expect(page.locator("text=Title is required")).toBeVisible();
    await expect(page.locator("text=Description is required")).toBeVisible();
    await expect(page.locator("text=Category is required")).toBeVisible();
  });
});

// Test Suite: Gig Browsing and Applications
test.describe("Gig Browsing and Applications", () => {
  test("Browse available gigs", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto("/gigs");

    // Verify gigs are displayed
    await expect(page.locator('[data-testid="gig-card"]')).toBeVisible();

    // Test search functionality
    await page.fill('[data-testid="search-input"]', "fashion");
    await page.click('[data-testid="search-button"]');

    // Verify filtered results
    await expect(page.locator('[data-testid="gig-card"]')).toBeVisible();

    // Test filter by category
    await page.selectOption('[data-testid="category-filter"]', "Fashion");
    await expect(page.locator('[data-testid="gig-card"]')).toBeVisible();
  });

  test("Apply for gig", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto("/gigs");

    // Click on first gig
    await page.click('[data-testid="gig-card"]:first-child');

    // Verify gig details page
    await expect(page).toHaveURL(/.*\/gigs\/.*/);

    // Click apply button
    await page.click('[data-testid="apply-button"]');

    // Fill application form
    await page.fill('[data-testid="cover-letter"]', "I am very interested in this opportunity...");
    await page.fill('[data-testid="availability"]', "Available immediately");

    // Submit application
    await page.click('[data-testid="submit-application"]');

    // Verify success message
    await expect(page.locator("text=Application submitted")).toBeVisible();
  });

  test("View application status", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto("/talent/applications");

    // Verify applications are displayed
    await expect(page.locator('[data-testid="application-card"]')).toBeVisible();

    // Check application status
    const statusElement = await page.locator('[data-testid="application-status"]:first-child');
    await expect(statusElement).toBeVisible();

    // Verify status is one of expected values
    const status = await statusElement.textContent();
    expect(["New", "Under Review", "Shortlisted", "Rejected", "Accepted"]).toContain(status);
  });

  test("Application form validation", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto("/gigs");

    // Click on first gig and apply
    await page.click('[data-testid="gig-card"]:first-child');
    await page.click('[data-testid="apply-button"]');

    // Try to submit empty form
    await page.click('[data-testid="submit-application"]');

    // Verify validation errors
    await expect(page.locator("text=Cover letter is required")).toBeVisible();
    await expect(page.locator("text=Availability is required")).toBeVisible();
  });
});

// Test Suite: Dashboard Functionality
test.describe("Talent Dashboard", () => {
  test("Dashboard overview", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto("/talent/dashboard");

    // Verify dashboard elements
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-applications"]')).toBeVisible();
    await expect(page.locator('[data-testid="recommended-gigs"]')).toBeVisible();
  });

  test("Dashboard statistics", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto("/talent/dashboard");

    // Verify stats are displayed
    await expect(page.locator('[data-testid="total-applications"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-applications"]')).toBeVisible();
    await expect(page.locator('[data-testid="completed-gigs"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-views"]')).toBeVisible();
  });

  test("Quick actions", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto("/talent/dashboard");

    // Test quick action buttons
    await page.click('[data-testid="browse-gigs-button"]');
    await expect(page).toHaveURL(/.*\/gigs/);

    await page.goto("/talent/dashboard");
    await page.click('[data-testid="update-profile-button"]');
    await expect(page).toHaveURL(/.*\/talent\/profile/);

    await page.goto("/talent/dashboard");
    await page.click('[data-testid="view-portfolio-button"]');
    await expect(page).toHaveURL(/.*\/talent\/portfolio/);
  });

  test("Recent activity feed", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto("/talent/dashboard");

    // Verify activity feed is displayed
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();

    // Check for recent activities
    const activities = await page.locator('[data-testid="activity-item"]');
    const count = await activities.count();
    expect(count).toBeGreaterThan(0);
  });
});

// Test Suite: Profile Visibility
test.describe("Profile Visibility", () => {
  test("Public profile view", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto("/talent/profile");

    // Click view public profile
    await page.click('[data-testid="view-public-profile"]');

    // Verify public profile page
    await expect(page).toHaveURL(/.*\/talent\/.*\/public/);

    // Verify public profile elements
    await expect(page.locator('[data-testid="public-profile-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="public-portfolio"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-button"]')).toBeVisible();
  });

  test("Profile sharing", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto("/talent/profile");

    // Click share profile
    await page.click('[data-testid="share-profile-button"]');

    // Verify share modal
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Test copy link functionality
    await page.click('[data-testid="copy-link-button"]');
    await expect(page.locator("text=Link copied to clipboard")).toBeVisible();
  });
});
