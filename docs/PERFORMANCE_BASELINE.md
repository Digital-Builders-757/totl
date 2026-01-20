# Performance Baseline & Optimization Tracking

**Date Created:** January 20, 2026  
**Purpose:** Track Web Vitals baselines and optimization improvements

---

## Measurement Setup

- ✅ **Sentry Web Vitals enabled** (`instrumentation-client.ts` with `browserTracingIntegration`)
- ✅ **Traces sample rate:** 10% production, 100% development
- ✅ **Web Vitals tracked:** LCP, INP, CLS

---

## Baseline Metrics (Pre-Optimization)

### Login Page (`/login`)
- **LCP (Largest Contentful Paint):** _TBD_ (target: < 1.5s)
- **INP (Interaction to Next Paint):** _TBD_ (target: < 100ms)
- **CLS (Cumulative Layout Shift):** _TBD_ (target: < 0.1)
- **First Paint:** _TBD_
- **Time to Interactive:** _TBD_

### Talent Dashboard (`/talent/dashboard`)
- **LCP:** _TBD_ (target: < 2.5s)
- **INP:** _TBD_ (target: < 200ms)
- **CLS:** _TBD_ (target: < 0.1)
- **Shell visible (loading.tsx):** _TBD_ (target: < 500ms)
- **Data fully loaded:** _TBD_ (target: < 1.5s)
- **Query count:** _TBD_ (target: < 3 queries, no N+1)

### Client Dashboard (`/client/dashboard`)
- **LCP:** _TBD_ (target: < 2.5s)
- **INP:** _TBD_ (target: < 200ms)
- **CLS:** _TBD_ (target: < 0.1)
- **Shell visible (loading.tsx):** _TBD_ (target: < 500ms)
- **Data fully loaded:** _TBD_ (target: < 1.5s)
- **Query count:** _TBD_ (target: < 3 queries, no N+1)

### Public Gigs Detail (`/gigs/[id]`)
- **LCP:** _TBD_ (target: < 2s cached, < 3s uncached)
- **INP:** _TBD_ (target: < 200ms)
- **CLS:** _TBD_ (target: < 0.1)

### Public Talent Profile (`/talent/[slug]`)
- **LCP:** _TBD_ (target: < 2s cached, < 3s uncached)
- **INP:** _TBD_ (target: < 200ms)
- **CLS:** _TBD_ (target: < 0.1)

---

## Optimization Phases

### Phase 1: Measurement + Index Verification (Current)
- ✅ Enable Sentry Web Vitals
- ✅ Create baseline ledger
- ⏳ Add route caching configs
- ⏳ Verify RLS predicate indexes

### Phase 2: Dashboard Server Component Migration
- ⏳ Refactor talent dashboard to Server Component
- ⏳ Refactor client dashboard to Server Component
- ⏳ Add parallel data fetching (`Promise.all`)
- ⏳ Add streaming UI (`loading.tsx` + Suspense)

### Phase 3: Bundle & Asset Optimization
- ⏳ Dynamic imports for heavy modules
- ⏳ Image optimization audit
- ⏳ Font optimization (if applicable)

---

## Post-Optimization Metrics

_To be filled after Phase 1-3 completion_

---

## Notes

- All metrics measured via Sentry Web Vitals
- Manual testing also performed for subjective "snappy" feel
- Query performance tracked via Sentry transaction traces
- Index verification via Supabase Performance Advisor
