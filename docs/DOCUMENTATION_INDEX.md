# TOTL Agency — Documentation Spine (3-Layer Source of Truth)

**Last Updated:** February 26, 2026

This document defines the **single, strict documentation spine** for TOTL Agency. Everything else is **reference** or **archive**.

---

## 📁 Project Organization

### **Root Directory** (Critical Files Only)
These files remain in the project root for easy access:

| File | Purpose |
|------|---------|
| `README.md` | Project overview and setup instructions |
| `AGENT_ONBOARDING.md` | **🤖 NEW** - AI agent quick-start guide (read this first!) |
| `TOTL_PROJECT_CONTEXT_PROMPT.md` | **Mandatory** project rules, pitfalls, and pre-change checklist |
| `database_schema_audit.md` | Schema audit (**must match** `supabase/migrations/**` + generated `types/database.ts`) |
| `MVP_STATUS_NOTION.md` | Current MVP status and next priorities |
| `PROJECT_STATUS_REPORT.md` | Roadmap position & functionality assessment |
| `PAST_PROGRESS_HISTORY.md` | **NEW** 📚 - Complete history of all accomplishments and milestones |
| `notion_update.md` | Notion update tracking |

### **docs/ Directory** (All Other Documentation)
All other documentation has been organized into the `docs/` folder with the following structure:

| Directory | Purpose |
|-----------|---------|
| `docs/releasenotes/` | **📦 NEW** - Versioned release notes (see `releasenotes/README.md`) |
| `docs/guides/` | User guides, developer guides, setup instructions |
| `docs/development/` | Coding standards, type safety, development practices |
| `docs/features/` | Feature implementation documentation |
| `docs/troubleshooting/` | Error fixes, debugging guides, common issues |
| | `AUTH_BREADCRUMB_ANALYSIS_REPORT.md` | Comprehensive analysis of auth breadcrumb strings and debugging infrastructure |
| | `AUTH_SESSION_MISSING_ERROR_FIX.md` | Fix for AuthSessionMissingError Sentry noise (session gate + route-aware handling) |
| | `AUTH_SESSION_MISSING_ERROR_FIX_SUMMARY.md` | Final implementation summary with acceptance criteria |
| `docs/performance/` | Performance optimization documentation |
| `docs/security/` | Security configuration and standards |
| `docs/audits/` | Audit reports and implementation summaries |
| `docs/contracts/` | Domain contracts (Layer 2 source of truth) |
| `docs/journeys/` | User journeys (Layer 3 source of truth) |
| `docs/diagrams/` | Architecture diagrams and visual documentation |
| `docs/tests/` | Test documentation and matrices |
| `docs/archive/` | Historical / superseded documentation |

**Archive policy:** Historical / one-off reports and superseded plans live in `docs/archive/`. Prefer the non-archived docs unless you are investigating history/regressions.

**Root hygiene note (Feb 18, 2026):** non-canonical root docs were consolidated into `docs/archive/`:
- `docs/archive/BUILD_AND_AUDIT_REFERENCE.md`
- `docs/archive/BUILD_PRERENDER_FIX_REFERENCE.md`
- `docs/archive/INSTRUMENTATION_AND_SCRIPTS_REFERENCE.md`
- `docs/archive/DEBUG_MISSING_API_KEY_PLAN_JAN_2025.md`
- `docs/archive/SDA_DELIVERABLES_REPORT.md`
- `docs/archive/SDA_EXECUTIVE_SUMMARY.md`

---

## 🧠 Source of Truth Spine (3 layers)

### **Layer 1 — Global Laws + Wiring + Security (canonical)**
- `ARCHITECTURE_CONSTITUTION.md` (non-negotiables; red-zone rules)
- `ARCHITECTURE_SOURCE_OF_TRUTH.md` (canonical modules + "no duplicate brains" laws)
- `OFF_SYNC_INVENTORY.md` (duplicate/conflicting primitives; winners declared)
- `POLICY_MATRIX_APPROACH_B.md` (🚨 **NEW** - Locked access/visibility policy matrix - Approach B + G1)
- `diagrams/*` (airport model, wiring, flows)

### **Layer 2 — Domain Contracts (canonical)**
- `contracts/INDEX.md`

### **Layer 3 — Journeys (canonical acceptance tests)**
- `journeys/INDEX.md`

---

## 📚 Reference Docs (useful, non-authoritative)

### **🔐 Authentication & Security**
- `AUTH_DATABASE_TRIGGER_CHECKLIST.md` - **🚨 CRITICAL** - Pre-flight checklist for auth changes (Oct 2025)
- `contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` - **✅ CANONICAL** - Auth bootstrap, routing-safe states, and recovery invariants
- `tests/AUTH_BOOTSTRAP_TEST_MATRIX.md` - **✅ CANONICAL** - Scenario-to-proof ledger for auth/bootstrap coverage
- `AUTH_QUERY_PATTERN_FIX_NOV_2025.md` - Query discipline migration (`.single()` vs `.maybeSingle()`) and remediation notes
- `archive/AUTH_REDIRECT_FIX_NOV_2025.md` - Historical redirect fix notes (Nov 2025)
- `archive/AUTH_LEGACY_INDEX.md` - Legacy auth doc map (historical analyses/summaries)
- `troubleshooting/AUTH_TIMEOUT_RECOVERY_IMPLEMENTATION.md` - Auth timeout recovery implementation (8-second timeout guard + recovery UI)
- `audits/AUTH_REDIRECT_END_TO_END_AUDIT.md` - Complete end-to-end audit of login -> redirect pipeline (Jan 2026)
- `AUTH_THREE_TRUTHS_LOGGING_IMPLEMENTATION.md` - **✅ NEW** - Three truths logging implementation (proves session is cookie-backed end-to-end, Jan 2026)
- `THREE_TRUTHS_TESTING_GUIDE.md` - **✅ NEW** - Testing guide for three truths logging (Jan 2026)
- `THREE_TRUTHS_TEST_SUMMARY.md` - **✅ NEW** - Quick reference summary for three truths testing (Jan 2026)
- `AUTH_*.md` stubs - Stable links that forward to archived auth history in `docs/archive/`
- `SECURITY_CONFIGURATION.md` - Complete security configuration and fixes guide
- `SECURITY_STANDARDS_ENFORCEMENT.md` - **🔐 NEW** - Automated security checks and enforcement (Jan 2025)
- `SUPABASE_MCP_SETUP_GUIDE.md` - **✅ NEW** - Supabase MCP server setup and configuration (Nov 2025)
- `SUPABASE_MCP_QUICK_START.md` - **✅ NEW** - Quick start guide for Supabase MCP (Nov 2025)
- `SUPABASE_API_KEY_FIX.md` - **✅ NEW** - Supabase API key fix overview and problem statement (Jan 2025)
- `SUPABASE_API_KEY_FIX_IMPLEMENTATION.md` - **✅ NEW** - Supabase API key diagnostics and environment variable detection implementation (Jan 2025)
- `SUPABASE_API_KEY_FIX_TESTING_GUIDE.md` - **✅ NEW** - Testing guide for Supabase API key diagnostics (Jan 2025)

### **💳 Payment & Subscription System**
- `STRIPE_SUBSCRIPTION_PRD.md` - **💳 NEW** - Complete product requirements document for Stripe subscription system (Nov 2025)
- `STRIPE_IMPLEMENTATION_PLAN.md` - **💳 NEW** - Detailed implementation plan and Stripe dashboard setup guide (Nov 2025)
- `STRIPE_TROUBLESHOOTING.md` - **💳 UPDATED** - Living log of common Stripe integration issues and fixes (Nov 2025)
- `STRIPE_WEBHOOKS_RUNBOOK.md` - **✅ NEW** - Operational runbook for Stripe webhook debugging (Dec 2025)
- `STRIPE_LIVE_SUBSCRIPTIONS_PRD.md` - **NEW** - Live-mode migration and subscription launch plan (Nov 2025)
- `plans/STRIPE_WEBHOOK_ORPHANED_CUSTOMER_PLAN.md` - **✅ NEW** - Design plan for handling orphaned Stripe webhook events (Feb 2026)
- `plans/STRIPE_WEBHOOK_ORPHANED_CUSTOMER_IMPLEMENTATION.md` - **✅ NEW** - Implementation summary for orphaned customer webhook handling (Feb 2026)

### **🚨 Critical Error Prevention**
- `PRE_PUSH_CHECKLIST.md` - **🚨 CRITICAL** - Mandatory checklist to prevent common errors before pushing (Jan 2025)
- `COMMON_ERRORS_QUICK_REFERENCE.md` - **⚡ UPDATED** - Quick copy/paste fixes for common errors (Nov 2025 - added Stripe errors, Jan 2026 - added Bugbot fixes)
- `BUGBOT_FIXES_PLAN.md` - **✅ NEW** - Comprehensive plan and implementation for Cursor Bugbot error handling fixes (Jan 2026)
- `TALENT_DASHBOARD_UPGRADES_IMPLEMENTATION.md` - **✅ NEW** - Talent dashboard resilience upgrades (infinite loading fix, API key diagnostics, Dec 2025)
- `SUPABASE_API_KEY_FIX_IMPLEMENTATION.md` - **✅ NEW** - Supabase API key diagnostics and environment variable detection implementation (Jan 2025)
- `SUPABASE_API_KEY_FIX.md` - **✅ NEW** - Supabase API key fix overview and problem statement (Jan 2025)
- `SUPABASE_API_KEY_FIX_TESTING_GUIDE.md` - **✅ NEW** - Testing guide for Supabase API key diagnostics (Jan 2025)
- `AUTH_TIMEOUT_RECOVERY_IMPLEMENTATION.md` - **✅ NEW** - Auth timeout recovery implementation (8-second timeout guard + recovery UI, Jan 2025)
- `DEBUG_NETWORK_INITIATOR.md` - **✅ NEW** - Guide for using Network tab Initiator column to debug API calls (Jan 2025)
- `INFINITE_LOADING_DEBUG_PLAN.md` - **✅ NEW** - Debug plan for infinite loading spinner issues (Jan 2025)

### **👨‍💼 Admin & User Management**
- `ADMIN_ACCOUNT_GUIDE.md` - Complete admin account setup and management
- `ADMIN_VISIBILITY_AUDIT_REPORT.md` - **✅ NEW** - Comprehensive audit report for admin profile viewing fixes (Dec 2025)
- `ADMIN_VISIBILITY_IMPLEMENTATION_SUMMARY.md` - **✅ NEW** - Implementation summary for admin profile visibility feature (Dec 2025)
- `TOTL_AGENCY_USER_GUIDE.md` - User guide for talent and Career Builders

### **🗄️ Database & Backend**
- `DATABASE_REPORT.md` - Database structure and analysis
- `DATABASE_TABLE_COUNT_RECONCILIATION.md` - **✅ NEW** - Canonical source of truth for table counts (13 tables: 8 core + 5 supporting) with CI enforcement
- `SUPABASE_PERFORMANCE_FIX_GUIDE.md` - **✅ UPDATED** - Performance optimization guide (database + application-level fixes, Jan 2025)
- `PERFORMANCE_OPTIMIZATION_PLAN.md` - **✅ NEW** - Complete performance optimization plan (Approach A+ - Measurement-First + Incremental Wins, Jan 2026)
- `PERFORMANCE_OPTIMIZATION_IMPLEMENTATION.md` - **✅ NEW** - Performance optimization implementation summary (Phase 1 complete, Jan 2026)
- `PERFORMANCE_BASELINE.md` - **✅ NEW** - Performance baseline metrics tracking and optimization phases (Jan 2026)
- `PERFORMANCE_CLEANUP_PLAN.md` - **✅ NEW** - Performance cleanup plan: eliminate reloads, remove console logs, validate RSC architecture (Jan 2026)
- `PERFORMANCE_CLEANUP_IMPLEMENTATION_SUMMARY.md` - **✅ NEW** - Performance cleanup implementation summary: logger utility, console replacement, client dashboard RSC conversion (Jan 2026)
- `ROUTE_CACHING_STRATEGY.md` - **✅ UPDATED** - Route-by-route caching strategy documentation (ISR for public, dynamic for routes using createSupabaseServer(), Jan 2026)
- `ISR_TO_DYNAMIC_MIGRATION_PLAN.md` - **✅ NEW** - ISR to dynamic migration plan (MVP honesty mode - routes using cookies must be dynamic, Jan 2026)
- `SCHEMA_SYNC_FIX_GUIDE.md` - Fix schema drift and CI verification (Oct 2025)
- `SQL_RLS_POLICY_CREATION_GUIDE.md` - **🚨 CRITICAL** - PostgreSQL RLS policy creation guide (Nov 2025)

### **🎨 Features & Implementation**
- `STATUS_BADGE_SYSTEM.md` - 🎨 **NEW** - Comprehensive status badge system with 25+ variants (Nov 2025)
- `UI_LAYOUT_CONTRACT.md` - 🎨 **NEW** - Canonical Terminal Kit (PageShell/PageHeader/SectionCard/DataTableShell) + mobile safety rules (Dec 2025)
- `TOTL_ENHANCEMENT_IMPLEMENTATION_PLAN.md` - 🚀 **NEW** - Comprehensive enhancement roadmap for "sellable for millions" marketplace (Jan 2025)
- `UI_VISUAL_LANGUAGE.md` - 🎨 **NEW** - Visual design system and component guidelines (Jan 2025)
- `BOOKING_FLOW_IMPLEMENTATION.md` - Booking workflow implementation
- `PORTFOLIO_GALLERY_IMPLEMENTATION.md` - Portfolio gallery feature (complete guide)
- `PORTFOLIO_HOVER_EFFECTS_IMPLEMENTATION.md` - Premium hover effects on portfolio tiles (Oct 2025)
- `COMMAND_PALETTE_IMPLEMENTATION.md` - Global command palette (⌘K) implementation (Oct 2025)
- `FORM_INPUT_POLISH_IMPLEMENTATION.md` - Form input polish with floating labels & animations (Oct 2025)
- `PROFILE_IMAGE_UPLOAD_SETUP.md` - Profile image upload system
- `GIG_IMAGE_UPLOAD_FIX.md` - **✅ NEW** - Gig image upload implementation report (Jan 2026)
- `GIG_IMAGE_UPLOAD_SECURITY_AUDIT.md` - **✅ NEW** - Complete security audit for gig image upload system (Jan 2026)
- `GIG_IMAGE_UPLOAD_IMPLEMENTATION_SUMMARY.md` - **✅ NEW** - Implementation summary and testing checklist (Jan 2026)
- `GIG_IMAGE_UPLOAD_HARDENING.md` - **✅ NEW** - Security hardening improvements (crypto.randomUUID + path ownership assertion, Jan 2026)
- `GIG_IMAGE_UPLOAD_ERROR_DEBUGGING.md` - **✅ NEW** - Debugging guide for upload errors (Jan 2026)
- `APPLICATION_SUBMISSION_406_ERROR_REPORT.md` - Application submission error fixes
- `CLIENT_TALENT_VISIBILITY.md` - Clarifies which talent clients actually see and why there is no public directory (must align with `POLICY_MATRIX_APPROACH_B.md`)
- `APPROACH_B_IMPLEMENTATION.md` - ✅ **COMPLETE** - Implementation tracker for Approach B policy alignment (PR1-5 complete)
- `COPY_MIGRATION_PLAN.md` - 📋 **NEW** - Copy migration plan: Modeling → Professional Talent Platform (3-tier PR strategy)
- `PR1_COPY_MIGRATION_SUMMARY.md` - ✅ **COMPLETE** - PR1 summary: Tier A safe swaps (copy-only changes)
- `PR1_SUMMARY.md` - ✅ **COMPLETE** - PR1 summary: Truthful UI surfaces (verification checklist + acceptance criteria)
- `PR2_SUMMARY.md` - ✅ **COMPLETE** - PR2 summary: Control plane alignment (middleware + routing changes)
- `PR3_SUMMARY.md` - ✅ **COMPLETE** - PR3 summary: Locks + data shape (Option B - no migrations, query discipline)
- `PR4_PLAN.md` - ✅ **COMPLETE** - PR4 plan: Query strategy cleanup (remove enumeration patterns)
- `PR4_SUMMARY.md` - ✅ **COMPLETE** - PR4 summary: Query strategy cleanup (bounded candidate queries)
- `PR5_SUMMARY.md` - ✅ **COMPLETE** - PR5 summary: Marketing page conversion + copy cleanup
- `VERIFICATION_AUDIT_POST_PR1-3.md` - ✅ **NEW** - Post-PR1-3 verification audit report (compliance score: 95% → 100%)
- `CLIENT_ACCOUNT_FLOW_PRD.md` - PRD for the unified signup → role-selection and client application flow
- `TALENT_DASHBOARD_DATA_HOOK_GUIDE.md` - Talent dashboard auth/data pattern (Phase 1-4)

### **🔧 Development & Code Quality**
- `TYPE_SAFETY_IMPROVEMENTS.md` - 🎯 **CRITICAL** - Complete TypeScript type safety guide (Nov 2, 2025)
- `TYPESCRIPT_COMMON_ERRORS.md` - ⚡ **QUICK REFERENCE** - Common TypeScript errors & instant solutions (Nov 2, 2025)
- `TYPESCRIPT_REFACTOR_NOVEMBER_2025.md` - 📋 **NEW** - Complete refactor summary & learnings (Nov 2, 2025)
- `TYPES_SYNC_PREVENTION_SYSTEM.md` - 🚨 **CRITICAL** - Complete types synchronization prevention system (Oct 24, 2025)
- `COMPREHENSIVE_QA_CHECKLIST.md` - 🚨 **MANDATORY** - Complete QA checklist for all features (Oct 24, 2025)
- `CSS_BEST_PRACTICES.md` - 🚨 **CRITICAL** - CSS best practices to prevent build failures (Oct 24, 2025)
- `NEXTJS_15_COOKIES_ERROR_FIX.md` - 🚨 **CRITICAL** - Next.js 15 App Router cookies error fix (Oct 24, 2025)
- `IMPORT_PATH_BEST_PRACTICES.md` - **NEW** ✅ - Import path best practices and error prevention (Oct 23, 2025)
- `DASHBOARD_MOBILE_DENSITY_GUIDE.md` - **✅ NEW** - Shared mobile-first dashboard chrome and density contract (Feb 2026)
- `development/MOBILE_UX_AUDIT_SCREEN_INVENTORY.md` - **✅ NEW** - Canonical list of screens/routes to audit for mobile launch polish (Admin/Client/Talent/User/Auth) (Feb 2026)
- `development/MOBILE_UX_QA_CHECKLIST.md` - **✅ NEW** - Route-by-route mobile QA checklist enforcing the dashboard density contract (Feb 2026)
- `CODING_STANDARDS.md` - Coding standards and best practices
- `TROUBLESHOOTING_GUIDE.md` - Common issues and solutions
- `EMAIL_NOTIFICATION_SYSTEM_IMPLEMENTATION.md` - Complete email notification system
- `SIGN_OUT_IMPROVEMENTS.md` - Sign-out functionality improvements
- `LOGIN_PAGE_STYLING_IMPROVEMENTS.md` - Login page styling improvements (Oct 2025)

### **🛠️ Development & Setup**
- `DEVELOPER_QUICK_REFERENCE.md` - Quick reference for developers
- `ENV_SETUP_GUIDE.md` - Environment setup instructions (consolidated)
- `ENV_VARIABLES_COMPLETE_LIST.md` - Full environment variables reference (names, where to find them, templates)
- `STRIPE_ENV_VARIABLES.txt` - Stripe-specific env var snippet (additive to `.env.local`)
- `CODING_STANDARDS.md` - Project coding standards and best practices
- `COST_OPTIMIZATION_STRATEGY.md` - ⚠️ **CRITICAL** - Zero-cost vs paid features strategy (Oct 2025)
- `ONBOARDING.md` - New developer onboarding guide
- `TECH_STACK_BREAKDOWN.md` - Complete technical stack overview
- `POWERSHELL_GIT_COMMIT_GUIDELINES.md` - PowerShell-safe git commit guidelines
- `DOCKER_DATABASE_SETUP.md` - Local Docker + Supabase setup and troubleshooting (Feb 2026)
- `MCP_PLAYWRIGHT_TROUBLESHOOTING.md` - 🔧 **NEW** - Complete Playwright MCP troubleshooting guide (Nov 2025)
- `MCP_QUICK_FIX.md` - ⚡ **NEW** - Quick 2-step fix for Playwright MCP connection issues (Nov 2025)
- `TEST_DATA_REFERENCE.md` - 🧪 **NEW** - Seeded QA personas, gigs, and auth creation tips (Nov 2025)
- `tests/AUTH_BOOTSTRAP_TEST_MATRIX.md` - Proof ledger mapping Auth contract scenarios → Playwright coverage (Dec 2025)

### **📧 Services & Integrations**
- `EMAIL_NOTIFICATION_SYSTEM_IMPLEMENTATION.md` - Complete email notification system (consolidated)
- `SENTRY_SETUP_GUIDE.md` - Sentry error tracking setup
- `SENTRY_PRODUCTION_SETUP.md` - Sentry production configuration
- `SENTRY_ERROR_TRACKING_ENHANCEMENT.md` - **NEW** ✅ - Sentry error tracking enhancements and 406 error fixes (Jan 2025)
- `SENTRY_CONSOLIDATION.md` - Historical Sentry reference

### **🐛 Troubleshooting**
- `TROUBLESHOOTING_GUIDE.md` - Common issues and solutions (9 error patterns including signup fix)
- `SIGNUP_DATABASE_ERROR_FIX_OCT_23_2025.md` - 🔴 **CRITICAL** - Database trigger signup error (Oct 23, 2025)
- `USESEARCHPARAMS_SSR_GUIDE.md` - useSearchParams SSR best practices & fixes (Oct 23, 2025)
- `AVATAR_UPLOAD_FIX.md` - Avatar upload RLS policy fix guide
- `DEBUG_NETWORK_INITIATOR.md` - **✅ NEW** - Guide for using Network tab Initiator column to debug API calls (Jan 2025)
- `INFINITE_LOADING_DEBUG_PLAN.md` - **✅ NEW** - Debug plan for infinite loading spinner issues (Jan 2025)

### **📖 Project Documentation & Organization**
- `DOCUMENTATION_INDEX.md` - This file (documentation spine)
- `releasenotes/v1.0.0.md` - Technical release notes for MVP launch (v1.0)
- `releasenotes/v1.0.0-team.md` - **NEW** ✅ - Team-focused release notes for non-technical members (Jan 2026)
- `releasenotes/README.md` - Release notes index and versioning guide
- `AUDIT_STATUS_REPORT.md` - Evidence-based repo audit snapshot (quality gates, foundation PR status, system map, journey QA, drift/duplicates)
- `AUDIT_MASTER_BOARD.md` - Rolling one-screen audit queue (IDs + proof hooks + next actions)
- `AUDIT_LOG.md` - Append-only audit proof ledger (timestamped command receipts)
- `ENGINEERING_COMMANDS.md` - **NEW** ✅ - Canonical Cursor command system (Dec 2025)
- `ARCHITECTURE_SOURCE_OF_TRUTH.md` - **NEW** - Canonical truth sources + non-negotiable “do not duplicate” laws (Dec 2025)
- `ARCHITECTURE_CONSTITUTION.md` - **NEW** - Non-negotiable system boundaries (middleware/auth/server actions/RLS/Stripe idempotency) (Dec 2025)
- `OFF_SYNC_INVENTORY.md` - Winners declared + drift remediation tracker (Dec 2025)
- `NEW_DEV_ONBOARDING.md` - **NEW** - New developer onboarding (“operate the airport”) (Dec 2025)

---

## 🚀 Quick Start Guides

### **For New Developers**
1. Start with `guides/ONBOARDING.md` or `guides/NEW_DEV_ONBOARDING.md`
2. Review `guides/DEVELOPER_QUICK_REFERENCE.md`
3. Set up your environment using `guides/ENV_SETUP_GUIDE.md` (and `guides/ENV_VARIABLES_COMPLETE_LIST.md` for the full reference)
4. Read `development/CODING_STANDARDS.md` to understand project conventions

### **For Administrators**
1. Start with `contracts/ADMIN_CONTRACT.md` for admin setup + capabilities
2. Review `security/SECURITY_CONFIGURATION.md` for security best practices
3. See `guides/ADMIN_ACCOUNT_GUIDE.md` for admin account management

### **For Understanding the System**
1. Start with `contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` for authentication flow
2. Review `DATABASE_REPORT.md` for database structure
3. See `features/` directory for feature-specific implementation details

### **When Troubleshooting**
1. Check `troubleshooting/TROUBLESHOOTING_GUIDE.md` first
2. For SSR errors with useSearchParams, see `troubleshooting/USESEARCHPARAMS_SSR_GUIDE.md`
3. Review `troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md` for quick fixes
4. Check error-specific documentation in `troubleshooting/` directory

---

## 📝 Documentation Naming Conventions

- **ALL_CAPS_WITH_UNDERSCORES.md** - Major guides and important documents
- **lowercase-with-hyphens.md** - Service-specific or smaller documents

---

## 🔄 How to update docs without drift (MANDATORY)

### Update order (never skip)
1) **Prove schema + types first**
   - `supabase/migrations/**`
   - generated `types/database.ts`
   - If docs disagree, docs are wrong until updated.
2) **Update the relevant Layer 2 contract** (`contracts/*_CONTRACT.md`).
   - Routes involved (exact paths)
   - Canonical server actions/services (file paths + function names)
   - Tables/views/functions touched (explicit columns used)
   - RLS expectations (intent)
   - Failure modes + symptoms
   - Proof checklist + test steps
3) **Update the relevant Layer 3 journey** (`journeys/*_JOURNEY.md`) if user-facing behavior changed.
4) **Update Layer 1** only when wiring/laws changed (routing contracts, middleware rules, canonical helpers, or a new “winner”).

### Evidence rule
- If you can’t prove a claim by pointing to a file/migration/type/policy, mark it **UNVERIFIED**.
- If it’s a duplicate/conflict, add it to `OFF_SYNC_INVENTORY.md`.

### Redundancy rule
- Contracts + journeys are canonical.
- Legacy implementation docs must be reduced to **pointers** or moved to `archive/`.

---

## 📞 Need Help?

If you can't find what you're looking for:
1. Use file search to find keywords
2. Check `DEVELOPER_QUICK_REFERENCE.md` for common tasks
3. Review `TROUBLESHOOTING_GUIDE.md` for known issues
4. Check the appropriate category above

---

**Note:** This index is intentionally curated. Do not maintain a “complete file list” here (it rots). If you need to enumerate files, use repo search or folder view; keep this doc focused on categories and canonical entry points.
