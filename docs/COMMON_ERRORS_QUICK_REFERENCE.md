# 🚨 CRITICAL ERROR PREVENTION - MANDATORY CHECKS

**BEFORE PUSHING ANY CODE TO DEVELOP OR MAIN, YOU MUST:**

## **1. SCHEMA & TYPES VERIFICATION**
```bash
# ALWAYS run these commands before pushing
npm run schema:verify:comprehensive
npm run types:check
npm run build
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
- **Import Order Errors:** `import/order` warnings in linting
  - **Fix:** Run `npm run lint -- --fix` or manually reorder imports
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

---

# 🚨 COMMON ERRORS QUICK REFERENCE

## ⚡ EMERGENCY FIXES - COPY & PASTE COMMANDS

### **1. Schema Sync Error**
```bash
# Error: types/database.ts is out of sync with remote schema
npm run types:regen
npm run build
git add types/database.ts
git commit -m "Fix schema sync: regenerate types"
```

### **2. Import Path Error**
```bash
# Error: Module not found: Can't resolve '@/lib/supabase/supabase-admin-client'
# Find all incorrect imports
grep -r "@/lib/supabase/supabase-admin-client" . --exclude-dir=node_modules

# Fix manually: Replace with @/lib/supabase-admin-client
```

### **3. Database Type Error**
```bash
# Error: Cannot find module '@/types/database'
# Find all incorrect imports
grep -r "@/types/database" . --exclude-dir=node_modules

# Fix manually: Replace with @/types/supabase
```

### **4. Build Failure**
```bash
# Error: Build failed because of webpack errors
npm run build
# Fix all errors locally before pushing
```

### **5. Playwright MCP Connection Error**
```bash
# Error: Cannot find module './console' or "No server info found"
# 1. Install packages locally
npm install --save-dev playwright @playwright/test @playwright/mcp --legacy-peer-deps
npx playwright install --with-deps chromium

# 2. Update Cursor MCP config (c:\Users\young\.cursor\mcp.json)
# Add --no-install flag to args array

# 3. Verify command works
npx --no-install @playwright/mcp --help

# 4. Restart Cursor completely
```

**See:** `docs/MCP_QUICK_FIX.md` for detailed steps

### **6. Sentry 406 Not Acceptable Errors**
```bash
# Error: profiles?select=role&id=eq.xxx returned 406 Not Acceptable
# Root Cause: Using .single() when profile might not exist
# Fix: Replace .single() with .maybeSingle() in all profile queries

# Files to check:
# - lib/actions/auth-actions.ts
# - middleware.ts
# - components/auth/auth-provider.tsx

# Pattern to find:
grep -r "\.single()" lib/actions/auth-actions.ts middleware.ts components/auth/

# Replace with:
.single() → .maybeSingle()
```

### **7. Sentry Not Receiving Errors**
```bash
# Error: Errors not appearing in Sentry dashboard
# 1. Check diagnostic endpoint
curl http://localhost:3000/api/sentry-diagnostic

# 2. Verify DSN in .env.local matches project ID 4510191108292609
# 3. Check console for Sentry initialization logs
# 4. Test with: http://localhost:3000/api/test-sentry?type=error

# Common issues:
# - Wrong project ID in DSN (should end in 4510191108292609)
# - DSN not set in .env.local
# - Errors being filtered by beforeSend hooks
```

### **8. Build Error: Cannot find name 'talentProfile'**
```bash
# Error: Type error in middleware.ts - variable out of scope
# Fix: Ensure variables are defined in the same scope where used
# Pattern: Wrap case blocks in braces, check variable scope
```

---

## 🔍 **QUICK DIAGNOSIS**

| Error Message | Root Cause | Quick Fix |
|---------------|------------|-----------|
| `types/database.ts is out of sync` | Schema drift | `npm run types:regen` |
| `Module not found: Can't resolve '@/lib/supabase/supabase-admin-client'` | Wrong import path | Use `@/lib/supabase-admin-client` |
| `Cannot find module '@/types/database'` | Wrong type import | Use `@/types/supabase` |
| `Property 'role' does not exist on type 'never'` | Database type not imported | Import from `@/types/supabase` |
| `Failed to construct 'URL': Invalid URL` | SafeImage component | Check image src validation |
| `Cannot find module './console'` (Playwright MCP) | Corrupted npx cache | Use `--no-install` flag in MCP config |
| `No server info found` (Playwright MCP) | MCP server not connecting | Install locally + restart Cursor |
| `406 Not Acceptable` (Supabase) | Using `.single()` when row might not exist | Replace with `.maybeSingle()` |
| `Cannot find name 'talentProfile'` (TypeScript) | Variable out of scope | Check variable scope, wrap case blocks in braces |
| Errors not in Sentry | Wrong DSN or project ID | Check `/api/sentry-diagnostic`, verify DSN ends in `4510191108292609` |

---

## 🚨 **PRE-PUSH CHECKLIST (30 seconds)**

```bash
# 1. Schema check
npm run schema:verify:comprehensive

# 2. Build test
npm run build

# 3. Lint check
npm run lint

# 4. If all pass, push
git push origin <branch>
```

---

## 🎯 **BRANCH-SPECIFIC COMMANDS**

### **DEVELOP Branch:**
```bash
npm run types:regen:dev
npm run build
git push origin develop
```

### **MAIN Branch:**
```bash
npm run types:regen:prod
npm run build
git push origin main
```

---

## ⚠️ **NEVER DO THESE**

1. ❌ Push code that doesn't build locally
2. ❌ Use `@/lib/supabase/supabase-admin-client` (extra `/supabase/`)
3. ❌ Use `@/types/database` (should be `/types/supabase`)
4. ❌ Skip schema verification before pushing to main
5. ❌ Manually edit `types/database.ts` (it's auto-generated)

---

## ✅ **ALWAYS DO THESE**

1. ✅ Run `npm run build` before pushing
2. ✅ Use correct import paths
3. ✅ Regenerate types for correct environment
4. ✅ Check schema sync before pushing to main
5. ✅ Read `docs/PRE_PUSH_CHECKLIST.md` for full guidance

---

## 🆘 **EMERGENCY CONTACTS**

- **Full Checklist:** `docs/PRE_PUSH_CHECKLIST.md`
- **Troubleshooting:** `docs/TROUBLESHOOTING_GUIDE.md`
- **Schema Guide:** `docs/SCHEMA_SYNC_FIX_GUIDE.md`
- **Project Rules:** `.cursorrules`

**Remember: Fix locally, then push!**
