# 🔐 Security Standards & Automated Checks

**Last Updated:** January 2025  
**Status:** Production Ready

## Overview

This document explains how TOTL Agency enforces security standards and coding best practices through automated checks that run before every commit and during development.

## 🚨 Critical Security Rules

### **1. Always Use `getUser()` Instead of `getSession()`**

**❌ NEVER DO THIS - Security Risk:**
```typescript
// ❌ WRONG - Insecure! Uses cached session data
const { data: { session } } = await supabase.auth.getSession();
if (session?.user) {
  const userId = session.user.id; // Potentially tampered data!
}
```

**✅ ALWAYS DO THIS - Secure:**
```typescript
// ✅ CORRECT - Authenticates with Supabase Auth server
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const userId = user.id; // Verified by Supabase Auth server
}
```

### **2. Never Use `any` Types**
- Always use proper TypeScript types from `@/types/supabase`
- Use generated database types instead of `any`

### **3. Proper Component Architecture**
- Server components: No React hooks, data fetching only
- Client components: Must have `"use client"` directive
- Never import `next/headers` in client components

## 🔍 Automated Checks

### **Pre-Commit Checks**

Every commit automatically runs these checks via `npm run pre-commit`:

1. **Security Standards Check** (`scripts/security-standards-check.ps1`)
   - Detects `getSession()` usage (blocks commit)
   - Finds `any` type usage (warning)
   - Checks for server-only imports in client components (blocks commit)
   - Detects missing `"use client"` directives (warning)
   - Scans for hardcoded secrets (blocks commit)

2. **Import Path Validation**
   - Ensures correct `@/types/supabase` imports
   - Validates Supabase client import paths

3. **TypeScript Compilation**
   - Runs `tsc --noEmit` to catch type errors
   - Blocks commit if compilation fails

4. **Build Verification**
   - Runs `npm run build` to ensure production build works
   - Blocks commit if build fails

### **Manual Checks**

You can run individual checks manually:

```bash
# Security standards check only
npm run security:check

# Full pre-commit check suite
npm run pre-commit

# TypeScript compilation check
npm run typecheck

# Linting check
npm run lint
```

## 🛠️ How It Works

### **Git Hooks (Optional)**

If you want automatic checks on every commit, install git hooks:

```bash
# Install husky (if not already installed)
npm run prepare

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run pre-commit"
```

### **CI/CD Integration**

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs similar checks:

- Linting
- Type checking  
- Build verification
- Import path validation

## 📋 Checklist for Developers

### **Before Every Commit:**
- [ ] Run `npm run security:check` to verify security standards
- [ ] Run `npm run pre-commit` for full validation
- [ ] Fix any errors before committing
- [ ] Address warnings when possible

### **When Adding Authentication:**
- [ ] Use `getUser()` instead of `getSession()`
- [ ] Verify user data is properly typed
- [ ] Test authentication flow works correctly

### **When Creating Components:**
- [ ] Add `"use client"` to components using React hooks
- [ ] Keep server components free of client-side code
- [ ] Use proper TypeScript types (no `any`)

### **When Working with Database:**
- [ ] Use generated types from `@/types/supabase`
- [ ] Follow RLS patterns for security
- [ ] Test queries work with proper authentication

## 🚫 What Gets Blocked

The automated checks will **BLOCK COMMITS** for:

1. **Security Issues:**
   - `getSession()` usage in server code
   - Hardcoded API keys or secrets
   - Server-only imports in client components

2. **Build Issues:**
   - TypeScript compilation errors
   - Build failures
   - Wrong import paths

3. **Architecture Violations:**
   - Missing `"use client"` in components using hooks
   - Improper component boundaries

## ⚠️ Warnings (Non-Blocking)

These issues generate warnings but don't block commits:

- `any` type usage (should be fixed for better type safety)
- Import order issues (cosmetic, but good practice)
- Missing `"use client"` directives (may cause runtime errors)

## 🔧 Troubleshooting

### **Common Issues:**

**"getSession() usage detected"**
- Replace `getSession()` with `getUser()`
- Update `session?.user` to `user`
- Update `session.user.id` to `user.id`

**"any type usage detected"**
- Import proper types from `@/types/supabase`
- Use generated database types
- Add proper TypeScript interfaces

**"Build failed"**
- Check TypeScript errors: `npm run typecheck`
- Verify all imports are correct
- Ensure environment variables are set

### **Bypassing Checks (Emergency Only)**

If you need to bypass checks for emergency fixes:

```bash
# Skip pre-commit checks (NOT RECOMMENDED)
git commit --no-verify -m "emergency fix"
```

**⚠️ Only use this for true emergencies and fix the issues immediately after!**

## 📚 Reference Documentation

- **Coding Standards:** `docs/CODING_STANDARDS.md`
- **Security Configuration:** `docs/SECURITY_CONFIGURATION.md`
- **Database Report:** `docs/DATABASE_REPORT.md`
- **Troubleshooting Guide:** `docs/TROUBLESHOOTING_GUIDE.md`

## 🤝 Contributing

When contributing to TOTL Agency:

1. **Read the coding standards** before starting
2. **Run security checks** before committing
3. **Follow the established patterns** for authentication and data access
4. **Ask questions** if you're unsure about security implications

Remember: **Security is everyone's responsibility!** 🛡️
