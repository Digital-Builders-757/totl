# Signup Bootstrap Flow Diagram

**File:** `docs/diagrams/signup-bootstrap-flow.png`  
**Purpose:** Explains how a user becomes a valid app user: `auth.users` → triggers → `profiles` (+ role profile).

## What this diagram represents
- User signs up → row inserted into `auth.users`
- DB trigger `handle_new_user` creates:
  - `public.profiles` row (app identity)
  - `talent_profiles` or `client_profiles` (role-specific row)
- App then uses `profiles.role/account_type` for routing and access control

## When to use this diagram
Use when touching:
- signup/login flows
- profile creation/repair (`ensureProfileExists`)
- middleware safe routes / bootstrap handling
- email verification sync
- anything that risks “profile missing” errors

## Known failure modes this prevents
- Redirect loops (middleware expects profile, profile doesn’t exist yet)
- “User exists but can’t proceed” (auth ok, app identity missing)
- Race conditions between session establishment and profile creation

## Red zone warning
This diagram corresponds to Red Zone files (auth/middleware/callback/profile bootstrap).
Treat changes here as high risk and test thoroughly.
