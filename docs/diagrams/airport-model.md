# TOTL Airport Architecture Model

This diagram is the canonical mental model for the system.

If a proposed change does not clearly map to one of these zones,
it is likely mis-scoped.

## Zones
- Security → middleware.ts
- Ticketing → Supabase Auth, Stripe
- Manifest → public.profiles
- Locked Doors → RLS
- Staff → Server Actions / API Routes
- Terminals → Dashboards
- Control Tower → Admin, DB Triggers, Webhooks

## Related Governance Docs
- `docs/UI_CONSTITUTION.md`
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/diagrams/role-surfaces.md`
