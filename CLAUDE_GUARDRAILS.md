# 🛡️ Claude Coding Guardrails – TOTL Agency (Next.js 15 + Supabase)

## 0) Prime Directives

* **Think hard, answer short:** Deeply analyze the problem, then provide concise, direct solutions. No unnecessary explanation unless asked.
* **Type safety first:** No `any`. Use generated `Database` types from `types/database.ts`.
* **RLS-aware always:** Assume Row-Level Security is on. Never bypass with service role on client.
* **Explicit columns only:** No `select('*')`. Always list columns needed.
* **Server fetch, client interact:** Data fetching in **Server Components**; UI interactivity in **Client Components**.
* **Server Actions for mutations:** No DB writes in client components or effects.

---

## 1) Project Structure & Conventions

* **App Router:** Keep routes in `app/`, colocation OK (components next to usage).
* **Naming:** `*-server.ts` (server-only utilities), `*-client.tsx` (client components).
* **No direct Supabase creation:** Use `lib/supabase-client.ts` (browser/session) & `lib/supabase-admin-client.ts` (server).
* **Environment:** Service role key used **only server-side**; never ship to client. Validate required envs at boot.

---

## 2) Supabase & Data Layer (RLS-Friendly)

* **Generated types:**

  ```ts
  import type { Database } from '@/types/database';
  type Gig = Database['public']['Tables']['gigs']['Row'];
  ```
* **Reads (explicit columns):**

  ```ts
  const { data, error } = await supabase
    .from('gigs')
    .select('id,title,location,status,client_id') // explicit
    .eq('status', 'published');
  ```
* **Writes via Server Actions:**

  ```ts
  'use server'
  import { createSupabaseActionClient } from '@/lib/supabase-client';
  export async function createGig(formData: FormData) {
    const supabase = await createSupabaseActionClient();
    // validate with Zod, then insert with explicit columns
  }
  ```
* **Policies-aware queries:** Filter by `auth.uid()` boundary (e.g., `.eq('client_id', session.user.id)` where policies expect it).

---

## 3) Next.js Patterns

* **Server Components by default.** Mark only interactive components with `'use client'`.
* **Caching & Revalidation:**

  * Default: cached where safe; use `revalidate = N` for ISR.
  * Use `cache: 'no-store'` only for truly dynamic/secret data.
* **Route Handlers:** Put auth-sensitive handlers in `app/api/*/route.ts`, return typed JSON, never leak errors.
* **Images:** Use `<Image/>` with optimization enabled and `remotePatterns` for Supabase Storage.

---

## 4) Forms, Validation, and Errors

* **Zod + RHF:** Schema defines both client & server validation.
* **Never trust client:** Re-validate in Server Actions.
* **Error surfaces:** Return typed error objects; show user-friendly toasts/messages.
* **Error boundaries:** Wrap dashboards/expensive sections with boundaries + skeletons.

---

## 5) Security Essentials

* **No cookie writes in server components.** Only in **Route Handlers** or **Server Actions**.
* **Input handling:** Zod for all incoming payloads; strip unknown keys.
* **Secrets:** Never log secrets; sanitize error logs.
* **CORS:** Restrict origins to production + preview URLs.
* **Auth checks:** Gate mutating actions by role; verify ownership (e.g., gig's `client_id`) server-side.

---

## 6) Performance & DX

* **Dynamic imports** for heavy UI (charts, admin widgets):

  ```ts
  const AdminCharts = dynamic(() => import('./admin-charts'), { ssr: false, loading: () => <Skeleton/> });
  ```
* **Memoization:** Use `useMemo`/`useCallback`/`React.memo` for prop-heavy lists; avoid unnecessary `'use client'`.
* **Bundle control:** Avoid huge client deps; prefer server-side work.
* **Lighthouse/Analyzer:** Run bundle analyzer & fix top offenders each sprint.

---

## 7) Accessibility & UX

* **Keyboard first:** All interactive elements keyboard reachable, visible focus states.
* **ARIA:** Labels for inputs/buttons, `aria-live` for async status.
* **Contrast:** Meet WCAG AA. Don't rely on color alone for state.
* **Motion:** Respect `prefers-reduced-motion`.

---

## 8) Testing & CI

* **Minimal but real tests:**

  * Unit: Zod schemas, server utilities.
  * Integration: server actions with mocked Supabase.
  * E2E (Playwright): core auth flows + gig CRUD happy path.
* **CI required checks:** `lint`, `typecheck`, `build` must pass. Fail on any TS/ESLint error.
* **PR checklist:** Types regenerated, no `select('*')`, no service key in client, RLS path tested, ARIA covered.

---

## 9) Migrations & Types

* **Flow:** Update `PROJECT_DESCRIPTION.md` → `supabase migration new` → `supabase db push` → `npm run types:regen` → `npm run schema:verify`.
* **Never** hand-edit `types/database.ts`.
* **Column additions:** Update selects + Zod schemas + UI states together.

---

## 10) Logging & Observability

* **Sentry (or similar):** Frontend + server instrumentation with PII scrubbing.
* **Structured logs:** Include `requestId`, `userId` (if available), and event names.
* **Metrics:** Track key flows (signup, gig creation, application submission).

---

## 11) Code Style & Docs

* **ESLint + Prettier:** No disabled rules in code. Fix; don't ignore.
* **Props & API types:** Export interfaces; avoid inline anonymous types for shared structures.
* **Docstrings:** Public server utilities and server actions must have short JSDoc summaries.

---

## 12) "Ask Claude To…" (prompt shortcuts)

* "Create a server action that inserts into `gigs` with RLS-safe filters, Zod validation, and explicit columns; include error handling and return a typed result."
* "Refactor this component into server (data) + client (UI) halves; the client half should accept a typed prop payload only."
* "Add dynamic import to this chart module and provide a loading skeleton, ensuring no SSR for the chart lib."
* "Write a migration + regenerate types, then update all selects touching the changed columns with explicit selection."
* "Produce a11y review notes for this page and patch ARIA/labels/focus traps accordingly."

---

## 13) Copy/Paste Snippets

**`next.config.mjs` images**

```ts
export default {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/**' },
    ],
  },
};
```

**Typed route handler**

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

const Body = z.object({ title: z.string().min(2), location: z.string().min(2) });

export async function POST(req: Request) {
  const json = await req.json();
  const parse = Body.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  // call server action / admin client here
  return NextResponse.json({ ok: true });
}
```

**Supabase select (explicit)**

```ts
const { data, error } = await supabase
  .from('applications')
  .select('id,gig_id,talent_id,status,created_at')
  .eq('gig_id', gigId)
  .order('created_at', { ascending: false });
```

---

## 🚨 Critical Reminders for Claude

### **Documentation Updates Required**
When making ANY changes to the codebase, Claude MUST update:

1. **PROJECT_DESCRIPTION.md** - Overall architecture and metrics
2. **This CLAUDE_GUARDRAILS.md** - New patterns or conventions
3. **README.md** - Setup instructions if environment changes
4. **Database schema docs** - Any migration changes
5. **API documentation** - New endpoints or changes

### **Pre-Commit Checklist**
- [ ] No `select('*')` queries introduced
- [ ] Server Actions used for all mutations
- [ ] Types regenerated if schema changed
- [ ] ESLint warnings addressed (not ignored)
- [ ] ARIA attributes added to new interactive elements
- [ ] Documentation updated for any architectural changes

### **Code Review Self-Check**
Before finishing any feature:
1. Run `npm run lint && npm run typecheck && npm run build`
2. Verify RLS policies work correctly for new queries
3. Check that no service role keys are exposed to client
4. Confirm proper error handling and user feedback
5. Update relevant documentation files

---

**Last Updated**: 2025-01-17
**Version**: 1.0 (Initial comprehensive guardrails)