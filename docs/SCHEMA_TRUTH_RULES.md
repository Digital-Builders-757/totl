# 🔒 Schema Truth Rules & Workflow

**Last Updated:** August 14, 2025  
**Status:** Production Ready

This document describes the **schema-first workflow** adopted at TOTL Agency to prevent schema drift and ensure our database types in code always remain accurate. By following these rules, we maintain one source of truth for the database and eliminate mismatches between the database, the documentation, and the TypeScript types.

## 📐 Single Source of Truth

The **database schema** is defined and documented in **`database_schema_audit.md`**. This markdown file contains the authoritative description of all tables, columns, and enums in the database. All changes to the database **must begin by updating this file**. Treat it as the specification for our schema – if it's not recorded in the audit, it shouldn't be in the database.

- **Always update the audit file first:** Before writing SQL or running a migration, record the intended schema changes (new tables, modified columns, updated enum values, etc.) in `database_schema_audit.md`. This ensures everyone can review and understand the change in a human-readable format.
- **Never change schema without the audit:** It is strictly disallowed to apply database changes that are not reflected in the audit file. The audit acts as a changelog and reference for the schema's history.

## 📜 Migration Workflow

All schema changes are applied via **Supabase migrations**. We do not manually edit the database schema through the UI or non-versioned scripts.

1. **Document in Audit:** Write the changes in `database_schema_audit.md` (for example, "Add table `projects` with columns ..., update enum `gig_status` to add value 'archived'").
2. **Generate Migration:** Use Supabase CLI to create a migration file, e.g. `npx supabase migration new add_projects_table`. Edit the generated SQL file to implement the changes (CREATE TABLE, ALTER TYPE for enums, etc.), referencing the audit file for the exact intended schema.
3. **Apply Locally:** Run `supabase db reset` (or `db push`) to apply the new migration to your local dev database. This lets you verify the change works as expected.
4. **Update Types:** After applying the migration, regenerate the TypeScript types:  
   ```bash
   npx supabase@v2.33.4 gen types typescript --linked --schema public > types/database.ts
   ```
   (Ensure you are logged in to Supabase CLI or using `--local` if working with the local DB.) This step updates `types/database.ts` to exactly match the new schema.
5. **Review Changes:** In your pull request, include the updated `database_schema_audit.md`, the new migration SQL, and the regenerated `types/database.ts`. These three should consistently represent the same changes. Reviewers will compare the audit file and types to ensure they correspond to the migration.

By following this workflow, any schema change is always accompanied by documentation and type updates, keeping the backend and frontend in lockstep.

## 🔄 Enum Value Synchronization

When adding or modifying enum values in the database, pay special attention to consistency:

* Update the enum definition in the database via a migration (for instance, using `ALTER TYPE ... ADD VALUE` in SQL).
* Reflect the new enum values in **`database_schema_audit.md`** under the **Enums** section. The audit file lists all allowed values for each enum type.
* After running the migration, regenerate `types/database.ts`. The generated types file represents enums as TypeScript union types (e.g., `'draft' | 'published' | 'archived'` for a `gig_status` enum). Verify that this union matches what you documented in the audit.
* Search the codebase for any logic that might depend on specific enum values. Adding a new value might require updating conditional logic or UI elements. The audit documentation makes it easier to locate where enums are used.

Our CI checks will compare the enum values in the audit file against those in `types/database.ts` to catch any discrepancies.

## 🛡 Automated Verification

To prevent human error, we have automation in place:

* **Local Script:** Before committing, run the **`verify-schema-sync.ps1`** script (PowerShell). This script will:

  * Generate a fresh set of types from your current database (local or remote) and diff it against `types/database.ts` to ensure you've regenerated correctly.
  * Warn if `database_schema_audit.md` wasn't updated after the latest migration or if any enum values don't match between the DB and the audit file.
  * Flag any forbidden patterns in the code (like leftover manual type definitions or usage of `any` related to DB data).
* **CI Enforcement:** On every pull request that includes a migration, our GitHub Action **Schema Truth Verification** runs. It will automatically regenerate the types and compare with the committed `types/database.ts`, and run the same verification script. If any inconsistency is found, the CI will fail, blocking the merge. This ensures that no out-of-sync schema or types can reach the main branch.

Make sure to fix any issues the script or CI reports:

* If types are outdated, run the Supabase CLI to regenerate them, and commit the changes.
* If the audit is outdated, bring it up to date by describing the latest schema changes.
* If local interfaces or `any` usages exist, refactor them to use generated types.

## 🚨 Schema Verification Best Practices ⚠️ **UPDATED**

### **When to Run Schema Verification**
- ✅ **Before major releases** - ensure types are in sync
- ✅ **After database migrations** - verify types were regenerated  
- ✅ **When debugging type issues** - check for schema drift
- ✅ **Manual verification** - when you suspect schema drift
- ❌ **NOT in pre-commit hooks** - causes loops and delays
- ❌ **NOT in CI for every PR** - only when migrations change

### **CLI Version Management** ⚠️ **CRITICAL**
```bash
# Always use consistent version across all environments
npx supabase@v2.33.4 gen types typescript --linked --schema public

# Update ALL of these when changing versions:
# 1. CI workflow (.github/workflows/schema-truth-check.yml)
# 2. Package.json scripts
# 3. All verification scripts
# 4. Error messages and troubleshooting guides
```

### **Cross-Platform Script Guidelines** ⚠️ **NEW**
```javascript
// ✅ Good: Use Node.js built-ins
const out = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString("utf8");
writeFileSync(tmp, out, "utf8");

// ❌ Bad: Shell redirection (breaks on Windows)
execSync(`cmd > /dev/null 2>&1`);  // /dev/null doesn't exist on Windows
```

### **PowerShell Script Guidelines** ⚠️ **NEW**
```powershell
# ✅ Good: Plain text without emoji characters
Write-Host "Scanning for issues..." -ForegroundColor Yellow

# ❌ Bad: Emoji characters can cause encoding issues
Write-Host "🔍 Scanning for issues..." -ForegroundColor Yellow
```

## 🎯 Guiding Principles

* **Schema-first:** The database schema drives application development, not the other way around. The truth lives in the schema (and audit file), which then propagates to code via generated types.
* **No manual drift:** Developers should never manually modify `types/database.ts` or create their own versions of those types. The moment something is hard-coded, it risks drifting from the actual schema. Always rely on generation and single-source definitions.
* **Visibility:** The `database_schema_audit.md` provides a clear and readable overview of the schema for any team member or reviewer. It should be kept up-to-date to serve as reliable documentation at all times.
* **Consistent tooling:** All schema-related operations must use the same CLI version and approach across local development, CI/CD, and production environments.

## 🚨 Critical Rules

### **Type Definition Management**
- **NEVER** manually edit `types/database.ts` - only use generated types
- **ALWAYS** regenerate types after database schema changes
- **NEVER** create duplicate interface definitions in components
- **ALWAYS** import types from `types/database.ts`
- **ALWAYS** reference `database_schema_audit.md` for schema truth

### **Database Schema Changes**
- **ALWAYS** create new migration files for schema changes
- **NEVER** edit existing migration files
- **ALWAYS** update `database_schema_audit.md` after schema changes
- **ALWAYS** regenerate types after migrations
- **ALWAYS** test type compatibility

### **Component Development**
- **NEVER** define local interfaces for database entities
- **ALWAYS** use generated types from `types/database.ts`
- **ALWAYS** validate component props against database types
- **ALWAYS** use correct enum values from database schema
- **ALWAYS** create type utilities for complex relationships

### **Error Prevention**
- **NEVER** use `any` types for database entities
- **NEVER** use outdated type definitions
- **NEVER** create duplicate interface definitions
- **NEVER** use wrong enum values
- **ALWAYS** validate type compatibility before implementation

### **Script Development** ⚠️ **NEW**
- **ALWAYS** use consistent CLI versions across all scripts
- **NEVER** use shell redirection in cross-platform scripts
- **ALWAYS** use Node.js built-ins for file operations
- **NEVER** use emoji characters in PowerShell scripts
- **ALWAYS** test scripts on both Windows and Unix environments

## 📋 Implementation Checklist

### **Before Making Any Changes**
- [ ] Check `database_schema_audit.md` for current schema
- [ ] Verify `types/database.ts` is up to date
- [ ] Check for existing interface definitions in target files
- [ ] Review migration history for recent changes

### **After Database Changes**
- [ ] Update `database_schema_audit.md`
- [ ] Regenerate types using `npx supabase@v2.33.4 gen types typescript --linked --schema public > types/database.ts`
- [ ] Remove any duplicate interface definitions
- [ ] Update component imports to use generated types
- [ ] Test type compatibility

### **Component Development**
- [ ] Import types from `types/database.ts`
- [ ] Remove local interface definitions
- [ ] Use correct enum values from database schema
- [ ] Validate form schemas against database types
- [ ] Test type safety

### **Script Development** ⚠️ **NEW**
- [ ] Use consistent CLI version (v2.33.4) in all scripts
- [ ] Use Node.js built-ins instead of shell redirection
- [ ] Avoid emoji characters in PowerShell scripts
- [ ] Test scripts on multiple platforms
- [ ] Update all related scripts when changing CLI version

## 🔧 Verification Commands

### **Pre-commit Verification**
```powershell
# Run the verification script before committing
./scripts/verify-schema-sync.ps1
```

### **Type Generation**
```powershell
# Generate types from local database
npx supabase@v2.33.4 gen types typescript --local > types/database.ts

# Generate types from remote database
npx supabase@v2.33.4 gen types typescript --linked --schema public > types/database.ts
```

### **Database Reset**
```powershell
# Reset local database and apply all migrations
supabase db reset --yes
```

### **Manual Schema Verification** ⚠️ **NEW**
```bash
# Quick status check
npm run schema:check

# Full verification with diff
npm run schema:verify-local

# Pre-commit (no schema verification)
npm run pre-commit
```

## 🚨 Troubleshooting Common Issues

### **CI 404 Errors**
```yaml
# Problem: supabase/setup-cli@v1 getting 404
# Solution: Use known working version
- uses: supabase/setup-cli@v1
  with:
    version: v2.33.4  # Not v2.34.3 or "latest"
```

### **Pre-commit Loops**
```json
// Problem: lint-staged running schema checks
// Solution: Remove from lint-staged, keep manual verification
"lint-staged": {
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"]
  // No schema verification here
}
```

### **PowerShell Encoding Issues**
```powershell
# Problem: Emoji characters causing syntax errors
# Solution: Use plain text
Write-Host "Scanning..." -ForegroundColor Yellow  # Not "🔍 Scanning..."
```

### **Cross-Platform Script Issues**
```javascript
// Problem: /dev/null doesn't exist on Windows
// Solution: Use Node.js built-ins
const out = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString("utf8");
writeFileSync(tmp, out, "utf8");
```

## 📊 Benefits

By adhering to these rules, we guarantee that our front-end, back-end, and documentation all speak the same language regarding data structures. This reduces bugs, avoids runtime errors due to mismatched assumptions, and speeds up development by leveraging type safety to catch issues early.

### **Current Issues Resolved**
- ❌ Type safety compromised
- ❌ Runtime errors possible
- ❌ Inconsistent data handling
- ❌ Maintenance burden increased
- ❌ Schema verification loops
- ❌ CI/CD failures due to version mismatches
- ❌ Cross-platform script incompatibilities

### **After Implementation**
- ✅ Full type safety
- ✅ No runtime type errors
- ✅ Consistent data handling
- ✅ Easier maintenance
- ✅ Automated verification
- ✅ CI/CD enforcement
- ✅ No verification loops
- ✅ Cross-platform compatibility
- ✅ Consistent tooling across environments

---

**Remember: The database schema is the single source of truth. Everything else flows from it. Use consistent tooling and avoid verification loops.** 