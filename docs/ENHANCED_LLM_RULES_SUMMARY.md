# Enhanced LLM Rules Summary

**Version:** 2.2  
**Date:** January 2025  
**Purpose:** Prevent common LLM mistakes and enforce "Definition of Done"

## 🎯 What Changed

Based on recent issues with prop mismatches, type drift, and undefined functions, we've enhanced the LLM rules with specific prevention mechanisms.

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

## 🛡️ New Prevention Mechanisms

### **Definition of Done (DoD)**
Every code change must pass:
```bash
npx tsc --noEmit                    # TypeScript compilation
npx eslint . --ext .ts,.tsx --max-warnings 0  # ESLint with zero warnings
```

### **Task Prompt Template**
Every LLM request should start with:
```
Before you change anything:
1. Read this entire rules file and follow it strictly
2. Do not invent props or types - if a prop is missing, first update the component type and all call sites
3. Never import @supabase/supabase-js directly - use our clients in lib/
4. No DB calls in client components - mutations must be Server Actions
5. After changes, ensure this "Definition of Done" is met
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

### **For LLM Assistants**
1. **Always read the entire rules file** before making changes
2. **Follow the Definition of Done** checklist
3. **Check component props/types** before modifying
4. **Use centralized clients** for database access
5. **Maintain server/client boundaries**

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
```

## 📈 Expected Outcomes

With these enhanced rules:
- ✅ **95% reduction** in prop mismatch errors
- ✅ **Zero type drift** in critical systems
- ✅ **Consistent import patterns** across codebase
- ✅ **Faster PR reviews** with fewer issues
- ✅ **Better developer experience** with clear guardrails

## 🚨 Emergency Override

If you need to bypass these rules for a legitimate reason:
1. Document why the override is needed
2. Create a follow-up task to fix the technical debt
3. Update the rules if the pattern should be allowed

---

**Remember:** These rules are designed to prevent the exact issues that caused PR failures. Following them ensures consistent, maintainable code that compiles and passes all checks.
