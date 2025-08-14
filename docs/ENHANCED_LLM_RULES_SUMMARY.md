# Enhanced LLM Rules Summary

**Version:** 3.0  
**Date:** August 14, 2025  
**Purpose:** Prevent common LLM mistakes and enforce "Definition of Done"

## 🎯 What Changed

Based on recent issues with prop mismatches, type drift, undefined functions, and **schema verification loops**, we've enhanced the LLM rules with specific prevention mechanisms and debugging guidelines.

## 🚫 Specific Issues Prevented

### 1. **SafeImage Prop Mismatches**
- **Problem:** LLM added `placeholderQuery` prop without updating all call sites
- **Solution:** 
  - ESLint rule blocks `placeholderQuery` usage: `no-restricted-syntax`
  - Prop marked as `@deprecated` in component interfaces
  - Clear prevention rules in LLM config

### 2. **Toast System Type Drift**
- **Problem:** LLM rewrote `use-toast.ts` breaking ActionType consistency
- **Solution:**
  - File marked as "single source of truth" with protection header
  - Specific rules about maintaining ActionType/Action interfaces
  - Use of `React.createElement` instead of JSX to avoid TypeScript issues

### 3. **Undefined Function Calls**
- **Problem:** LLM called `setActiveTab()` without defining the function
- **Solution:**
  - Definition of Done requires checking component props/types first
  - ESLint rules for React hooks and exhaustive dependencies
  - Clear server/client component boundaries

### 4. **Direct Supabase Imports**
- **Problem:** LLM imported `@supabase/supabase-js` directly
- **Solution:**
  - ESLint rule blocks direct imports
  - Clear guidance to use centralized clients
  - Prevention rules in LLM config

### 5. **Schema Verification Loops** ⚠️ **NEW**
- **Problem:** CI failing with 404 errors, pre-commit hooks stuck in loops
- **Root Causes:**
  - CLI version mismatches between local and CI
  - Conflicting verification scripts
  - PowerShell encoding issues with emoji characters
  - `lint-staged` running schema checks during pre-commit
- **Solution:**
  - **Consistent CLI versioning** across all environments
  - **Cross-platform scripts** using Node.js built-ins
  - **Simplified pre-commit hooks** without schema verification
  - **Proper error handling** and debugging output

## 🛡️ New Prevention Mechanisms

### **Definition of Done (DoD)**
Every code change must pass:
```bash
npx tsc --noEmit                    # TypeScript compilation
npx eslint . --ext .ts,.tsx --max-warnings 0  # ESLint with zero warnings
```

### **Schema Verification Guidelines** ⚠️ **NEW**
```bash
# Manual verification (when needed)
npm run schema:verify-local         # Full verification with diff
npm run schema:check               # Quick status check

# Pre-commit (automatic)
npm run pre-commit                 # Only lint + typecheck (no schema verification)

# CI verification (automatic)
# Runs on PRs when migrations change
```

### **Task Prompt Template**
Every LLM request should start with:
```
Before you change anything:
1. Read this entire rules file and follow it strictly
2. Do not invent props or types - if a prop is missing, first update the component type and all call sites
3. Never import @supabase/supabase-js directly - use our clients in lib/
4. No DB calls in client components - mutations must be Server Actions
5. For schema changes: use consistent CLI version (v2.33.4) across all scripts
6. Avoid shell redirection in cross-platform scripts - use Node.js built-ins
7. After changes, ensure this "Definition of Done" is met
```

### **Critical Files to Pin**
These files should be pinned in Cursor for every session:
- `docs/DOCUMENTATION_OVERVIEW.md`
- `database_schema_audit.md`
- `types/supabase.ts`
- `lib/supabase-client.ts`
- `components/ui/safe-image.tsx`
- `hooks/use-toast.ts`
- `TOTL_PROJECT_CONTEXT_PROMPT.md`
- `package.json` (for script consistency)

### **Enhanced ESLint Rules**
- Blocks `placeholderQuery` prop usage
- Enforces import order and type imports
- Prevents direct Supabase imports
- Enforces React hooks rules
- Blocks database calls in client components

## 📋 Usage Instructions

### **For Developers**
1. **Pin the critical files** in Cursor
2. **Use the task prompt template** for every request
3. **Run `npm run dod`** before committing
4. **Check the Definition of Done** checklist
5. **Use manual schema verification** when needed (not in pre-commit)

### **For LLM Assistants**
1. **Always read the entire rules file** before making changes
2. **Follow the Definition of Done** checklist
3. **Check component props/types** before modifying
4. **Use centralized clients** for database access
5. **Maintain server/client boundaries**
6. **Use consistent CLI versions** (v2.33.4) in all scripts
7. **Avoid shell redirection** - use Node.js built-ins for cross-platform compatibility

## 🔧 Validation Commands

```bash
# Quick Definition of Done check
npm run dod

# Full validation (includes build)
npm run verify-all

# Individual checks
npx tsc --noEmit
npx eslint . --ext .ts,.tsx --max-warnings 0
npm run lint
npm run typecheck

# Schema verification (manual only)
npm run schema:verify-local
npm run schema:check
```

## 🚨 Debugging Schema Issues

### **Common Problems & Solutions**

#### **CI 404 Errors**
```bash
# Problem: supabase/setup-cli@v1 getting 404
# Solution: Use known working version
version: v2.33.4  # Not v2.34.3 or "latest"
```

#### **Pre-commit Loops**
```bash
# Problem: lint-staged running schema checks
# Solution: Remove from lint-staged, keep manual verification
"lint-staged": {
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"]
  // No schema verification here
}
```

#### **PowerShell Encoding Issues**
```bash
# Problem: Emoji characters causing syntax errors
# Solution: Use plain text or proper UTF-8 encoding
Write-Host "Scanning..." -ForegroundColor Yellow  # Not "🔍 Scanning..."
```

#### **Cross-Platform Script Issues**
```bash
# Problem: /dev/null doesn't exist on Windows
# Solution: Use Node.js built-ins
const out = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString("utf8");
writeFileSync(tmp, out, "utf8");
```

## 📈 Expected Outcomes

With these enhanced rules:
- ✅ **95% reduction** in prop mismatch errors
- ✅ **Zero type drift** in critical systems
- ✅ **Consistent import patterns** across codebase
- ✅ **Faster PR reviews** with fewer issues
- ✅ **Better developer experience** with clear guardrails
- ✅ **No more schema verification loops**
- ✅ **Cross-platform compatibility** for all scripts

## 🚨 Emergency Override

If you need to bypass these rules for a legitimate reason:
1. Document why the override is needed
2. Create a follow-up task to fix the technical debt
3. Update the rules if the pattern should be allowed

## 🔄 Schema Verification Best Practices

### **When to Run Schema Verification**
- ✅ **Before major releases** - ensure types are in sync
- ✅ **After database migrations** - verify types were regenerated
- ✅ **When debugging type issues** - check for schema drift
- ❌ **NOT in pre-commit hooks** - causes loops and delays
- ❌ **NOT in CI for every PR** - only when migrations change

### **CLI Version Management**
```bash
# Always use consistent version
npx supabase@v2.33.4 gen types typescript --linked --schema public

# Update all scripts when changing versions
# Update CI workflow
# Update package.json scripts
# Update error messages
```

---

**Remember:** These rules are designed to prevent the exact issues that caused PR failures and debugging loops. Following them ensures consistent, maintainable code that compiles and passes all checks without getting stuck in verification cycles.
