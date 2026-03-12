# 🔍 COMPREHENSIVE QA CHECKLIST - MANDATORY FOR ALL FEATURES

**Status:** CRITICAL - Must be completed before any feature is considered "done"  
**Purpose:** Prevent Sentry errors, ensure type safety, maintain documentation consistency  
**Priority:** MANDATORY  
**Archived:** March 2026 — Use `development/PRE_PUSH_CHECKLIST.md` and `qa/README.md` for current QA. This file preserved for historical reference.

---

## 🚨 MANDATORY PRE-COMMIT CHECKLIST

### **1. TYPE SAFETY & CONSISTENCY** ✅
- [ ] **Database Types**: All components use `Database["public"]["Tables"]["table_name"]["Row"]` types
- [ ] **No Custom Interfaces**: Remove any custom interfaces that duplicate database types
- [ ] **Import Consistency**: All files import types from `@/types/database` (not `types/database.ts`)
- [ ] **TypeScript Strict**: No `any` types used anywhere
- [ ] **Generated Types**: Verify `types/database.ts` is up-to-date with schema
- [ ] **Interface Alignment**: All custom types extend or intersect with database types

### **2. IMPORT PATH VALIDATION** ✅
- [ ] **Correct Paths**: All imports use proper `@/` aliases
- [ ] **No Duplicate Files**: Check for duplicate components (e.g., `apply-as-talent-button.tsx`)
- [ ] **Component Locations**: Components in correct directories (`/components/` vs `/components/ui/`)
- [ ] **Import Resolution**: All imports resolve without errors
- [ ] **Circular Dependencies**: No circular import dependencies

### **3. MOBILE RESPONSIVENESS** ✅
- [ ] **Aspect Ratios**: Use proper aspect ratios instead of fixed heights
- [ ] **CSS Aspect Ratio Classes**: Use custom CSS classes (e.g., `aspect-4-5`) instead of Tailwind arbitrary values (e.g., `aspect-[4/5]`)
- [ ] **Responsive Grids**: Grid layouts work on all screen sizes
- [ ] **Touch Targets**: Minimum 44px touch targets (Apple guidelines)
- [ ] **Text Sizing**: Responsive text sizes with proper breakpoints
- [ ] **Image Optimization**: Proper `sizes` attributes for different screen sizes
- [ ] **Touch Interactions**: Disabled hover effects on touch devices

### **4. SECURITY & PRIVACY** ✅
- [ ] **RLS Compliance**: All database queries respect Row-Level Security
- [ ] **Explicit Column Selection**: No `select("*")` in public-facing queries
- [ ] **Authentication Gates**: Sensitive data protected by auth checks
- [ ] **Data Exposure**: No sensitive user data exposed publicly
- [ ] **Input Validation**: All user inputs properly validated
- [ ] **SQL Injection**: No raw SQL queries (use Supabase query builder)

### **5. ERROR HANDLING & SENTRY** ✅
- [ ] **Error Boundaries**: Proper error handling in all components
- [ ] **Sentry Filtering**: Known development errors filtered out
- [ ] **Graceful Fallbacks**: Fallback UI for failed operations
- [ ] **Loading States**: Proper loading states for async operations
- [ ] **Error Messages**: User-friendly error messages
- [ ] **Console Logging**: Appropriate console logging for debugging

### **6. PERFORMANCE & OPTIMIZATION** ✅
- [ ] **Image Loading**: Optimized image loading with proper `sizes`
- [ ] **Bundle Size**: No unnecessary imports or dependencies
- [ ] **Lazy Loading**: Components lazy-loaded where appropriate
- [ ] **Database Queries**: Efficient queries with proper indexes
- [ ] **Caching**: Appropriate caching strategies implemented
- [ ] **Memory Leaks**: No memory leaks in useEffect cleanup

### **7. ACCESSIBILITY & UX** ✅
- [ ] **Keyboard Navigation**: All interactive elements keyboard accessible
- [ ] **Screen Readers**: Proper ARIA labels and semantic HTML
- [ ] **Color Contrast**: Sufficient color contrast ratios
- [ ] **Focus Management**: Proper focus management and indicators
- [ ] **Loading States**: Clear loading and error states
- [ ] **User Feedback**: Appropriate feedback for user actions

### **8. DOCUMENTATION CONSISTENCY** ✅
- [ ] **Database Schema**: `database_schema_audit.md` reflects all changes
- [ ] **MVP Status**: `MVP_STATUS_NOTION.md` updated with feature status
- [ ] **Feature Docs**: Relevant documentation files updated
- [ ] **Code Comments**: Complex logic properly commented
- [ ] **Type Documentation**: Complex types documented
- [ ] **API Documentation**: Any new APIs documented

### **9. TESTING & VALIDATION** ✅
- [ ] **Manual Testing**: Feature tested on multiple devices/browsers
- [ ] **Edge Cases**: Edge cases and error conditions tested
- [ ] **Data Validation**: All data inputs validated
- [ ] **Authentication**: Auth flows tested for all user types
- [ ] **Mobile Testing**: Mobile responsiveness verified
- [ ] **Performance**: Performance impact assessed

### **10. CODE QUALITY & STANDARDS** ✅
- [ ] **Linting**: No ESLint errors or warnings
- [ ] **Formatting**: Code properly formatted
- [ ] **Naming Conventions**: Consistent naming throughout
- [ ] **File Organization**: Files in correct directories
- [ ] **Component Structure**: Components follow established patterns
- [ ] **State Management**: State managed appropriately

---

## 🔧 AUTOMATED CHECKS

### **Pre-Commit Scripts**
```bash
# Run these commands before every commit
npm run lint          # Check for linting errors
npm run type-check    # Verify TypeScript types
npm run build         # Ensure build succeeds
npm run test          # Run any tests
```

### **Manual Verification Commands**
```bash
# Check for type inconsistencies
grep -r "interface.*Profile" app/ --include="*.tsx" --include="*.ts"
grep -r "select(\"\\*\")" app/ --include="*.tsx" --include="*.ts"
grep -r "any" app/ --include="*.tsx" --include="*.ts"

# Check for duplicate files
find . -name "*apply-as-talent-button*" -type f
find . -name "*safe-image*" -type f
```

---

## 📋 FEATURE COMPLETION CHECKLIST

### **Before Marking Feature as "Complete":**

1. **✅ All QA Checklist Items Completed**
2. **✅ Documentation Updated**
   - [ ] `MVP_STATUS_NOTION.md` updated
   - [ ] Relevant feature docs updated
   - [ ] Database schema docs updated (if applicable)
3. **✅ Code Review Completed**
   - [ ] All files reviewed for consistency
   - [ ] No linting errors
   - [ ] Types properly aligned
4. **✅ Testing Completed**
   - [ ] Manual testing on multiple devices
   - [ ] Edge cases tested
   - [ ] Error conditions tested
5. **✅ Security Review**
   - [ ] No sensitive data exposure
   - [ ] Proper authentication checks
   - [ ] RLS policies respected

---

## 🚨 COMMON PITFALLS TO AVOID

### **Type Safety Issues**
- ❌ Custom interfaces that duplicate database types
- ❌ Using `any` types instead of proper typing
- ❌ Inconsistent import paths
- ❌ Missing type imports

### **CSS & Build Issues**
- ❌ **Tailwind arbitrary values in CSS**: Using `aspect-[4/5]` in CSS files causes PostCSS parser errors
- ❌ **Escaped characters in CSS selectors**: `aspect-\\[4\\/5\\]` syntax is invalid
- ❌ **Missing CSS classes**: Referencing classes that don't exist in CSS
- ❌ **Invalid CSS syntax**: Malformed selectors or properties

### **Mobile Issues**
- ❌ Fixed heights instead of aspect ratios
- ❌ Non-responsive grid layouts
- ❌ Hover effects on touch devices
- ❌ Poor touch target sizes

### **Security Issues**
- ❌ `select("*")` in public queries
- ❌ Missing authentication gates
- ❌ Sensitive data in public views
- ❌ Bypassing RLS policies

### **Performance Issues**
- ❌ Unoptimized images
- ❌ Missing loading states
- ❌ Inefficient database queries
- ❌ Memory leaks in useEffect

### **Documentation Issues**
- ❌ Outdated schema documentation
- ❌ Missing feature documentation
- ❌ Inconsistent MVP status updates
- ❌ Unclear code comments

---

## 📚 REFERENCE DOCUMENTATION

### **Must Reference Before Any Work:**
1. `database_schema_audit.md` - Database schema truth
2. `types/database.ts` - Generated type definitions
3. `docs/DOCUMENTATION_INDEX.md` - Available documentation
4. `MVP_STATUS_NOTION.md` - Current project status
5. `docs/IMPORT_PATH_BEST_PRACTICES.md` - Import guidelines
6. `docs/archive/CRITICAL_SECURITY_FIXES_OCT_24_2025.md` - Security patterns

### **Must Update After Any Work:**
1. `MVP_STATUS_NOTION.md` - Feature completion status
2. Relevant feature documentation in `docs/`
3. `database_schema_audit.md` (if database changes)
4. `types/database.ts` (regenerate if schema changes)

---

## 🎯 SUCCESS CRITERIA

A feature is considered **COMPLETE** only when:

1. **✅ All checklist items are verified**
2. **✅ No Sentry errors introduced**
3. **✅ All documentation is current**
4. **✅ Types are consistent throughout**
5. **✅ Mobile experience is optimal**
6. **✅ Security standards are met**
7. **✅ Performance is acceptable**
8. **✅ Code quality standards are met**

---

## 🔄 CONTINUOUS IMPROVEMENT

This checklist should be:
- **Updated** when new issues are discovered
- **Referenced** before every feature development
- **Completed** before every commit
- **Reviewed** regularly for completeness

---

**Remember: It's better to spend extra time on QA than to fix production issues later!**

---

*Last Updated: October 24, 2025*  
*Status: MANDATORY - Use for all features*
