import { test, expect, Page } from '@playwright/test';

/**
 * Admin Functionality Test Suite
 * Tests all admin-related functionality including:
 * - User management
 * - Platform oversight
 * - System administration
 * - Analytics and reporting
 */

// Test data
const adminUser = {
  email: 'admin@totlagency.com',
  password: 'AdminPassword123!'
};

const testUser = {
  email: 'test-user@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'talent'
};

// Helper functions
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', adminUser.email);
  await page.fill('[data-testid="password"]', adminUser.password);
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL(/.*\/admin\/dashboard/);
}

async function fillUserCreationForm(page: Page, userData: { email: string; password: string; firstName: string; lastName: string; role: string }) {
  await page.fill('[data-testid="email"]', userData.email);
  await page.fill('[data-testid="password"]', userData.password);
  await page.fill('[data-testid="firstName"]', userData.firstName);
  await page.fill('[data-testid="lastName"]', userData.lastName);
  await page.selectOption('[data-testid="role"]', userData.role);
}

// Test Suite: Admin Dashboard
test.describe('Admin Dashboard', () => {
  test('Admin dashboard overview', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
    
    // Verify dashboard elements
    await expect(page.locator('[data-testid="admin-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="platform-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
    await expect(page.locator('[data-testid="system-health"]')).toBeVisible();
  });

  test('Platform statistics', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
    
    // Verify platform stats are displayed
    await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-talent"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-clients"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-gigs"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-applications"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-bookings"]')).toBeVisible();
  });

  test('System health indicators', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
    
    // Verify system health indicators
    await expect(page.locator('[data-testid="database-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-service-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="storage-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toBeVisible();
  });

  test('Recent activity monitoring', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
    
    // Verify recent activity feed
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();
    
    // Check for recent activities
    const activities = await page.locator('[data-testid="activity-item"]');
    await expect(activities).toHaveCount.greaterThan(0);
  });
});

// Test Suite: User Management
test.describe('User Management', () => {
  test('View all users', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    // Verify users table is displayed
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-row"]')).toBeVisible();
  });

  test('Create new user', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users/create');
    
    // Fill user creation form
    await fillUserCreationForm(page, testUser);
    
    // Submit form
    await page.click('[data-testid="create-user-button"]');
    
    // Verify success message
    await expect(page.locator('text=User created successfully')).toBeVisible();
    
    // Verify redirect to users list
    await expect(page).toHaveURL(/.*\/admin\/users/);
  });

  test('User creation form validation', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users/create');
    
    // Try to submit empty form
    await page.click('[data-testid="create-user-button"]');
    
    // Verify validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
    await expect(page.locator('text=First name is required')).toBeVisible();
    await expect(page.locator('text=Last name is required')).toBeVisible();
    await expect(page.locator('text=Role is required')).toBeVisible();
  });

  test('Edit user details', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    // Click edit on first user
    await page.click('[data-testid="edit-user"]:first-child');
    
    // Update user details
    await page.fill('[data-testid="firstName"]', 'Updated Name');
    
    // Submit form
    await page.click('[data-testid="update-user-button"]');
    
    // Verify success message
    await expect(page.locator('text=User updated successfully')).toBeVisible();
  });

  test('Delete user', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    // Click delete on first user
    await page.click('[data-testid="delete-user"]:first-child');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify success message
    await expect(page.locator('text=User deleted successfully')).toBeVisible();
  });

  test('Change user role', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    // Click edit on first user
    await page.click('[data-testid="edit-user"]:first-child');
    
    // Change role
    await page.selectOption('[data-testid="role"]', 'client');
    
    // Submit form
    await page.click('[data-testid="update-user-button"]');
    
    // Verify success message
    await expect(page.locator('text=User role updated')).toBeVisible();
  });

  test('Search and filter users', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'test');
    await page.click('[data-testid="search-button"]');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="user-row"]')).toBeVisible();
    
    // Test role filter
    await page.selectOption('[data-testid="role-filter"]', 'talent');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="user-row"]')).toBeVisible();
  });
});

// Test Suite: Gig Management
test.describe('Admin Gig Management', () => {
  test('View all gigs', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/gigs');
    
    // Verify gigs table is displayed
    await expect(page.locator('[data-testid="gigs-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="gig-row"]')).toBeVisible();
  });

  test('Create gig as admin', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/gigs/create');
    
    // Fill gig form
    await page.fill('[data-testid="title"]', 'Admin Created Gig');
    await page.fill('[data-testid="description"]', 'Gig created by admin');
    await page.selectOption('[data-testid="category"]', 'Fashion');
    await page.fill('[data-testid="location"]', 'Los Angeles, CA');
    await page.fill('[data-testid="budget"]', '$3000');
    await page.fill('[data-testid="duration"]', '3 days');
    await page.fill('[data-testid="startDate"]', '2025-04-01');
    await page.fill('[data-testid="endDate"]', '2025-04-03');
    
    // Submit form
    await page.click('[data-testid="submit-gig"]');
    
    // Verify success message
    await expect(page.locator('text=Gig created successfully')).toBeVisible();
  });

  test('Moderate gig content', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/gigs');
    
    // Click on first gig
    await page.click('[data-testid="gig-row"]:first-child');
    
    // Verify gig details
    await expect(page.locator('[data-testid="gig-details"]')).toBeVisible();
    
    // Approve gig
    await page.click('[data-testid="approve-gig"]');
    
    // Verify success message
    await expect(page.locator('text=Gig approved')).toBeVisible();
  });

  test('Flag inappropriate content', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/gigs');
    
    // Click on first gig
    await page.click('[data-testid="gig-row"]:first-child');
    
    // Flag gig
    await page.click('[data-testid="flag-gig"]');
    
    // Fill flag reason
    await page.fill('[data-testid="flag-reason"]', 'Inappropriate content');
    
    // Submit flag
    await page.click('[data-testid="submit-flag"]');
    
    // Verify success message
    await expect(page.locator('text=Gig flagged for review')).toBeVisible();
  });
});

// Test Suite: Application Management
test.describe('Admin Application Management', () => {
  test('View all applications', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/applications');
    
    // Verify applications table is displayed
    await expect(page.locator('[data-testid="applications-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="application-row"]')).toBeVisible();
  });

  test('Review application details', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/applications');
    
    // Click on first application
    await page.click('[data-testid="application-row"]:first-child');
    
    // Verify application details
    await expect(page.locator('[data-testid="application-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="talent-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="gig-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="cover-letter"]')).toBeVisible();
  });

  test('Moderate application content', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/applications');
    
    // Click on first application
    await page.click('[data-testid="application-row"]:first-child');
    
    // Add admin notes
    await page.fill('[data-testid="admin-notes"]', 'Application reviewed by admin');
    
    // Submit review
    await page.click('[data-testid="submit-admin-review"]');
    
    // Verify success message
    await expect(page.locator('text=Admin review submitted')).toBeVisible();
  });

  test('Filter applications by status', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/applications');
    
    // Filter by status
    await page.selectOption('[data-testid="status-filter"]', 'new');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="application-row"]')).toBeVisible();
    
    // Filter by gig
    await page.selectOption('[data-testid="gig-filter"]', 'Fashion Model for Spring Campaign');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="application-row"]')).toBeVisible();
  });
});

// Test Suite: Booking Management
test.describe('Admin Booking Management', () => {
  test('View all bookings', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/bookings');
    
    // Verify bookings table is displayed
    await expect(page.locator('[data-testid="bookings-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-row"]')).toBeVisible();
  });

  test('Review booking details', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/bookings');
    
    // Click on first booking
    await page.click('[data-testid="booking-row"]:first-child');
    
    // Verify booking details
    await expect(page.locator('[data-testid="booking-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="talent-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="client-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="gig-info"]')).toBeVisible();
  });

  test('Monitor booking disputes', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/bookings');
    
    // Click on first booking
    await page.click('[data-testid="booking-row"]:first-child');
    
    // Check for dispute indicators
    const disputeIndicator = await page.locator('[data-testid="dispute-indicator"]');
    if (await disputeIndicator.isVisible()) {
      // Handle dispute
      await page.click('[data-testid="handle-dispute"]');
      
      // Add resolution notes
      await page.fill('[data-testid="resolution-notes"]', 'Dispute resolved by admin');
      
      // Submit resolution
      await page.click('[data-testid="submit-resolution"]');
      
      // Verify success message
      await expect(page.locator('text=Dispute resolved')).toBeVisible();
    }
  });
});

// Test Suite: System Administration
test.describe('System Administration', () => {
  test('System diagnostics', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/diagnostic');
    
    // Verify diagnostic page elements
    await expect(page.locator('[data-testid="diagnostic-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="database-check"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-service-check"]')).toBeVisible();
    await expect(page.locator('[data-testid="storage-check"]')).toBeVisible();
  });

  test('Database connection test', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/diagnostic');
    
    // Run database test
    await page.click('[data-testid="test-database"]');
    
    // Verify test results
    await expect(page.locator('[data-testid="database-status"]')).toBeVisible();
  });

  test('Email service test', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/diagnostic');
    
    // Run email service test
    await page.click('[data-testid="test-email-service"]');
    
    // Verify test results
    await expect(page.locator('[data-testid="email-service-status"]')).toBeVisible();
  });

  test('Storage service test', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/diagnostic');
    
    // Run storage test
    await page.click('[data-testid="test-storage"]');
    
    // Verify test results
    await expect(page.locator('[data-testid="storage-status"]')).toBeVisible();
  });
});

// Test Suite: Analytics and Reporting
test.describe('Analytics and Reporting', () => {
  test('Platform analytics overview', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/analytics');
    
    // Verify analytics page elements
    await expect(page.locator('[data-testid="analytics-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="gig-activity-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-revenue-chart"]')).toBeVisible();
  });

  test('User activity reports', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/analytics');
    
    // Generate user activity report
    await page.click('[data-testid="generate-user-report"]');
    
    // Verify report generation
    await expect(page.locator('text=Report generated successfully')).toBeVisible();
  });

  test('Financial reports', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/analytics');
    
    // Generate financial report
    await page.click('[data-testid="generate-financial-report"]');
    
    // Verify report generation
    await expect(page.locator('text=Financial report generated')).toBeVisible();
  });

  test('Export data functionality', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/analytics');
    
    // Export user data
    await page.click('[data-testid="export-users"]');
    
    // Verify export initiation
    await expect(page.locator('text=Export initiated')).toBeVisible();
    
    // Export gig data
    await page.click('[data-testid="export-gigs"]');
    
    // Verify export initiation
    await expect(page.locator('text=Export initiated')).toBeVisible();
  });
});

// Test Suite: Security and Access Control
test.describe('Security and Access Control', () => {
  test('Admin access control', async ({ page }) => {
    // Try to access admin page without login
    await page.goto('/admin/dashboard');
    
    // Verify redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Role-based access control', async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test-talent@example.com');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    // Try to access admin page
    await page.goto('/admin/dashboard');
    
    // Verify access denied or redirect
    await expect(page.locator('text=Access denied') || page.locator('text=Unauthorized')).toBeVisible();
  });

  test('Admin session management', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
    
    // Verify admin is logged in
    await expect(page.locator('[data-testid="admin-header"]')).toBeVisible();
    
    // Test session persistence
    await page.reload();
    await expect(page).toHaveURL(/.*\/admin\/dashboard/);
  });
});
