# TOTL Agency – Project Context Prompt

> **Read this file before touching any code, tests, docs, or database objects.**  
> It collects the non‑negotiable rules, common pitfalls, and references you must revisit before every change.
>
> **🤖 NEW AI AGENTS:** Start with `AGENT_ONBOARDING.md` for a quick-start guide, then return here for complete details.

---

## 1. Mandatory Pre-Work Checklist

1. **Open `docs/DOCUMENTATION_INDEX.md`.**  
   - Identify every doc relevant to the feature (auth, Stripe, admin, etc.).  
   - Read or refresh those docs before writing code.
2. **Review the single source of truth for data:**  
   - `database_schema_audit.md` (root)  
   - Recent files in `supabase/migrations/` that relate to your area  
   - `types/database.ts` + `@/types/supabase` imports (never hand-edit generated types)
3. **Reconfirm security + auth expectations:**  
   - `docs/AUTH_DATABASE_TRIGGER_CHECKLIST.md` for *any* auth/profile work  
   - `docs/SECURITY_CONFIGURATION.md` + `docs/SQL_RLS_POLICY_CREATION_GUIDE.md` when modifying queries, policies, or storage paths
4. **Scan quick references:**  
   - `docs/COMMON_ERRORS_QUICK_REFERENCE.md` (import paths, `.maybeSingle()`, Stripe, etc.)  
   - `docs/PRE_PUSH_CHECKLIST.md` (schema + build + lint requirements)  
   - Feature-specific docs (e.g., `docs/STATUS_BADGE_SYSTEM.md`, `docs/STRIPE_SUBSCRIPTION_PRD.md`)
5. **Clarify scope.** Define what documents need updating once work is finished (MVP status, feature guides, troubleshooting notes).
6. **Before touching `main` / production:**  
   - We currently operate **one Supabase project for all environments** (`utvircuwknqzpnmvxidp`). Treat both `develop` and `main` as production data.  
   - Set `SUPABASE_PROJECT_ID=utvircuwknqzpnmvxidp` in your shell (run `npx supabase projects list` to double-check).  
   - Set `SUPABASE_INTERNAL_NO_DOTENV=1` so Supabase CLI doesn’t try to parse `.env.local`.  
   - Apply pending migrations to production (`npx supabase@2.34.3 db push --db-url "postgresql://postgres:<DB_PASSWORD>@db.utvircuwknqzpnmvxidp.supabase.co:5432/postgres"`).  
   - Run `npm run types:regen:prod` (which now requires `SUPABASE_PROJECT_ID`) so `types/database.ts` matches the live schema before merging.

---

## 2. Architecture & Data Access Rules

- **App Router + React Server Components:** Fetch data in server components/actions, pass props into presentational client components.  
- **Supabase Clients:**  
  - `@/lib/supabase-client` for user-level access (respecting RLS)  
  - `@/lib/supabase-admin-client` for trusted server-only logic (never import client-side)  
  - Do **not** instantiate Supabase directly.  
- **Type Imports:** Always `import type { Database } from '@/types/supabase'`; never from the generated file path. No `any` for DB responses.  
- **Query Style:** Explicit column selections (`.select('id, role')`). `select('*')` is allowed only in vetted admin scripts.  
- **Security:** RLS is always on. Use `auth.uid()` (via Supabase helpers) for filters. No service-role keys in browser bundles.  
- **Component Boundaries:** Presentational components have zero side effects, zero fetches, and receive typed props.  
- **Server Actions & Mutations:** Wrap in `try/catch`, log to `lib/error-logger`, return typed results.

---

## 3. Database & Schema Guardrails

- `database_schema_audit.md` must mirror reality **before** migrations run. Never alter DB without updating this doc.  
- All schema changes go through new timestamped files in `supabase/migrations/`. No edits to applied migrations.  
- After migrations: run the pinned Supabase CLI (`npx supabase@2.34.3 gen types typescript --project-id utvircuwknqzpnmvxidp --schema public`) and re-run `scripts/prepend-autogen-banner.mjs` if needed.  
- Ensure `types/database.ts`, `types/supabase.ts`, and the schema audit are in sync (use `npm run schema:verify:comprehensive`).  
- Production sync: each time you regenerate types or link via CLI for production, set `SUPABASE_PROJECT_ID` (and `SUPABASE_INTERNAL_NO_DOTENV=1`) so Supabase CLI targets the correct project without parsing `.env.local`; otherwise schema drift will block merges to `main`.  
- Treat enums and views as code: update audit + docs whenever they change.

---

## 4. Authentication & Authorization

- **Profile creation**: Follow `ensureProfileExists` patterns; check `docs/AUTH_STRATEGY.md`.  
- **Role-based routing**: Middleware + server actions must redirect by `profiles.role` (`talent`, `client`, `admin`) using data already fetched.  
- **maybeSingle() everywhere** a row might not exist; never check for `PGRST116` when using it.  
- **Signup/Login flows**: Mirror trigger logic in `docs/AUTH_DATABASE_TRIGGER_CHECKLIST.md` before editing Supabase functions or triggers.  
- **Admin tasks**: Only on secure server routes using the admin client; verify RLS and logging.

---

## 5. Type Safety & Common Pitfalls

- **Imports:**  
  - ✅ `@/lib/supabase-admin-client`  
  - ✅ `@/types/supabase`  
  - ❌ `@/lib/supabase/supabase-admin-client`  
  - ❌ `@/types/database`  
- **null vs undefined:** Convert `.find()` results with `?? null`; prefer `Type | null`.  
- **Profile data:** Never fetch profiles in client components—use `useAuth()` context data.  
- **Utility functions:** Confirm imports for helpers like `createNameSlug`, `getTalentSlug`, `createSlug`.  
- **Stripe API:** Version `2024-06-20`, never use `.clover` suffix; read subscription data from `subscription.items`.  
- **Playwright:** Avoid deprecated APIs (e.g., `page.emulate`). Use typed contexts/devices.  
- **Docs & status updates:** `MVP_STATUS_NOTION.md` must reflect every meaningful change; CI blocks commits otherwise.

---

## 6. Testing & Verification

- Minimum commands before pushing (and often before committing):  
  - `npm run schema:verify:comprehensive`  
  - `npm run build`  
  - `npm run lint`  
  - Targeted Playwright/spec scripts when touching related features (e.g., `npm run test:ui-ux` / `scripts/run-ui-ux-tests.ps1`)  
- Rerun relevant scripts after modifying docs or context (pre-commit hook depends on them).  
- Capture any manual testing notes in the corresponding doc or troubleshooting section.

---

## 7. Documentation Expectations

- All new/updated guidance lives in `docs/` (except the root files listed in `docs/DOCUMENTATION_INDEX.md`).  
- Update the index whenever you add a doc or materially change categories.  
- Large features or bug fixes require a short entry in `PAST_PROGRESS_HISTORY.md` and, when applicable, `SESSION_SUMMARY_*` or feature-specific guides.  
- Keep `MVP_STATUS_NOTION.md` current—pre-commit checks fail otherwise.

---

## 8. Quick Reference Links

- **Docs Index:** `docs/DOCUMENTATION_INDEX.md`  
- **Schema Truth:** `database_schema_audit.md`, `supabase/migrations/`, `SCHEMA_TYPES_VERIFICATION.md`  
- **Common Errors:** `docs/COMMON_ERRORS_QUICK_REFERENCE.md`, `docs/TYPESCRIPT_COMMON_ERRORS.md`  
- **Type Safety:** `docs/TYPE_SAFETY_IMPROVEMENTS.md`, `TYPE_SAFETY_COMPLETE.md`  
- **Security/Auth:** `docs/SECURITY_CONFIGURATION.md`, `docs/AUTH_STRATEGY.md`, `docs/AUTH_DATABASE_TRIGGER_CHECKLIST.md`  
- **Stripe:** `docs/STRIPE_SUBSCRIPTION_PRD.md`, `docs/STRIPE_IMPLEMENTATION_PLAN.md`, `docs/STRIPE_TROUBLESHOOTING.md`  
- **Testing/QA:** `docs/COMPREHENSIVE_QA_CHECKLIST.md`, `docs/UI_UX_TESTING_GUIDE.md`

---

## 9. Final Reminder

- If anything in this prompt conflicts with another doc, resolve the conflict **before** proceeding.  
- When you discover new pitfalls, update this file and the relevant references immediately so the next contributor benefits.  
- Treat this prompt as a go/no-go gate: if you can’t check every box above, pause and gather the missing context first.

