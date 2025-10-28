import { test, expect } from '@playwright/test';

test.describe('TOTL Agency - Post-Security Fix Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('http://localhost:3000');
  });

  test('Home page loads without FloatingPathsBackground errors', async ({ page }) => {
    // Check for console errors related to FloatingPathsBackground
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    
    // Check that no FloatingPathsBackground errors occurred
    const floatingPathsErrors = consoleErrors.filter(error => 
      error.includes('FloatingPathsBackground') || 
      error.includes('is not defined')
    );
    
    expect(floatingPathsErrors).toHaveLength(0);
    
    // Verify the page loaded successfully
    await expect(page).toHaveTitle(/TOTL Agency/);
  });

  test('No createMotionComponent server-side errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    
    // Check for createMotionComponent errors
    const motionErrors = consoleErrors.filter(error => 
      error.includes('createMotionComponent') ||
      error.includes('server but createMotionComponent')
    );
    
    expect(motionErrors).toHaveLength(0);
  });

  test('No hydration mismatch errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    
    // Check for hydration errors
    const hydrationErrors = consoleErrors.filter(error => 
      error.includes('Hydration failed') ||
      error.includes('server rendered HTML didn\'t match')
    );
    
    expect(hydrationErrors).toHaveLength(0);
  });

  test('Authentication pages load without getUser() errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Test login page
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check for authentication-related errors
    const authErrors = consoleErrors.filter(error => 
      error.includes('getUser') ||
      error.includes('getSession') ||
      error.includes('Invalid API key')
    );
    
    expect(authErrors).toHaveLength(0);
    
    // Verify login page loaded
    await expect(page.locator('h1')).toContainText(/sign in/i);
  });

  test('Gigs page loads without Supabase errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000/gigs');
    await page.waitForLoadState('networkidle');
    
    // Check for Supabase-related errors
    const supabaseErrors = consoleErrors.filter(error => 
      error.includes('Supabase') ||
      error.includes('Invalid API key') ||
      error.includes('URL and Key are required')
    );
    
    expect(supabaseErrors).toHaveLength(0);
  });

  test('No ProfileCard undefined errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    
    // Check for ProfileCard errors
    const profileCardErrors = consoleErrors.filter(error => 
      error.includes('ProfileCard') ||
      error.includes('Can\'t find variable: ProfileCard')
    );
    
    expect(profileCardErrors).toHaveLength(0);
  });

  test('No home-page-client module errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    
    // Check for module resolution errors
    const moduleErrors = consoleErrors.filter(error => 
      error.includes('home-page-client') ||
      error.includes('Module not found')
    );
    
    expect(moduleErrors).toHaveLength(0);
  });

  test('Check for any remaining Sentry errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    
    // Log all console errors for debugging
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }
    
    // Check that we don't have any critical errors
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Cannot read properties of undefined') ||
      error.includes('reading \'/_app\'')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
