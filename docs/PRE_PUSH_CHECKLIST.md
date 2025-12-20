# 🚨 CRITICAL ERROR PREVENTION - MANDATORY CHECKS

**BEFORE PUSHING ANY CODE TO DEVELOP OR MAIN, YOU MUST:**

## **1. SCHEMA & TYPES VERIFICATION**
```bash
# Canonical gate (CI-parity)
npm run verify-all

# Daily dev loop (fast lane)
npm run verify-fast
```

## **1.5. IF YOU USED SUPABASE STUDIO / SQL EDITOR FOR SCHEMA CHANGES TODAY**
Studio/SQL Editor can fix the live database but leave the repo migration ledger out of sync. If you touched schema in Studio, do this **the same day**:

```bash
# Reconcile schema drift into a migration
supabase db pull schema_sync_dec17

# Regenerate types so types/database.ts matches the live schema
npm run types:regen
```

## **2. IMPORT PATH VERIFICATION**
**❌ NEVER USE THESE INCORRECT PATHS:**
- `@/lib/supabase/supabase-admin-client` (WRONG - extra `/supabase/`)
- `@/types/database` (WRONG - should be `/types/supabase`)

**✅ ALWAYS USE THESE CORRECT PATHS:**
- `@/lib/supabase-admin-client` (CORRECT)
- `@/types/supabase` (CORRECT)

## **3. COMMON ERRORS TO AVOID**
- **Schema Sync Errors:** `types/database.ts is out of sync with remote schema`
  - **Fix:** Run `npm run types:regen` for correct environment
- **Import Path Errors:** `Module not found: Can't resolve '@/lib/supabase/supabase-admin-client'`
  - **Fix:** Use correct path `@/lib/supabase-admin-client`
- **Type Errors:** `Property 'role' does not exist on type 'never'`
  - **Fix:** Ensure Database type is imported from `@/types/supabase`
- **Build Failures:** Any build that doesn't pass locally
  - **Fix:** Never push code that doesn't build locally

## **4. BRANCH-SPECIFIC REQUIREMENTS**
- **DEVELOP Branch:** Use `npm run types:regen:dev` if needed
- **MAIN Branch:** Use `npm run types:regen:prod` if needed
- **Both Branches:** Must pass `npm run build` before pushing

## **5. EMERGENCY FIXES**
If you encounter these errors:
```bash
# Schema sync error
npm run types:regen && npm run build

# Import path errors - find and fix manually
grep -r "@/lib/supabase/supabase-admin-client" . --exclude-dir=node_modules

# Build failures - fix locally first
npm run build
```

**🚨 CRITICAL RULE: NEVER PUSH CODE THAT DOESN'T BUILD LOCALLY!**

## **6. PRE-COMMIT CHECKLIST REFERENCE**

**ALWAYS run this checklist before pushing:**
1. ✅ `npm run schema:verify:comprehensive`
2. ✅ `npm run build`
3. ✅ `npm run lint`
4. ✅ Check import paths are correct
5. ✅ Verify branch-specific types are generated
6. ✅ Read `docs/PRE_PUSH_CHECKLIST.md` for detailed guidance

**If ANY step fails, DO NOT PUSH until it's fixed!**