import { test, expect, Page } from "@playwright/test";

/**
 * Client Functionality Test Suite
 * Tests all client-related functionality including:
 * - Profile creation and management
 * - Gig posting and management
 * - Application review and management
 * - Booking management
 * - Dashboard functionality
 */

// Test data
const clientProfile = {
  personalInfo: {
    firstName: "Test",
    lastName: "Client",
    email: "test-client@example.com",
    phone: "+1234567890",
    title: "Marketing Director",
  },
  companyInfo: {
    companyName: "Test Company Inc.",
    industry: "Fashion",
    companySize: "50-100",
    website: "https://testcompany.com",
    description: "Leading fashion brand specializing in sustainable clothing",
  },
};

const testGig = {
  title: "Fashion Model for Spring Campaign",
  description: "Looking for experienced fashion model for our spring collection campaign",
  category: "Fashion",
  location: "New York, NY",
  budget: "$2000",
  duration: "2 days",
  startDate: "2025-03-15",
  endDate: "2025-03-16",
  requirements: {
    ageRange: "18-25",
    height: "5'6\" - 5'10\"",
    experience: "2+ years",
    specialties: ["Fashion", "Commercial"],
  },
};

// Helper functions
async function loginAsClient(page: Page) {
  await page.goto("/login");
  await page.fill('[data-testid="email"]', clientProfile.personalInfo.email);
  await page.fill('[data-testid="password"]', "TestPassword123!");
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL(/.*\/client\/dashboard/);
}

async function fillClientProfileForm(page: Page) {
  await page.fill('[data-testid="firstName"]', clientProfile.personalInfo.firstName);
  await page.fill('[data-testid="lastName"]', clientProfile.personalInfo.lastName);
  await page.fill('[data-testid="phone"]', clientProfile.personalInfo.phone);
  await page.fill('[data-testid="title"]', clientProfile.personalInfo.title);
  await page.fill('[data-testid="companyName"]', clientProfile.companyInfo.companyName);
  await page.selectOption('[data-testid="industry"]', clientProfile.companyInfo.industry);
  await page.selectOption('[data-testid="companySize"]', clientProfile.companyInfo.companySize);
  await page.fill('[data-testid="website"]', clientProfile.companyInfo.website);
  await page.fill('[data-testid="description"]', clientProfile.companyInfo.description);
}

async function fillGigForm(page: Page) {
  await page.fill('[data-testid="title"]', testGig.title);
  await page.fill('[data-testid="description"]', testGig.description);
  await page.selectOption('[data-testid="category"]', testGig.category);
  await page.fill('[data-testid="location"]', testGig.location);
  await page.fill('[data-testid="budget"]', testGig.budget);
  await page.fill('[data-testid="duration"]', testGig.duration);
  await page.fill('[data-testid="startDate"]', testGig.startDate);
  await page.fill('[data-testid="endDate"]', testGig.endDate);

  // Fill requirements
  await page.fill('[data-testid="ageRange"]', testGig.requirements.ageRange);
  await page.fill('[data-testid="height"]', testGig.requirements.height);
  await page.fill('[data-testid="experience"]', testGig.requirements.experience);

  // Select specialties
  for (const specialty of testGig.requirements.specialties) {
    await page.check(`[data-testid="specialty-${specialty.toLowerCase()}"]`);
  }
}

// Test Suite: Client Profile Management
test.describe("Client Profile Management", () => {
  test("Complete client profile creation", async ({ page }) => {
    await loginAsClient(page);

    // Navigate to profile page
    await page.click('[data-testid="profile-link"]');
    await expect(page).toHaveURL(/.*\/client\/profile/);

    // Fill profile form
    await fillClientProfileForm(page);

    // Submit form
    await page.click('[data-testid="save-profile"]');

    // Verify success message
    await expect(page.locator("text=Profile saved successfully")).toBeVisible();
  });

  test("Client profile form validation", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/client/profile");

    // Try to submit empty form
    await page.click('[data-testid="save-profile"]');

    // Verify validation errors
    await expect(page.locator("text=First name is required")).toBeVisible();
    await expect(page.locator("text=Last name is required")).toBeVisible();
    await expect(page.locator("text=Company name is required")).toBeVisible();
  });

  test("Profile completion status", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/client/dashboard");

    // Check profile completion indicator
    const completionStatus = await page.locator('[data-testid="profile-completion"]');
    await expect(completionStatus).toBeVisible();

    // Verify completion percentage
    const completionPercentage = await page.locator('[data-testid="completion-percentage"]');
    await expect(completionPercentage).toContainText("%");
  });
});

// Test Suite: Gig Management
test.describe("Gig Management", () => {
  test("Create new gig", async ({ page }) => {
    await loginAsClient(page);

    // Navigate to create gig page
    await page.click('[data-testid="create-gig-button"]');
    await expect(page).toHaveURL(/.*\/admin\/gigs\/create/);

    // Fill gig form
    await fillGigForm(page);

    // Submit form
    await page.click('[data-testid="submit-gig"]');

    // Verify success message
    await expect(page.locator("text=Gig created successfully")).toBeVisible();

    // Verify redirect to gigs list
    await expect(page).toHaveURL(/.*\/admin\/gigs/);
  });

  test("Gig form validation", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/admin/gigs/create");

    // Try to submit empty form
    await page.click('[data-testid="submit-gig"]');

    // Verify validation errors
    await expect(page.locator("text=Title is required")).toBeVisible();
    await expect(page.locator("text=Description is required")).toBeVisible();
    await expect(page.locator("text=Category is required")).toBeVisible();
    await expect(page.locator("text=Location is required")).toBeVisible();
    await expect(page.locator("text=Budget is required")).toBeVisible();
  });

  test("Edit existing gig", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/admin/gigs");

    // Click edit on first gig
    await page.click('[data-testid="edit-gig"]:first-child');

    // Update gig title
    await page.fill('[data-testid="title"]', "Updated Gig Title");

    // Submit form
    await page.click('[data-testid="submit-gig"]');

    // Verify success message
    await expect(page.locator("text=Gig updated successfully")).toBeVisible();
  });

  test("Delete gig", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/admin/gigs");

    // Click delete on first gig
    await page.click('[data-testid="delete-gig"]:first-child');

    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');

    // Verify success message
    await expect(page.locator("text=Gig deleted successfully")).toBeVisible();
  });

  test("Gig status management", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/admin/gigs");

    // Change gig status
    await page.selectOption('[data-testid="status-select"]:first-child', "active");

    // Verify status update
    await expect(page.locator('[data-testid="status-badge"]:first-child')).toContainText("Active");
  });
});

// Test Suite: Application Management
test.describe("Application Management", () => {
  test("View applications for gig", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/admin/applications");

    // Verify applications are displayed
    await expect(page.locator('[data-testid="application-card"]')).toBeVisible();

    // Click on first application
    await page.click('[data-testid="application-card"]:first-child');

    // Verify application details
    await expect(page.locator('[data-testid="application-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="talent-profile-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="cover-letter"]')).toBeVisible();
  });

  test("Review application", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/admin/applications");

    // Click on first application
    await page.click('[data-testid="application-card"]:first-child');

    // Add review notes
    await page.fill('[data-testid="review-notes"]', "Great portfolio, good fit for our brand");

    // Change application status
    await page.selectOption('[data-testid="status-select"]', "shortlisted");

    // Submit review
    await page.click('[data-testid="submit-review"]');

    // Verify success message
    await expect(page.locator("text=Application reviewed")).toBeVisible();
  });

  test("Accept application", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/admin/applications");

    // Click on first application
    await page.click('[data-testid="application-card"]:first-child');

    // Accept application
    await page.click('[data-testid="accept-application"]');

    // Verify confirmation modal
    await expect(page.locator('[data-testid="confirmation-modal"]')).toBeVisible();

    // Confirm acceptance
    await page.click('[data-testid="confirm-accept"]');

    // Verify success message
    await expect(page.locator("text=Application accepted")).toBeVisible();
  });

  test("Reject application", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/admin/applications");

    // Click on first application
    await page.click('[data-testid="application-card"]:first-child');

    // Reject application
    await page.click('[data-testid="reject-application"]');

    // Fill rejection reason
    await page.fill('[data-testid="rejection-reason"]', "Not the right fit for this project");

    // Submit rejection
    await page.click('[data-testid="submit-rejection"]');

    // Verify success message
    await expect(page.locator("text=Application rejected")).toBeVisible();
  });

  test("Filter applications", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/admin/applications");

    // Filter by status
    await page.selectOption('[data-testid="status-filter"]', "new");

    // Verify filtered results
    await expect(page.locator('[data-testid="application-card"]')).toBeVisible();

    // Filter by gig
    await page.selectOption('[data-testid="gig-filter"]', testGig.title);

    // Verify filtered results
    await expect(page.locator('[data-testid="application-card"]')).toBeVisible();
  });
});

// Test Suite: Booking Management
test.describe("Booking Management", () => {
  test("Create booking from application", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/admin/applications");

    // Click on accepted application
    await page.click('[data-testid="application-card"]:first-child');

    // Create booking
    await page.click('[data-testid="create-booking"]');

    // Fill booking details
    await page.fill('[data-testid="booking-date"]', "2025-03-15");
    await page.fill('[data-testid="booking-time"]', "09:00");
    await page.fill('[data-testid="booking-location"]', "Studio A, 123 Main St");
    await page.fill('[data-testid="booking-notes"]', "Bring portfolio and wardrobe");

    // Submit booking
    await page.click('[data-testid="submit-booking"]');

    // Verify success message
    await expect(page.locator("text=Booking created successfully")).toBeVisible();
  });

  test("View booking details", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/admin/bookings");

    // Verify bookings are displayed
    await expect(page.locator('[data-testid="booking-card"]')).toBeVisible();

    // Click on first booking
    await page.click('[data-testid="booking-card"]:first-child');

    // Verify booking details
    await expect(page.locator('[data-testid="booking-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="talent-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="gig-info"]')).toBeVisible();
  });

  test("Update booking status", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/admin/bookings");

    // Click on first booking
    await page.click('[data-testid="booking-card"]:first-child');

    // Update booking status
    await page.selectOption('[data-testid="status-select"]', "confirmed");

    // Submit update
    await page.click('[data-testid="update-booking"]');

    // Verify success message
    await expect(page.locator("text=Booking updated")).toBeVisible();
  });

  test("Cancel booking", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/admin/bookings");

    // Click on first booking
    await page.click('[data-testid="booking-card"]:first-child');

    // Cancel booking
    await page.click('[data-testid="cancel-booking"]');

    // Fill cancellation reason
    await page.fill('[data-testid="cancellation-reason"]', "Project postponed");

    // Confirm cancellation
    await page.click('[data-testid="confirm-cancel"]');

    // Verify success message
    await expect(page.locator("text=Booking cancelled")).toBeVisible();
  });
});

// Test Suite: Client Dashboard
test.describe("Client Dashboard", () => {
  test("Dashboard overview", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/client/dashboard");

    // Verify dashboard elements
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-applications"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-gigs"]')).toBeVisible();
  });

  test("Dashboard statistics", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/client/dashboard");

    // Verify stats are displayed
    await expect(page.locator('[data-testid="total-gigs"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-gigs"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-applications"]')).toBeVisible();
    await expect(page.locator('[data-testid="completed-bookings"]')).toBeVisible();
  });

  test("Quick actions", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/client/dashboard");

    // Test quick action buttons
    await page.click('[data-testid="create-gig-button"]');
    await expect(page).toHaveURL(/.*\/admin\/gigs\/create/);

    await page.goto("/client/dashboard");
    await page.click('[data-testid="view-applications-button"]');
    await expect(page).toHaveURL(/.*\/admin\/applications/);

    await page.goto("/client/dashboard");
    await page.click('[data-testid="view-bookings-button"]');
    await expect(page).toHaveURL(/.*\/admin\/bookings/);
  });

  test("Recent activity feed", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/client/dashboard");

    // Verify activity feed is displayed
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();

    // Check for recent activities
    const activities = await page.locator('[data-testid="activity-item"]');
    const count = await activities.count();
    expect(count).toBeGreaterThan(0);
  });
});

// Test Suite: Talent Discovery
test.describe("Talent Discovery", () => {
  test("Browse talent", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/talent");

    // Verify talent profiles are displayed
    await expect(page.locator('[data-testid="talent-card"]')).toBeVisible();

    // Test search functionality
    await page.fill('[data-testid="search-input"]', "fashion");
    await page.click('[data-testid="search-button"]');

    // Verify filtered results
    await expect(page.locator('[data-testid="talent-card"]')).toBeVisible();
  });

  test("View talent profile", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/talent");

    // Click on first talent profile
    await page.click('[data-testid="talent-card"]:first-child');

    // Verify talent profile page
    await expect(page).toHaveURL(/.*\/talent\/.*/);

    // Verify profile elements
    await expect(page.locator('[data-testid="talent-profile-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="talent-portfolio"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-talent-button"]')).toBeVisible();
  });

  test("Contact talent", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/talent");

    // Click on first talent profile
    await page.click('[data-testid="talent-card"]:first-child');

    // Click contact button
    await page.click('[data-testid="contact-talent-button"]');

    // Fill contact form
    await page.fill('[data-testid="subject"]', "Potential Collaboration");
    await page.fill(
      '[data-testid="message"]',
      "Hi, I would like to discuss a potential project..."
    );

    // Submit contact form
    await page.click('[data-testid="submit-contact"]');

    // Verify success message
    await expect(page.locator("text=Message sent successfully")).toBeVisible();
  });
});
