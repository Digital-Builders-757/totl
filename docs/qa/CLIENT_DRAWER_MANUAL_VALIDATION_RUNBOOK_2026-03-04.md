# Client Drawer Manual Validation Runbook (Step-3)

## Purpose
Provide a repeatable manual smoke procedure for the remaining physical/mobile validation item in the Step-3 board:
- client drawer open/close behavior
- inert backdrop behavior
- close-on-route-change behavior
- role-scoped link safety

## Preconditions
- Local app is running with seeded QA users available.
- Use a real mobile device and one browser emulator session.
- Execute QA suite commands sequentially (avoid parallel route-suite runs on local env).
- Keep Playwright guardrail and baseline reruns green before manual checks:
  - `npm run test:qa:step3-baseline`
  - `npm run test:qa:client-drawer`
  - `npm run test:qa:client-routes`

## Route scope
- `/client/dashboard`
- `/client/applications`
- `/client/gigs`
- `/client/bookings`

## Manual procedure (real mobile device)
1. Log in as a client user.
2. On each route in scope:
   - Open drawer via hamburger trigger.
   - Verify panel is visible and backdrop prevents background taps.
   - Tap backdrop and verify drawer closes.
   - Reopen drawer and navigate to another client route from a drawer link.
   - Verify drawer closes automatically after route change.
3. In open drawer state, verify links are client-only:
   - expected links: Overview, My Gigs, Applications, Bookings, Settings
   - forbidden link prefixes: `/admin`, `/talent`
4. Repeat once in landscape orientation and once in portrait orientation.

## Evidence capture checklist
- Capture one screenshot per route with drawer open.
- Capture one short recording proving backdrop tap closes drawer.
- Capture one short recording proving route-change closes drawer.
- Store evidence under:
  - `screenshots/ui-audit-2026-03-03-v2/`
- Suggested file names:
  - `client__drawer__dashboard__390x844__open.png`
  - `client__drawer__applications__390x844__open.png`
  - `client__drawer__gigs__390x844__open.png`
  - `client__drawer__bookings__390x844__open.png`
- Log results using:
  - `docs/qa/CLIENT_DRAWER_MANUAL_EVIDENCE_TEMPLATE_2026-03-04.md`

## Exit criteria
- No cross-terminal links observed in drawer.
- Backdrop reliably blocks and closes on tap.
- Drawer closes on route change on all in-scope routes.
- Any drift is logged in `docs/qa/PLAYWRIGHT_TRIAGE_LOG_2026-03-04.md` with artifacts.
