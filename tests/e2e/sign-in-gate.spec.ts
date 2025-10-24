import { test, expect } from '@playwright/test';

test.describe('Sign-In Gate', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're logged out
    await page.goto('/auth/signout');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Gigs Page', () => {
    test('shows sign-in gate when logged out', async ({ page }) => {
      await page.goto('/gigs');
      
      // Check that the gate is visible
      await expect(page.locator('h1')).toContainText('Sign in to view gigs');
      
      // Check that the icon is present
      await expect(page.locator('[data-testid="lock-icon"]')).toBeVisible();
      
      // Check that CTAs are visible
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Create an account' })).toBeVisible();
      
      // Check that learn more link is present
      await expect(page.getByRole('link', { name: 'Learn more about TOTL' })).toBeVisible();
    });

    test('CTAs navigate to correct routes', async ({ page }) => {
      await page.goto('/gigs');
      
      // Test primary CTA
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page).toHaveURL('/login');
      
      // Go back and test secondary CTA
      await page.goBack();
      await page.getByRole('button', { name: 'Create an account' }).click();
      await expect(page).toHaveURL('/choose-role');
      
      // Go back and test learn more link
      await page.goBack();
      await page.getByRole('link', { name: 'Learn more about TOTL' }).click();
      await expect(page).toHaveURL('/about');
    });

    test('keyboard navigation works correctly', async ({ page }) => {
      await page.goto('/gigs');
      
      // Tab through the elements
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Create an account' })).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Learn more about TOTL' })).toBeFocused();
    });

    test('does not show gate when logged in', async ({ page }) => {
      // Login as a test user (you'll need to implement this based on your auth setup)
      // This is a placeholder - you'll need to implement actual login
      await page.goto('/login');
      // Add login logic here based on your test user setup
      
      // After login, visit gigs page
      await page.goto('/gigs');
      
      // Should not show the gate
      await expect(page.locator('h1')).not.toContainText('Sign in to view gigs');
      
      // Should show the actual gigs content
      await expect(page.locator('h1')).toContainText('Gigs');
    });
  });

  test.describe('Talent Page', () => {
    test('shows sign-in gate when logged out', async ({ page }) => {
      await page.goto('/talent');
      
      // Check that the gate is visible
      await expect(page.locator('h1')).toContainText('Sign in to explore talent');
      
      // Check that the icon is present
      await expect(page.locator('[data-testid="users-icon"]')).toBeVisible();
      
      // Check that CTAs are visible
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Create an account' })).toBeVisible();
      
      // Check that learn more link is present
      await expect(page.getByRole('link', { name: 'Learn more about TOTL' })).toBeVisible();
    });

    test('CTAs navigate to correct routes', async ({ page }) => {
      await page.goto('/talent');
      
      // Test primary CTA
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page).toHaveURL('/login');
      
      // Go back and test secondary CTA
      await page.goBack();
      await page.getByRole('button', { name: 'Create an account' }).click();
      await expect(page).toHaveURL('/choose-role');
      
      // Go back and test learn more link
      await page.goBack();
      await page.getByRole('link', { name: 'Learn more about TOTL' }).click();
      await expect(page).toHaveURL('/about');
    });

    test('keyboard navigation works correctly', async ({ page }) => {
      await page.goto('/talent');
      
      // Tab through the elements
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Create an account' })).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Learn more about TOTL' })).toBeFocused();
    });

    test('does not show gate when logged in', async ({ page }) => {
      // Login as a test user (you'll need to implement this based on your auth setup)
      // This is a placeholder - you'll need to implement actual login
      await page.goto('/login');
      // Add login logic here based on your test user setup
      
      // After login, visit talent page
      await page.goto('/talent');
      
      // Should not show the gate
      await expect(page.locator('h1')).not.toContainText('Sign in to explore talent');
      
      // Should show the actual talent content
      await expect(page.locator('h1')).toContainText('Discover Amazing Talent');
    });
  });

  test.describe('Accessibility', () => {
    test('has proper heading structure', async ({ page }) => {
      await page.goto('/gigs');
      
      // Check that h1 is used for the main heading
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
      await expect(heading).toHaveText('Sign in to view gigs');
    });

    test('has proper focus indicators', async ({ page }) => {
      await page.goto('/gigs');
      
      // Focus on the primary button
      await page.getByRole('button', { name: 'Sign in' }).focus();
      
      // Check that focus is visible (this might need adjustment based on your CSS)
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused();
    });

    test('respects prefers-reduced-motion', async ({ page }) => {
      // Set prefers-reduced-motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.goto('/gigs');
      
      // Check that animations are disabled
      // This test might need adjustment based on your specific animation implementation
      const animatedElement = page.locator('.motion-safe\\:animate-pulse');
      const computedStyle = await animatedElement.evaluate((el) => {
        return window.getComputedStyle(el).animation;
      });
      
      // Animation should be disabled
      expect(computedStyle).toBe('none');
    });
  });
});
