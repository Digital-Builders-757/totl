# 🚨 SCHEMA TRUTH RULES - One Source of Truth

## 📋 **CRITICAL RULE: database_schema_audit.md IS THE SINGLE SOURCE OF TRUTH**

**Before making ANY database changes, schema modifications, or type updates, you MUST:**

1. **UPDATE** `database_schema_audit.md` FIRST
2. **SYNC** `types/database.ts` with the audit file
3. **VERIFY** all components use the correct types
4. **TEST** the application works with updated schema

---

## 🔄 **SCHEMA CHANGE WORKFLOW**

### **Step 1: Update Database Schema Audit**
```bash
# 1. Make your database changes via Supabase migrations
supabase migration new <description>

# 2. Update database_schema_audit.md to reflect changes
# 3. Commit the audit file changes
git add database_schema_audit.md
git commit -m "docs: update database schema audit for <change>"
```

### **Step 2: Sync TypeScript Types**
```bash
# 1. Update types/database.ts to match audit file
# 2. Remove any deprecated interfaces
# 3. Update component imports and queries
# 4. Test TypeScript compilation
npx tsc --noEmit
```

### **Step 3: Verify Application**
```bash
# 1. Test build process
npm run build

# 2. Test runtime functionality
npm run dev
# Navigate through key features
```

---

## 📊 **AUDIT FILE STRUCTURE REQUIREMENTS**

The `database_schema_audit.md` file MUST contain:

### **✅ Required Sections:**
- **Executive Summary** - High-level overview
- **Database Overview** - Table counts, relationships
- **Custom Types (Enums)** - All enum definitions
- **Table Details** - Complete table documentation
- **Relationships** - Foreign key mappings
- **Indexes** - Performance optimization details
- **RLS Policies** - Security policies

### **✅ Required Table Information:**
- Column names and data types
- Nullability constraints
- Default values
- Foreign key relationships
- Indexes and constraints
- Purpose and usage notes

---

## 🚫 **FORBIDDEN ACTIONS**

### **❌ NEVER:**
- Make database changes without updating `database_schema_audit.md`
- Update `types/database.ts` without referencing the audit file
- Use `any` types in database-related code
- Create tables/columns not documented in the audit
- Remove audit documentation without corresponding schema changes

### **❌ NEVER ASSUME:**
- The database schema matches the TypeScript types
- Components are using the correct table/column names
- RLS policies are properly configured
- Indexes exist for performance-critical queries

---

## ✅ **MANDATORY VERIFICATION CHECKLIST**

Before committing any database-related changes:

- [ ] **Audit File Updated**: `database_schema_audit.md` reflects all changes
- [ ] **Types Synced**: `types/database.ts` matches audit file exactly
- [ ] **Components Updated**: All imports and queries use correct types
- [ ] **TypeScript Clean**: `npx tsc --noEmit` passes
- [ ] **Build Success**: `npm run build` completes without errors
- [ ] **Runtime Tested**: Key functionality works in development
- [ ] **Documentation**: Changes are documented in commit messages

---

## 🔍 **SCHEMA VERIFICATION COMMANDS**

### **Quick Schema Check:**
```bash
# Verify TypeScript types match audit
npx tsc --noEmit

# Check for any 'any' types in database code
grep -r "any" types/database.ts lib/ app/ --include="*.ts" --include="*.tsx"

# Verify build process
npm run build
```

### **Full Schema Audit:**
```bash
# 1. Generate fresh schema from database
# 2. Compare with database_schema_audit.md
# 3. Update audit file if discrepancies found
# 4. Sync types/database.ts
# 5. Test application
```

---

## 📝 **COMMIT MESSAGE STANDARDS**

### **For Schema Changes:**
```
docs: update database schema audit for <feature>
- Add/remove tables: <table_names>
- Modify columns: <column_changes>
- Update relationships: <relationship_changes>
```

### **For Type Sync:**
```
fix: sync types/database.ts with schema audit
- Remove deprecated interfaces
- Update table definitions
- Fix component type imports
```

---

## 🎯 **IMMEDIATE ACTIONS REQUIRED**

1. **Review Current State**: Ensure `database_schema_audit.md` is complete and accurate
2. **Sync Types**: Verify `types/database.ts` matches audit file exactly
3. **Update Components**: Fix any type mismatches in components
4. **Test Application**: Verify all functionality works with current schema
5. **Document Process**: Share this workflow with team members

---

## 🔗 **RELATED FILES**

- `database_schema_audit.md` - **SINGLE SOURCE OF TRUTH**
- `types/database.ts` - TypeScript type definitions
- `supabase/migrations/` - Database migration history
- `SCHEMA_TYPE_MISMATCHES.md` - Previous discrepancies log
- `IMMEDIATE_ACTIONS_COMPLETED.md` - Action completion log

---

**Remember: The database_schema_audit.md file is SACRED. It must always reflect the actual database state and be the first file updated when making any schema changes.** 