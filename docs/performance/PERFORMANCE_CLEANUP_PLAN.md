# 🚀 Performance Cleanup Plan: Eliminate Reloads, Remove Console Logs, Validate Architecture

**Date:** January 25, 2026  
**Status:** 📋 Planning Phase  
**Priority:** 🔴 Critical (High Impact - Quick Wins)

---

## 🎯 Objectives

1. **Eliminate all page reloads** - Replace with `router.refresh()` + optimistic updates
2. **Remove production console logs** - Create proper logger utility with Sentry integration
3. **Validate RSC architecture** - Ensure largest pages use Server Components for data fetching
4. **Performance validation** - Use Sentry performance traces to identify worst offenders

---

## 📊 Current State Analysis

### **Page Reloads Status**
✅ **GOOD NEWS:** No `window.location.reload()` calls found in `app/` directory!

**Found:**
- 1 instance in `components/auth/auth-timeout-recovery.tsx` (intentional for recovery - keep)
- References in documentation (outdated - need to update)

**Action:** Update documentation to reflect current state.

### **Console Logs Status**
❌ **NEEDS CLEANUP:** 241 console statements found

**Breakdown:**
- `app/` directory: **174 console statements**
- `components/` directory: **67 console statements**

**Distribution:**
- `console.error`: ~140 instances (keep for Sentry, but use logger)
- `console.log`: ~60 instances (remove from production)
- `console.warn`: ~30 instances (keep for dev, use logger)
- `console.debug`: ~11 instances (remove from production)

**Worst Offenders:**
1. `app/talent/dashboard/client.tsx` - 10+ console statements
2. `components/auth/auth-provider.tsx` - 20+ console statements
3. `app/api/stripe/webhook/route.ts` - 15+ console statements
4. `app/client/dashboard/page.tsx` - 8+ console statements

### **RSC Architecture Status**

#### ✅ **Already Using RSC (Correct)**
- `/talent/dashboard/page.tsx` - Server Component with `getTalentDashboardData()`
- `/gigs/page.tsx` - Server Component with parallel queries
- `/gigs/[id]/page.tsx` - Server Component
- `/talent/[slug]/page.tsx` - Server Component

#### ❌ **Needs Conversion (Client Component Doing Data Fetching)**
- `/client/dashboard/page.tsx` - **FULL CLIENT COMPONENT** (1018 lines)
  - Currently fetches data client-side with `useSupabase()`
  - Should be converted to RSC pattern like talent dashboard

#### ⚠️ **Needs Verification**
- `/admin/dashboard/page.tsx` - Need to verify RSC usage
- `/admin/users/page.tsx` - Need to verify RSC usage
- `/admin/gigs/page.tsx` - Need to verify RSC usage

---

## 🛠️ Implementation Plan

### **Phase 1: Create Production Logger Utility** (1-2 hours)

#### **1.1 Create `lib/utils/logger.ts`**

**Requirements:**
- Log levels: `debug`, `info`, `warn`, `error`
- Production mode: Only `error` and `warn` sent to Sentry
- Development mode: All logs to console
- Sentry integration for errors/warnings
- Type-safe API

**Implementation:**
```typescript
// lib/utils/logger.ts
import * as Sentry from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    // Production: only warn and error
    return level === "warn" || level === "error";
  }

  private sendToSentry(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (level === "error") {
      Sentry.captureException(new Error(message), {
        extra: context,
        level: "error",
      });
    } else if (level === "warn") {
      Sentry.captureMessage(message, {
        level: "warning",
        extra: context,
      });
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (!this.shouldLog("debug")) return;
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (!this.shouldLog("info")) return;
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("warn")) return;
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context);
    }
    this.sendToSentry("warn", message, context);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    if (!this.shouldLog("error")) return;
    
    const errorObj = error instanceof Error ? error : new Error(String(error || message));
    
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, errorObj, context);
    }
    
    this.sendToSentry("error", message, {
      ...context,
      error: errorObj,
    });
  }
}

export const logger = new Logger();
```

#### **1.2 Replace Console Statements**

**Strategy:**
1. Start with worst offenders (dashboard, auth-provider)
2. Replace `console.error` → `logger.error()`
3. Replace `console.log` → `logger.info()` (dev only) or remove
4. Replace `console.warn` → `logger.warn()`
5. Replace `console.debug` → `logger.debug()` (dev only)

**Files to Update (Priority Order):**
1. `app/talent/dashboard/client.tsx` (10+ statements)
2. `components/auth/auth-provider.tsx` (20+ statements)
3. `app/api/stripe/webhook/route.ts` (15+ statements)
4. `app/client/dashboard/page.tsx` (8+ statements)
5. All other files systematically

**Automated Replacement Script:**
```bash
# Find all console statements
grep -r "console\." app/ components/ lib/ --include="*.ts" --include="*.tsx" > console-logs.txt

# Manual review and replacement (too risky to automate)
```

---

### **Phase 2: Convert Client Dashboard to RSC** (3-4 hours)

#### **2.1 Create Server Action**

**File:** `lib/actions/dashboard-actions.ts` (extend existing)

```typescript
export async function getClientDashboardData(userId: string) {
  const supabase = createSupabaseServer();
  
  // Parallel queries (like talent dashboard)
  const [clientProfileResult, gigsResult, applicationsResult] = await Promise.all([
    supabase
      .from("client_profiles")
      .select("id, company_name, website, phone, location")
      .eq("user_id", userId)
      .maybeSingle(),
    
    supabase
      .from("gigs")
      .select("id, title, status, created_at, application_deadline, image_url")
      .eq("client_id", userId)
      .order("created_at", { ascending: false }),
    
    supabase
      .from("applications")
      .select(`
        id,
        gig_id,
        talent_id,
        status,
        message,
        created_at,
        updated_at,
        gigs:gig_id (title, category, location, compensation),
        talent_profiles:talent_id (first_name, last_name, location, experience),
        profiles:talent_id (display_name, email_verified, role, avatar_url)
      `)
      .eq("gig_id", gigsResult.data?.[0]?.id || "")
      .order("created_at", { ascending: false }),
  ]);
  
  // Error handling...
  
  return {
    clientProfile: clientProfileResult.data,
    gigs: gigsResult.data || [],
    applications: applicationsResult.data || [],
  };
}
```

#### **2.2 Refactor Client Dashboard Page**

**Current:** `app/client/dashboard/page.tsx` (1018 lines, full client component)

**New Structure:**
```
app/client/dashboard/
├── page.tsx              # Server Component (RSC)
├── client.tsx            # Client Component (UI only)
└── loading.tsx           # Loading skeleton
```

**Server Component (`page.tsx`):**
```typescript
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardClient } from "./client";
import { getBootState } from "@/lib/actions/boot-actions";
import { getClientDashboardData } from "@/lib/actions/dashboard-actions";
import { ONBOARDING_PATH, PATHS } from "@/lib/constants/routes";
import { isRedirectError } from "@/lib/is-redirect-error";

export const dynamic = "force-dynamic";

async function DashboardDataLoader({ userId }: { userId: string }) {
  const dashboardData = await getClientDashboardData(userId);
  return <DashboardClient initialData={dashboardData} />;
}

export default async function ClientDashboardPage() {
  try {
    const boot = await getBootState();
    if (!boot) redirect(`${PATHS.LOGIN}?returnUrl=${encodeURIComponent(PATHS.CLIENT_DASHBOARD)}`);

    if (boot.needsOnboarding) redirect(ONBOARDING_PATH);
    if (boot.nextPath !== PATHS.CLIENT_DASHBOARD) redirect(boot.nextPath);

    return (
      <Suspense fallback={<DashboardClient initialData={null} />}>
        <DashboardDataLoader userId={boot.userId} />
      </Suspense>
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;
    logger.error("[client/dashboard] Error in server component", error);
    redirect(`${PATHS.LOGIN}?returnUrl=${encodeURIComponent(PATHS.CLIENT_DASHBOARD)}`);
  }
}
```

**Client Component (`client.tsx`):**
- Extract all UI logic from current `page.tsx`
- Accept `initialData` prop
- Remove all data fetching (move to server)
- Keep only interactive UI (tabs, modals, forms)

#### **2.3 Benefits**
- ✅ Eliminates client-side data fetching
- ✅ Prevents N+1 query patterns
- ✅ Faster initial page load
- ✅ Better SEO (if needed)
- ✅ Matches talent dashboard pattern

---

### **Phase 3: Verify RSC Architecture** (1-2 hours)

#### **3.1 Audit Largest Pages**

**Checklist for each page:**
- [ ] Is it a Server Component? (`export default async function`)
- [ ] Does it fetch data server-side? (not using `useSupabase()`)
- [ ] Are client components strictly UI? (no data fetching)
- [ ] Are queries parallelized? (`Promise.all`)

**Pages to Verify:**
1. `/admin/dashboard/page.tsx`
2. `/admin/users/page.tsx`
3. `/admin/gigs/page.tsx`
4. `/admin/applications/page.tsx`
5. `/settings/page.tsx`
6. `/client/applications/page.tsx`

#### **3.2 Fix Any Violations**

**If page is client component fetching data:**
- Extract data fetching to Server Action
- Create Server Component wrapper
- Pass data as props to Client Component

---

### **Phase 4: Sentry Performance Validation** (1 hour)

#### **4.1 Enable Performance Traces**

**Already Configured:**
- ✅ `browserTracingIntegration` enabled in `instrumentation-client.ts`
- ✅ `tracesSampleRate: 0.1` (10% production, 100% dev)

#### **4.2 Identify Worst Offenders**

**Sentry Performance Dashboard:**
1. Navigate to Sentry → Performance
2. Filter by route (e.g., `/talent/dashboard`, `/client/dashboard`)
3. Sort by:
   - **LCP (Largest Contentful Paint)** - Target: <2.5s
   - **INP (Interaction to Next Paint)** - Target: <200ms
   - **Total Duration** - Identify slowest routes

**Expected Worst Offenders:**
- `/client/dashboard` (before RSC conversion)
- `/talent/dashboard` (if not optimized)
- `/admin/dashboard` (if not optimized)
- `/gigs` (if pagination not optimized)

#### **4.3 Add Custom Performance Spans**

**For critical operations (using Sentry v8+ startSpan API):**
```typescript
import * as Sentry from "@sentry/nextjs";

// In server actions - use startSpan (not deprecated startTransaction)
return Sentry.startSpan(
  {
    name: "getClientDashboardData",
    op: "db.query",
  },
  async () => {
    // ... query execution ...
    return result;
  }
);
```

**Nested spans for sub-operations:**
```typescript
return Sentry.startSpan(
  {
    name: "getClientDashboardData",
    op: "db.query",
  },
  async () => {
    const [profileResult, gigsResult] = await Promise.all([
      Sentry.startSpan(
        { name: "fetchClientProfile", op: "db.query" },
        () => supabase.from("client_profiles").select(...).maybeSingle()
      ),
      Sentry.startSpan(
        { name: "fetchGigs", op: "db.query" },
        () => supabase.from("gigs").select(...)
      ),
    ]);
    // ...
  }
);
```

#### **4.4 Document Baseline Metrics**

**File:** `docs/PERFORMANCE_BASELINE.md` (update)

**Metrics to Track:**
- LCP per route
- INP per route
- CLS per route
- Total duration per route
- Database query count per route
- Database query duration per route

---

## 📋 Task Checklist

### **Phase 1: Logger Utility**
- [ ] Create `lib/utils/logger.ts` with Sentry integration
- [ ] Replace console statements in `app/talent/dashboard/client.tsx`
- [ ] Replace console statements in `components/auth/auth-provider.tsx`
- [ ] Replace console statements in `app/api/stripe/webhook/route.ts`
- [ ] Replace console statements in `app/client/dashboard/page.tsx`
- [ ] Replace console statements in remaining files (systematic)
- [ ] Update `.cursorrules` to prevent new console statements
- [ ] Add ESLint rule to warn on console statements

### **Phase 2: Client Dashboard RSC**
- [ ] Create `getClientDashboardData()` server action
- [ ] Create `app/client/dashboard/page.tsx` (Server Component)
- [ ] Refactor `app/client/dashboard/client.tsx` (UI only)
- [ ] Create `app/client/dashboard/loading.tsx` (skeleton)
- [ ] Test dashboard functionality
- [ ] Verify no data fetching in client component
- [ ] Verify parallel queries in server action

### **Phase 3: RSC Architecture Verification**
- [ ] Audit `/admin/dashboard/page.tsx`
- [ ] Audit `/admin/users/page.tsx`
- [ ] Audit `/admin/gigs/page.tsx`
- [ ] Audit `/admin/applications/page.tsx`
- [ ] Audit `/settings/page.tsx`
- [ ] Audit `/client/applications/page.tsx`
- [ ] Fix any violations found
- [ ] Document architecture decisions

### **Phase 4: Sentry Performance Validation**
- [ ] Review Sentry Performance dashboard
- [ ] Identify worst performing routes
- [ ] Add custom performance spans to critical operations
- [ ] Document baseline metrics
- [ ] Set up performance alerts (optional)
- [ ] Create performance improvement plan

### **Phase 5: Documentation & Cleanup**
- [ ] Update `MVP_STATUS_NOTION.md` with completion status
- [ ] Update `docs/PERFORMANCE_BASELINE.md` with metrics
- [ ] Update `docs/COMMON_ERRORS_QUICK_REFERENCE.md` with logger usage
- [ ] Remove outdated documentation references to `window.location.reload()`
- [ ] Create architecture decision record for RSC pattern

---

## 🎯 Success Criteria

### **Phase 1: Logger**
- ✅ Zero `console.log` statements in production code
- ✅ All errors logged to Sentry
- ✅ Development logs still visible
- ✅ Type-safe logger API

### **Phase 2: Client Dashboard RSC**
- ✅ Server Component fetches all data
- ✅ Client Component is UI-only
- ✅ Parallel queries implemented
- ✅ Loading states with Suspense
- ✅ No N+1 query patterns

### **Phase 3: RSC Architecture**
- ✅ All largest pages verified as RSC
- ✅ No client components fetching data
- ✅ Architecture documented

### **Phase 4: Performance Validation**
- ✅ Baseline metrics documented
- ✅ Worst offenders identified
- ✅ Performance improvement plan created

---

## ⚠️ Risks & Mitigations

### **Risk 1: Breaking Changes During Logger Migration**
**Mitigation:**
- Start with non-critical files
- Test thoroughly after each file
- Keep console statements temporarily (commented) for rollback

### **Risk 2: Client Dashboard Refactor Complexity**
**Mitigation:**
- Follow exact pattern from talent dashboard (proven)
- Test incrementally (server action → server component → client component)
- Keep old code commented for reference

### **Risk 3: Performance Regression**
**Mitigation:**
- Measure before and after
- Use Sentry performance traces
- Rollback if metrics worsen

---

## 📚 References

- **Architecture Standards:** `docs/ARCHITECTURE_CONSTITUTION.md`
- **Performance Plan:** `docs/PERFORMANCE_OPTIMIZATION_PLAN.md`
- **Performance Baseline:** `docs/PERFORMANCE_BASELINE.md`
- **Common Errors:** `docs/COMMON_ERRORS_QUICK_REFERENCE.md`
- **Talent Dashboard Pattern:** `app/talent/dashboard/page.tsx`
- **Sentry Config:** `instrumentation-client.ts`

---

## 🚀 Estimated Timeline

- **Phase 1:** 1-2 hours (Logger utility + replacements)
- **Phase 2:** 3-4 hours (Client dashboard RSC conversion)
- **Phase 3:** 1-2 hours (Architecture verification)
- **Phase 4:** 1 hour (Sentry validation)
- **Phase 5:** 1 hour (Documentation)

**Total:** 7-10 hours

---

**Next Steps:**
1. Review and approve plan
2. Start with Phase 1 (Logger utility)
3. Proceed incrementally with testing after each phase
4. Document results and update metrics
