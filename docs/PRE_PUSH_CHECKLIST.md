# 🚨 PRE-PUSH CHECKLIST - CRITICAL ERROR PREVENTION

## ⚠️ MANDATORY CHECKS BEFORE PUSHING TO DEVELOP OR MAIN

This checklist prevents the common errors we've spent hours fixing. **ALWAYS** run these checks before pushing any code.

---

## 🔍 **1. SCHEMA & TYPES VERIFICATION**

### **CRITICAL: Database Types Sync**
```bash
# Check if types are in sync with database
npm run schema:verify:comprehensive

# If out of sync, regenerate types
npm run types:regen

# Verify types are correct
npm run types:check
```

**❌ COMMON ERROR:** `types/database.ts is out of sync with remote schema`
**✅ PREVENTION:** Always run schema verification before pushing

---

## 🔍 **2. IMPORT PATH VERIFICATION**

### **CRITICAL: Supabase Client Imports**
```bash
# Check for incorrect import paths
grep -r "@/lib/supabase/supabase-admin-client" . --exclude-dir=node_modules
grep -r "@/types/database" . --exclude-dir=node_modules
```

**❌ COMMON ERRORS:**
- `Module not found: Can't resolve '@/lib/supabase/supabase-admin-client'`
- `Cannot find module '@/types/database'`

**✅ CORRECT PATHS:**
- `@/lib/supabase-admin-client` (NOT `/supabase/supabase-admin-client`)
- `@/types/supabase` (NOT `/types/database`)

---

## 🔍 **3. BUILD VERIFICATION**

### **CRITICAL: Build Must Pass**
```bash
# Test build locally
npm run build

# Check for TypeScript errors
npm run typecheck

# Run linting
npm run lint
```

**❌ COMMON ERRORS:**
- `Module not found` errors
- `Property 'role' does not exist on type 'never'`
- `Failed to construct 'URL': Invalid URL`

**✅ PREVENTION:** Never push code that doesn't build locally

---

## 🔍 **4. BRANCH-SPECIFIC CHECKS**

### **Before Pushing to DEVELOP:**
```bash
# Ensure you're on develop branch
git branch

# Check for uncommitted changes
git status

# Verify types are from dev database
npm run types:regen:dev
```

### **Before Pushing to MAIN:**
```bash
# Ensure you're on main branch
git branch

# CRITICAL: Regenerate types against production database
npm run types:regen:prod

# Verify schema sync
npm run schema:verify:comprehensive
```

---

## 🔍 **5. COMMON ERROR PATTERNS TO AVOID**

### **❌ NEVER DO THESE:**

1. **Import Path Mistakes:**
   ```typescript
   // WRONG
   import { createSupabaseAdminClient } from "@/lib/supabase/supabase-admin-client";
   import type { Database } from "@/types/database";
   
   // CORRECT
   import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
   import type { Database } from "@/types/supabase";
   ```

2. **Schema Mismatches:**
   ```bash
   # WRONG - Don't push without checking schema
   git push origin main
   
   # CORRECT - Always verify schema first
   npm run schema:verify:comprehensive && git push origin main
   ```

3. **Type Generation Issues:**
   ```bash
   # WRONG - Using wrong project reference
   npm run types:regen:prod  # If <PROD_REF> is not set
   
   # CORRECT - Use linked project
   npm run types:regen
   ```

---

## 🔍 **6. EMERGENCY FIXES**

### **If You Get Schema Sync Errors:**
```bash
# 1. Check which branch you're on
git branch

# 2. Regenerate types for correct environment
npm run types:regen:dev    # For develop
npm run types:regen:prod   # For main

# 3. Verify build works
npm run build

# 4. Commit and push
git add types/database.ts
git commit -m "Fix schema sync: regenerate types"
git push origin <branch>
```

### **If You Get Import Path Errors:**
```bash
# 1. Find all incorrect imports
grep -r "@/lib/supabase/supabase-admin-client" . --exclude-dir=node_modules

# 2. Fix each file manually or use find/replace
# Replace: @/lib/supabase/supabase-admin-client
# With:    @/lib/supabase-admin-client

# 3. Test build
npm run build
```

---

## 🔍 **7. AUTOMATED PRE-PUSH HOOK**

### **Add to package.json:**
```json
{
  "scripts": {
    "pre-push": "npm run schema:verify:comprehensive && npm run build && npm run lint"
  }
}
```

### **Or use husky pre-push hook:**
```bash
# Create .husky/pre-push
#!/usr/bin/env sh
npm run schema:verify:comprehensive
npm run build
npm run lint
```

---

## 🎯 **QUICK REFERENCE**

### **Before ANY push:**
1. ✅ `npm run schema:verify:comprehensive`
2. ✅ `npm run build`
3. ✅ `npm run lint`
4. ✅ Check import paths
5. ✅ Verify branch-specific types

### **Emergency Commands:**
```bash
# Fix schema sync
npm run types:regen && npm run build

# Fix import paths
grep -r "@/lib/supabase/supabase-admin-client" . --exclude-dir=node_modules

# Quick build test
npm run build
```

---

## 🚨 **REMEMBER:**
- **Schema sync errors** = Regenerate types for correct environment
- **Import path errors** = Check file paths, use correct imports
- **Build failures** = Fix locally before pushing
- **Type errors** = Verify Database type imports are correct

**NEVER push code that doesn't build locally!**
