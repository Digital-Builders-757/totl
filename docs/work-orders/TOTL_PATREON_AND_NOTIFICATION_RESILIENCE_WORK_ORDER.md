# TOTL Patreon + Notification Resilience Work Order

Related roadmap: `docs/plans/TOTL_CATCHUP_ROADMAP.md`.
Execution companion: `PROJECT_STATUS_REPORT.md`.

## Goal
Make Patreon, notifications, and booking reminders reliable and explainable.

This batch addresses the current Patreon pain point and the notification/booking paths that users and admins depend on.

## Product decision
Treat Patreon and notification state as server truth and make failures visible in a calm, supportable way.

## What to build

### Patreon connection
- Clean up the Patreon connect and callback flow.
- Preserve the intended redirect path.
- Explain failed or broken states clearly.

### Entitlement sync
- Verify entitlement state against the latest server-side truth.
- Make resync / webhook behavior debuggable.
- Avoid client-trusted entitlement logic.

### Notifications and reminders
- Fix the broken Notifications UI path.
- Make new member / booking notification signals reliable.
- Keep the reminder flow and operator visibility working.

## Implementation guidance
- Inspect Patreon auth, webhook, entitlement, and notification routes.
- Reuse the existing notification infrastructure and safe logging patterns.
- Do not broaden the product into new perks without confirmation.
- Keep the flow production-safe.

## Acceptance criteria
- Patreon connect works or fails clearly.
- Entitlement state is understandable.
- Notifications UI works.
- Booking reminders / signals are debuggable.
- Build passes.

## Suggested implementation order
1. Inspect Patreon callback and sync flow.
2. Tighten failure handling and user-visible state.
3. Fix notification entry points.
4. Verify reminder / operator visibility behavior.
5. Update docs if operator steps change.

## Notes
- This is the batch that removes the current known pain.
- Keep the copy explicit and the failure states calm.
