# Architecture Source of Truth (v1)

**Date:** December 16, 2025  
**Status:** ✅ COMPLETE (v1 – intentionally small)  
**Purpose:** Define the **canonical “truth” files** and the **non‑negotiable laws** that prevent routing/auth/data drift. This doc is an **index + law book** — it does **not** duplicate implementation details already owned elsewhere.

---

## What this document is (and is not)

- **Is**: a short, enforceable list of canonical sources + “do not duplicate” rules.
- **Is not**: a full architecture spec. Canonical details live in the referenced docs/code.

If a rule isn’t here (or in a referenced canonical doc), it’s not enforceable yet — add it when you audit that domain.

---

## Layer 1 — The Constitution (short, strict, enforced)

### Truth documents (canonical docs)

- **Project rules / pre-work gate**: `TOTL_PROJECT_CONTEXT_PROMPT.md`
- **DB schema truth**: `database_schema_audit.md` (root)  
  - Supporting evidence: `supabase/migrations/**`
- **Docs map**: `docs/DOCUMENTATION_INDEX.md`
- **Off-sync inventory (winners declared)**: `docs/OFF_SYNC_INVENTORY.md`
- **MVP scope/status**: `MVP_STATUS_NOTION.md`
- **Auth contract**: `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md`
- **Sign-out behavior**: `docs/SIGN_OUT_IMPROVEMENTS.md`

### Truth code (canonical modules)

#### Routing (constants + helpers)

- **Route constants**: `lib/constants/routes.ts`
  - Includes boundary-safe helpers: `isPathOrChild`, `isPublicPath`, `isSignedInAllowedPath`
- **Return URL sanitization**: `lib/utils/return-url.ts`
- **Access checks + minimal profile shape**: `lib/utils/route-access.ts`
- **Post-auth destination**: `lib/utils/determine-destination.ts`
- **Routing decision brain (Edge-safe)**: `lib/routing/decide-redirect.ts`

#### Auth sync primitives (server-only)

- **Email verified sync**: `lib/server/sync-email-verified.ts`

#### Supabase client entrypoints (typed)

- **Server client (RSC / server actions / route handlers)**: `lib/supabase/supabase-server.ts` (`createSupabaseServer`)
- **Browser client (client components/hooks)**: `lib/supabase/supabase-browser.ts` (`createSupabaseBrowser`, `resetSupabaseBrowserClient`)
- **Admin client (server-only)**: `lib/supabase-admin-client.ts` (`createSupabaseAdminClient`)
- **Client hook (typed)**: `lib/hooks/use-supabase.ts` (`useSupabase`)

#### Types (generated)

- **Canonical type import**: `types/supabase.ts`  
  - Re-exports the generated `Database` type from `types/database.ts` (auto-generated; never hand-edit).

#### Email sending (canonical)

- **Send primitive**: `lib/email-service.ts` (`sendEmail`, `logEmailSent`)
- **Template primitive**: `lib/services/email-templates.tsx` (`generate*Email`)
- **Contract**: `docs/contracts/EMAIL_NOTIFICATIONS_CONTRACT.md`

---

## Layer 2 — Contracts (per-domain, added as you audit)

Each domain gets a “contract sheet” doc (1–2 pages) that states:

- Routes involved
- Tables touched
- RLS expectations (who can read/write)
- Canonical server actions/services (and their files)
- Known failure modes + “proof it works” checklist

Canonical contracts index:

- `docs/contracts/INDEX.md`

---

## Layer 3 — Journeys (acceptance tests in plain English)

Canonical journeys index:

- `docs/journeys/INDEX.md`

If a change breaks a journey, it’s not “done” even if it compiles.

---

## Non‑negotiable laws (do not violate)

- **No hardcoded route lists** outside `lib/constants/routes.ts`.  
  If you need a new route category/prefix, add it there and reuse it.
- **No duplicate routing helpers** (“3 brains” problem).  
  Use the canonical routing helper modules above; do not re-implement logic in middleware/actions/components.
- **Canonical imports enforced by ESLint** (`.eslintrc.json`).  
  - Example: `@/lib/supabase/supabase-admin-client*` is forbidden; use `@/lib/supabase-admin-client`.
- **Type imports**: always `import type { Database } from "@/types/supabase"` (never import from `types/database.ts` directly in app code).
- **RLS assumed always**: queries must be compatible with least-privilege RLS patterns.
- **Explicit selects** in app code (avoid `select('*')` except vetted admin scripts).
- **Server truth for auth**: prefer `auth.getUser()` when you need server-side “who is this?” truth; session can be stale.

---

## Next enforcement step (routing “one brain”)

Next micro-step is already in place: the single **Edge-safe** routing decision brain lives at:

- `lib/routing/decide-redirect.ts` (Edge-safe: no Node APIs, no Supabase, no server-only)
- Used by:
  - `middleware.ts`
  - `lib/actions/auth-actions.ts` (post-login redirects)
  - `components/auth/auth-provider.tsx` (post-auth redirect wrapper)

Goal: make it **impossible** for middleware + auth actions + auth provider to disagree about redirects.


