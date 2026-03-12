# UI/UX Testing Guide - TOTL Agency

**Date:** October 22, 2025  
**Last Updated:** October 22, 2025  
**Status:** ✅ Production Ready  
**Archived:** March 2026 — Use `audits/UI_UX_SCREENSHOT_REMEDIATION_REPORT_2026-03-03.md` and `qa/README.md` for current guidance.

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

**Last Updated:** October 22, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
