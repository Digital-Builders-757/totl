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

---

## 🔍 **QUICK DIAGNOSIS**

| Error Message | Root Cause | Quick Fix |
|---------------|------------|-----------|
| `types/database.ts is out of sync` | Schema drift | `npm run types:regen` |
| `Module not found: Can't resolve '@/lib/supabase/supabase-admin-client'` | Wrong import path | Use `@/lib/supabase-admin-client` |
| `Cannot find module '@/types/database'` | Wrong type import | Use `@/types/supabase` |
| `Property 'role' does not exist on type 'never'` | Database type not imported | Import from `@/types/supabase` |
| `Failed to construct 'URL': Invalid URL` | SafeImage component | Check image src validation |

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
