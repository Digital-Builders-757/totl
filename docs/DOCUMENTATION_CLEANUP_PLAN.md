# Documentation Cleanup & Terminology Update Plan

**Date:** November 18, 2025  
**Purpose:** Comprehensive documentation audit, terminology update, and redundancy removal

---

## 🎯 Goals

1. **Update Terminology:** "Client" → "Career Builder" throughout all docs
2. **Remove Redundancy:** Consolidate duplicate/outdated docs
3. **Update Index:** Fix documentation index to reflect current state
4. **Clean Structure:** Organize and streamline documentation

---

## 📋 Redundant/Outdated Files to Consolidate or Remove

### **Environment Setup (DUPLICATE)**
- ❌ `ENV_SETUP_GUIDE.md` - More detailed, keep this
- ❌ `ENVIRONMENT_SETUP.md` - Less detailed, merge into ENV_SETUP_GUIDE.md or remove

### **Sentry Documentation (TOO MANY - 10+ files)**
**Keep:**
- ✅ `SENTRY_SETUP_GUIDE.md` - Main setup guide
- ✅ `SENTRY_PRODUCTION_SETUP.md` - Production-specific
- ✅ `SENTRY_CONSOLIDATION.md` - Historical reference

**Archive/Remove:**
- ❌ `SENTRY_COMPLETE_SETUP_STATUS.md` - Status doc, outdated
- ❌ `SENTRY_CONNECTION_CHECK.md` - Merge into main guide
- ❌ `SENTRY_ERROR_FIXES_SUMMARY.md` - Historical, archive
- ❌ `SENTRY_ERROR_FIX_EVENT_HANDLERS.md` - Historical fix, archive
- ❌ `SENTRY_SSR_ERRORS_FIX_OCT_23_2025.md` - Historical fix, archive
- ❌ `SENTRY_ERROR_TRACKING_ENHANCEMENT.md` - Merge into main guide
- ❌ `SENTRY_EDGE_FUNCTIONS_SETUP.md` - Merge into main guide

### **Supabase MCP (MULTIPLE FILES)**
**Keep:**
- ✅ `SUPABASE_MCP_SETUP_GUIDE.md` - Main guide
- ✅ `SUPABASE_MCP_QUICK_START.md` - Quick reference

**Archive/Remove:**
- ❌ `SUPABASE_MCP_CONNECTION_TEST.md` - Test doc, outdated
- ❌ `SUPABASE_MCP_FIX_NOV_2025.md` - Historical fix, archive
- ❌ `SUPABASE_MCP_QUERY_RESULTS.md` - Test results, remove

### **Schema Sync (DUPLICATE)**
- ❌ `SCHEMA_SYNC_COMPLETE_OCT_23_2025.md` - Historical completion doc
- ✅ `SCHEMA_SYNC_FIX_GUIDE.md` - Keep as active guide

### **Email (DUPLICATE)**
- ❌ `email-service.md` - Lowercase, less organized
- ✅ `EMAIL_NOTIFICATION_SYSTEM_IMPLEMENTATION.md` - Keep as main guide
- ❌ `EMAIL_SYSTEM_VERIFICATION.md` - Verification doc, merge or archive

---

## ✅ Files to Update with "Career Builder" Terminology

### **High Priority (User-Facing)**
1. `ADMIN_ACCOUNT_GUIDE.md` - Admin guide
2. `TOTL_AGENCY_USER_GUIDE.md` - Main user guide
3. `DATABASE_REPORT.md` - Database documentation
4. `AUTH_STRATEGY.md` - Auth documentation
5. `DEVELOPER_QUICK_REFERENCE.md` - Developer reference

### **Medium Priority (Technical)**
6. `CODING_STANDARDS.md` - Coding standards
7. `TROUBLESHOOTING_GUIDE.md` - Troubleshooting
8. `ONBOARDING.md` - Developer onboarding
9. `TECH_STACK_BREAKDOWN.md` - Tech stack

### **Low Priority (Historical/Reference)**
10. All other docs with "client" references

---

## 🗑️ Files to Archive/Remove

### **Archive (Move to `docs/archive/` if needed)**
- Historical fix docs (Oct/Nov 2025)
- Status/completion docs
- Test/verification docs

### **Delete (Truly Redundant)**
- Duplicate setup guides
- Outdated status docs
- Test result docs

---

## 📊 Current State

**Total Files:** 80+ documentation files  
**Files with "client" references:** 56 files  
**Redundant files identified:** ~15 files  
**Files to update:** ~20 priority files

---

## ✅ Execution Plan

1. **Phase 1:** Update terminology in high-priority docs
2. **Phase 2:** Consolidate/remove redundant files
3. **Phase 3:** Update documentation index
4. **Phase 4:** Final review and cleanup

---

**Status:** Ready to execute

