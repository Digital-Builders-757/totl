# Terminology Update: "Client" → "Career Builder"

**Date:** November 18, 2025  
**Purpose:** Rename "client" to "Career Builder" throughout the UI for clarity

---

## 🎯 Goal

Clarify the three user types:
1. **Admin** = TOTL Agency internal staff (oversees everything)
2. **Career Builder** = Companies who sign up for the platform (currently called "clients")
3. **Talent** = Actors/models who apply to gigs

---

## 📋 Current State

### **Database Structure (NO CHANGES NEEDED)**
- Enum: `user_role` = `'talent' | 'client' | 'admin'`
- Tables: `client_profiles`, `client_applications`
- **Keep database structure as-is** - only change UI text

### **Current Terminology Issues**
- "Client Apps" in admin header is confusing
- "Applications" vs "Client Apps" distinction unclear
- All user-facing text says "client" instead of "Career Builder"

---

## ✅ Implementation Plan

### **Phase 1: Create Display Name Constants**
- Create `lib/constants/user-roles.ts` with display name mappings
- Use constants throughout UI instead of hardcoded strings

### **Phase 2: Update Admin Portal**
- Admin header: "Client Apps" → "Career Builder Applications"
- Update page titles and descriptions
- Update navigation labels

### **Phase 3: Update User-Facing Text**
- All "client" references → "Career Builder"
- Signup pages, dashboards, settings, etc.
- Keep database column/table names unchanged

### **Phase 4: Update Documentation**
- Update all docs to use "Career Builder"
- Keep technical references to `client` in code comments

---

## 🔍 Key Distinctions

### **"Applications" (Admin Portal)**
- **What:** Talent applications to gigs
- **Table:** `applications`
- **Route:** `/admin/applications`
- **Description:** "Talent applying to gigs posted by Career Builders"

### **"Career Builder Applications" (Admin Portal)**
- **What:** Career Builder signup applications
- **Table:** `client_applications`
- **Route:** `/admin/client-applications` (keep route, change label)
- **Description:** "Companies applying to become Career Builders"

---

## 📝 Files to Update

### **High Priority (Admin Portal)**
- `components/admin/admin-header.tsx` - Navigation labels
- `app/admin/client-applications/page.tsx` - Page title
- `app/admin/client-applications/admin-client-applications-client.tsx` - All UI text

### **Medium Priority (User-Facing)**
- `app/client/*` - All client-facing pages
- `app/choose-role/page.tsx` - Role selection
- `app/onboarding/*` - Onboarding flow
- `app/settings/*` - Settings pages

### **Low Priority (Documentation)**
- `docs/ADMIN_ACCOUNT_GUIDE.md`
- `docs/TOTL_AGENCY_USER_GUIDE.md`
- `database_schema_audit.md` (add note about display names)

---

## 🚨 Important Notes

1. **Database Structure Unchanged**
   - Keep enum value as `'client'`
   - Keep table names as `client_profiles`, `client_applications`
   - Only change user-facing display text

2. **Route Names Unchanged**
   - Keep `/admin/client-applications` route
   - Keep `/client/*` routes
   - Only change navigation labels and page titles

3. **Code Comments**
   - Technical comments can still reference `client`
   - User-facing text must say "Career Builder"

---

## ✅ Success Criteria

- [ ] All admin portal labels updated
- [ ] All user-facing pages updated
- [ ] Constants file created for display names
- [ ] Documentation updated
- [ ] No database migrations needed
- [ ] All tests pass

---

**Status:** Ready to implement

