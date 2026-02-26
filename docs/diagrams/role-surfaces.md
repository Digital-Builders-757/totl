# Role Surfaces Diagram

**File:** `docs/diagrams/role-surfaces.png`  
**Purpose:** Defines the **product surface area** by role (Talent / Client / Admin). Use it to avoid mixing concerns across terminals.

## What this diagram represents
- **Authenticated user** lands in a terminal based on `profiles.role` (+ account_type rules).
- **Talent terminal** contains: gigs browsing, applications, portfolio, subscription/billing
- **Client terminal** contains: post gigs, review applications, bookings
- **Admin terminal** contains: moderation, analytics, user management

## When to use this diagram
Use when:
- Adding a new dashboard feature
- Changing permissions / who can see a thing
- Adding a new navigation item, page, or module

## What this diagram prevents
- A feature being implemented in the wrong terminal
- Permissions drifting (“client can see talent-only page”)
- Admin controls leaking into non-admin routes

## Related Governance Docs
- `docs/UI_CONSTITUTION.md`
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/diagrams/airport-model.md`
