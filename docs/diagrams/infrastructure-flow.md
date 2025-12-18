# Infrastructure Flow Diagram

**File:** `docs/diagrams/infrastructure-flow.png`  
**Purpose:** Shows **allowed communication paths** between layers. This is the “wiring diagram” for TOTL.

## What this diagram represents
- **User Browser → Next.js Middleware → Server Actions & Routes** is the primary request path.
- **Server Actions/Routes** are the hub that may call:
  - **Supabase Auth** (session/user identity)
  - **Supabase Postgres** (data reads/writes under RLS)
  - **Supabase Storage** (uploads/signed URLs)
  - **Stripe** (checkout/billing/webhooks)
  - **Resend** (email sending)

## When to use this diagram
Use for features that touch:
- Server Actions vs API routes decisions
- Any integration (Stripe, Resend, Storage)
- Any question like “should the UI call X directly?”

## Forbidden paths (must not exist)
- UI → Postgres writes directly (client DB writes)
- Middleware → DB writes / business logic
- UI → Stripe secret operations
- UI → Resend directly

## Notes / invariants
- Mutations happen in Server Actions or API Routes only.
- RLS is assumed always on for user-level access.
