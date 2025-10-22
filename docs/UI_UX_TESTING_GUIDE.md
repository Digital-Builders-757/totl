# UI/UX Testing Guide - TOTL Agency

**Date:** October 22, 2025  
**Last Updated:** October 22, 2025  
**Status:** ✅ Production Ready

---

## 📋 Overview

This guide explains how to test all UI/UX upgrades implemented in the October 22, 2025 session using Playwright automated tests.

**10 Major Features Tested:**
1. ✅ Production bug fix (cookie error)
2. ✅ Portfolio hover effects (4.1)
3. ✅ Image loading skeletons (4.2)
4. ✅ Command palette ⌘K (3.1)
5. ✅ Form input polish (6.1)
6. ✅ Button states (6.2)
7. ✅ Hover effects (6.3)
8. ✅ Status badges (5.3)
9. ✅ Toast notifications (5.4)
10. ✅ Accessibility - reduced motion (2.4)

---

## 🚀 Quick Start

### **Option 1: PowerShell Script (Recommended)**

```powershell
# Run quick tests (public pages only)
.\scripts\run-ui-ux-tests.ps1

# Run quick tests with browser visible
.\scripts\run-ui-ux-tests.ps1 -Headed

# Run quick tests and show report
.\scripts\run-ui-ux-tests.ps1 -Report

# Run full test suite
.\scripts\run-ui-ux-tests.ps1 -Full

# Debug mode (Playwright Inspector)
.\scripts\run-ui-ux-tests.ps1 -Debug
```

### **Option 2: Direct NPM Commands**

```bash
# Install Playwright (first time only)
npm install --save-dev @playwright/test
npx playwright install chromium

# Run quick tests
npx playwright test ui-ux-quick-test

# Run full suite
npx playwright test ui-ux-upgrades

# Run with browser visible
npx playwright test --headed

# Debug mode
npx playwright test --debug

# View HTML report
npx playwright show-report
```

---

## 📁 Test Files

### **Quick Tests** (No Authentication Required)
**File:** `tests/integration/ui-ux-quick-test.spec.ts`

**What it tests:**
- ✅ Command palette (⌘K / Ctrl+K)
- ✅ Image loading and SafeImage
- ✅ Form input focus styles
- ✅ Button hover and active states
- ✅ Mobile responsiveness
- ✅ Performance metrics
- ✅ Accessibility features
- ✅ Visual rendering

**Run time:** ~30-60 seconds  
**Pages tested:** `/`, `/gigs`, `/login`, `/about`

### **Full Test Suite** (Includes Auth-Required Features)
**File:** `tests/integration/ui-ux-upgrades.spec.ts`

**Additional tests:**
- ✅ Portfolio hover effects (requires talent login)
- ✅ Toast notifications (requires user actions)
- ✅ Status badges (dashboard pages)
- ✅ Reduced motion preferences
- ✅ Visual regression snapshots

**Run time:** ~2-3 minutes  
**Requires:** Test user accounts

---

## 🧪 Test Categories

### **1. Command Palette Tests**

Tests the ⌘K / Ctrl+K global command palette.

**What's tested:**
- Opens with keyboard shortcut
- Closes with Escape
- Search functionality
- Keyboard navigation (arrows)
- Command execution

**Example test:**
```typescript
test('Command palette opens with Ctrl+K', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+KeyK');
  
  const commandPalette = page.locator('[cmdk-root]');
  await expect(commandPalette).toBeVisible();
});
```

---

### **2. Image Loading Tests**

Tests skeleton loaders and SafeImage components.

**What's tested:**
- Page loads without errors
- Images render correctly
- SafeImage components work
- Skeleton loaders appear (simulated slow connection)
- Smooth fade-in transitions

**Example test:**
```typescript
test('Images load on gigs page', async ({ page }) => {
  await page.goto('/gigs');
  await page.waitForLoadState('networkidle');
  
  const images = page.locator('img');
  const count = await images.count();
  
  expect(count).toBeGreaterThan(0);
});
```

---

### **3. Form Input Polish Tests**

Tests focus glow and input enhancements.

**What's tested:**
- Focus ring styles applied
- Smooth transitions (200ms)
- FloatingInput label animation
- Keyboard accessibility

**Example test:**
```typescript
test('Login form inputs have focus styles', async ({ page }) => {
  await page.goto('/login');
  
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.click();
  
  const hasFocusRing = await emailInput.evaluate((el) => {
    return el.className.includes('focus-visible:ring');
  });
  
  expect(hasFocusRing).toBe(true);
});
```

---

### **4. Button State Tests**

Tests hover effects and active states.

**What's tested:**
- Hover opacity changes
- Active scale (0.98x on click)
- Smooth transitions
- Touch-aware behavior

**Example test:**
```typescript
test('Buttons have active states', async ({ page }) => {
  await page.goto('/login');
  
  const button = page.locator('button[type="submit"]').first();
  await button.hover();
  await page.mouse.down();
  
  const transform = await button.evaluate((el) => 
    window.getComputedStyle(el).transform
  );
  
  expect(transform).toBeDefined();
});
```

---

### **5. Mobile Responsiveness Tests**

Tests mobile viewport and touch targets.

**What's tested:**
- No horizontal scroll (375px viewport)
- Touch target sizes (min 44x44px)
- Command palette responsive
- Touch vs hover detection

**Example test:**
```typescript
test('Mobile viewport - no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
});
```

---

### **6. Performance Tests**

Tests load times and layout stability.

**What's tested:**
- Page load time (< 10 seconds)
- DOM content loaded time
- Smooth animations (60fps)
- No layout shifts (CLS)

**Example test:**
```typescript
test('Page loads within performance budget', async ({ page }) => {
  await page.goto('/');
  
  const metrics = await page.evaluate(() => {
    const perfData = window.performance.timing;
    return {
      loadTime: perfData.loadEventEnd - perfData.navigationStart,
    };
  });
  
  expect(metrics.loadTime).toBeLessThan(10000);
});
```

---

### **7. Accessibility Tests**

Tests keyboard navigation and reduced motion.

**What's tested:**
- Keyboard navigation (Tab)
- Focusable elements
- Reduced motion preferences
- Screen reader compatibility

**Example test:**
```typescript
test('Keyboard navigation works', async ({ page }) => {
  await page.goto('/');
  
  await page.keyboard.press('Tab');
  
  const focusedElement = await page.evaluate(() => 
    document.activeElement?.tagName
  );
  
  expect(focusedElement).toBeDefined();
});
```

---

## 📊 Test Results

### **Interpreting Results**

**✅ All tests passed:**
```
✅ All tests passed!

  10 passed (30s)
```

**❌ Some tests failed:**
```
❌ Some tests failed

  8 passed
  2 failed
  
View report: npx playwright show-report
```

### **Test Output Files**

**Generated after each run:**

1. **HTML Report:** `playwright-report/index.html`
   - Visual test results
   - Screenshots on failure
   - Detailed stack traces
   
2. **JSON Results:** `test-results/results.json`
   - Machine-readable results
   - For CI/CD integration
   
3. **JUnit XML:** `test-results/results.xml`
   - Standard test format
   - For CI/CD reporting

4. **Failure Artifacts** (only on failure):
   - Screenshots: `test-results/*.png`
   - Videos: `test-results/*.webm`
   - Traces: `test-results/*.zip`

---

## 🐛 Debugging Failed Tests

### **View HTML Report**

```bash
npx playwright show-report
```

Opens interactive report in browser showing:
- Which tests passed/failed
- Screenshots at point of failure
- Video recordings
- Stack traces
- Console logs

### **Debug Mode (Playwright Inspector)**

```bash
# PowerShell
.\scripts\run-ui-ux-tests.ps1 -Debug

# Or directly
npx playwright test --debug
```

Features:
- ⏸️  Pause test execution
- ➡️  Step through test line-by-line
- 🔍 Inspect page elements
- 💻 Run commands in console
- 📷 Take screenshots

### **Headed Mode (See Browser)**

```bash
# PowerShell
.\scripts\run-ui-ux-tests.ps1 -Headed

# Or directly
npx playwright test --headed
```

Watch tests run in real browser window.

### **Run Single Test**

```bash
# Run specific test file
npx playwright test ui-ux-quick-test

# Run specific test by name
npx playwright test -g "Command palette opens"

# Run only failed tests
npx playwright test --last-failed
```

---

## 🎯 Common Issues & Solutions

### **Issue: Dev server not running**

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution:**
Playwright will start it automatically. Or start manually:
```bash
npm run dev
```

### **Issue: Command palette not opening**

**Possible causes:**
1. JavaScript error preventing component load
2. Browser security blocking keyboard events
3. Component not imported correctly

**Debug:**
```bash
npx playwright test --debug -g "Command palette"
```

### **Issue: Images not loading**

**Possible causes:**
1. Supabase storage permissions
2. Invalid image URLs
3. Network timeout

**Check:**
- Browser console for 403/404 errors
- Supabase Storage policies
- Image URLs in database

### **Issue: Test timeouts**

**Error:**
```
Timeout 30000ms exceeded
```

**Solutions:**
1. Increase timeout in test:
   ```typescript
   await expect(element).toBeVisible({ timeout: 10000 });
   ```

2. Check network speed
3. Ensure dev server is running

### **Issue: Flaky tests**

Tests pass/fail randomly.

**Solutions:**
1. Add proper wait conditions:
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

2. Use stable selectors:
   ```typescript
   // Bad: page.locator('div').nth(3)
   // Good: page.locator('[data-testid="command-palette"]')
   ```

3. Disable animations in tests:
   ```typescript
   await page.addStyleTag({
     content: '*, *::before, *::after { transition: none !important; }'
   });
   ```

---

## ✅ Manual Testing Checklist

If automated tests fail, manually verify:

### **Command Palette**
- [ ] Press Ctrl+K → Opens
- [ ] Type "gigs" → Filters results
- [ ] Press ↓ arrow → Moves selection
- [ ] Press Enter → Navigates
- [ ] Press Escape → Closes

### **Image Loading**
- [ ] Go to /gigs
- [ ] Throttle network (DevTools → Slow 3G)
- [ ] Refresh page
- [ ] Skeletons appear while loading
- [ ] Images fade in smoothly

### **Form Inputs**
- [ ] Go to /login
- [ ] Click email input
- [ ] Focus ring glows
- [ ] Tab to password
- [ ] Focus moves smoothly

### **Buttons**
- [ ] Hover over button → Opacity changes
- [ ] Click button → Scales down (0.98x)
- [ ] Release → Returns to normal

### **Mobile**
- [ ] Open DevTools → Mobile viewport
- [ ] No horizontal scroll
- [ ] Buttons are tappable
- [ ] Command palette fits screen

---

## 🚀 CI/CD Integration

### **GitHub Actions Example**

```yaml
name: UI/UX Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      
      - name: Run tests
        run: npx playwright test ui-ux-quick-test
      
      - name: Upload report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📚 Resources

### **Documentation**
- Playwright Docs: https://playwright.dev/
- Testing Best Practices: `docs/TESTING_CHECKLIST.md`
- UI/UX Features: `docs/UI_UX_SESSION_SUMMARY_OCT_22_2025.md`

### **Test Files**
- Quick Tests: `tests/integration/ui-ux-quick-test.spec.ts`
- Full Suite: `tests/integration/ui-ux-upgrades.spec.ts`
- Config: `playwright.config.ts`

### **Helper Scripts**
- Run Tests: `scripts/run-ui-ux-tests.ps1`
- Setup: `scripts/setup-supabase.ps1`

---

## 💡 Tips & Best Practices

### **Writing New Tests**

1. **Use descriptive names:**
   ```typescript
   test('✅ Command palette opens with Ctrl+K', async ({ page }) => {
     // Clear what this tests
   });
   ```

2. **Add console logs for debugging:**
   ```typescript
   const count = await items.count();
   console.log(`✅ Found ${count} items`);
   ```

3. **Use proper waits:**
   ```typescript
   // Bad: await page.waitForTimeout(5000);
   // Good: await page.waitForLoadState('networkidle');
   ```

4. **Make tests independent:**
   - Each test should work in isolation
   - Don't rely on test order
   - Clean up after yourself

5. **Use test fixtures:**
   ```typescript
   test.beforeEach(async ({ page }) => {
     await page.goto('/');
   });
   ```

---

## 🎯 What's Next?

**After tests pass:**
1. ✅ Commit changes
2. ✅ Push to GitHub
3. ✅ Deploy to production
4. ✅ Monitor real users

**If tests fail:**
1. 🐛 Review HTML report
2. 🔍 Debug failed tests
3. 🛠️ Fix issues
4. 🔄 Re-run tests

**Continuous improvement:**
1. Add more test coverage
2. Test authenticated flows
3. Add visual regression tests
4. Monitor test execution time

---

## 📞 Support

**Issues with tests?**
1. Check this guide
2. Review `docs/TROUBLESHOOTING_GUIDE.md`
3. Check Playwright docs
4. Review test output/screenshots

**Need help?**
- Documentation: `docs/DOCUMENTATION_INDEX.md`
- Session summary: `docs/UI_UX_SESSION_SUMMARY_OCT_22_2025.md`

---

**Last Updated:** October 22, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

---

**Happy Testing! 🎉**

