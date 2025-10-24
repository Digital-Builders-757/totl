# Import Path Best Practices & Error Prevention Guide

## 🎯 Overview

This document outlines best practices for import paths in the TOTL Agency project to prevent common errors like "Invalid or unexpected token" SyntaxErrors and "is not defined" ReferenceErrors.

## 🚨 Common Import Issues & Solutions

### 1. Incorrect Component Paths

**❌ WRONG:**
```tsx
import { ApplyAsTalentButton } from "@/components/ui/apply-as-talent-button";
```

**✅ CORRECT:**
```tsx
import { ApplyAsTalentButton } from "@/components/apply-as-talent-button";
```

**Why:** The `ApplyAsTalentButton` component is located in `components/`, not `components/ui/`.

### 2. Lucide React Icon Issues

**❌ WRONG:**
```tsx
import { UserPlus } from "lucide-react"; // UserPlus doesn't exist in v0.454.0
```

**✅ CORRECT:**
```tsx
import { Users } from "lucide-react"; // Users exists and is semantically appropriate
```

**Why:** Some icons may not exist in certain versions of lucide-react. Always verify icon availability.

### 3. Duplicate Component Files

**❌ WRONG:**
- Having both `components/apply-as-talent-button.tsx` and `components/ui/apply-as-talent-button.tsx`
- This causes import confusion and potential conflicts

**✅ CORRECT:**
- Keep components in their designated locations
- Use consistent import paths throughout the project

## 📁 Project Structure & Import Guidelines

### Component Organization

```
components/
├── ui/                    # shadcn/ui components only
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── card.tsx
│   └── ...
├── auth/                  # Authentication components
├── forms/                 # Form components
├── portfolio/             # Portfolio-related components
├── apply-as-talent-button.tsx  # Custom business components
├── navbar.tsx
└── ...
```

### Import Path Rules

1. **UI Components**: Always import from `@/components/ui/`
   ```tsx
   import { Button } from "@/components/ui/button";
   import { Dialog } from "@/components/ui/dialog";
   ```

2. **Custom Components**: Import from `@/components/`
   ```tsx
   import { ApplyAsTalentButton } from "@/components/apply-as-talent-button";
   import { Navbar } from "@/components/navbar";
   ```

3. **Auth Components**: Import from `@/components/auth/`
   ```tsx
   import { useAuth } from "@/components/auth/auth-provider";
   ```

4. **Form Components**: Import from `@/components/forms/`
   ```tsx
   import TalentSignupForm from "@/components/forms/talent-signup-form";
   ```

## 🔍 Pre-commit Checklist

Before committing code, verify:

- [ ] All import paths are correct
- [ ] No duplicate component files exist
- [ ] All imported icons exist in the current lucide-react version
- [ ] No "Invalid or unexpected token" errors in console
- [ ] All components render without ReferenceErrors

## 🛠️ Debugging Import Issues

### Common Error Messages & Solutions

1. **"Invalid or unexpected token"**
   - Check import paths for typos
   - Verify component files exist at the specified path
   - Look for duplicate files with similar names

2. **"[Component] is not defined"**
   - Verify the component is properly exported
   - Check import path is correct
   - Ensure no duplicate files with conflicting exports

3. **"[Icon] is not defined"**
   - Check if the icon exists in the current lucide-react version
   - Use alternative icons that are available
   - Verify import syntax is correct

### Verification Commands

```bash
# Check for duplicate files
find components/ -name "*apply-as-talent-button*"

# Verify import paths
grep -r "apply-as-talent-button" components/ app/

# Check for UserPlus usage
grep -r "UserPlus" components/ app/
```

## 📋 Sentry Error Filtering

The project includes comprehensive Sentry filtering for common import-related errors:

- `"Particles is not defined"` - External script errors
- `"UserPlus is not defined"` - Lucide React icon issues
- `"Invalid or unexpected token"` - Import path syntax errors

These filters help reduce noise in Sentry while still catching real application errors.

## 🎯 Best Practices Summary

1. **Consistent Paths**: Always use the same import path for the same component
2. **Verify Icons**: Check lucide-react documentation for available icons
3. **No Duplicates**: Avoid creating duplicate component files
4. **Test Imports**: Verify imports work before committing
5. **Use Linting**: Let ESLint catch import issues early
6. **Document Changes**: Update this guide when adding new components

## 🔄 Maintenance

- Review this document when adding new components
- Update import examples when project structure changes
- Add new common errors and solutions as they're discovered
- Keep Sentry filters updated with new error patterns

---

**Last Updated:** October 23, 2025  
**Related Files:** 
- `components/apply-as-talent-button.tsx`
- `components/navbar.tsx`
- `app/choose-role/page.tsx`
- `sentry.client.config.ts`

