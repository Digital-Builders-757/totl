# Beta Smoke-Test Checklist (Launch Candidate)

Date: 2026-03-05  
Owner: QA / Product / Engineering

## Scope

This checklist focuses on the highest-risk launch pathways:
- Subscription flow
- Applications flow
- Moderation/admin flow

Use one clean browser profile per tester. Capture screenshot evidence for each failure and any ambiguous behavior.

## Environment Preconditions

- App is running against the intended launch environment.
- Test accounts are available for:
  - Admin
  - Talent
  - Client (or approved client-equivalent route access)
- Email provider constraints (403 in current env) are acknowledged as non-blocking if UI contracts remain intact.

## 1) Subscription Flow

- [ ] Talent can navigate from dashboard/header to `/talent/subscribe`.
- [ ] Plan cards render and CTA is clickable.
- [ ] Successful checkout redirect lands on `/talent/subscribe/success` with expected confirmation copy.
- [ ] Cancelled checkout redirect lands on `/talent/subscribe/cancelled` with retry guidance.
- [ ] Talent billing page (`/talent/billing`) remains accessible post-checkout return.
- [ ] No console/runtime errors on subscription and billing pages.

## 2) Applications Flow

- [ ] Signed-out user is redirected to login for protected applications surfaces.
- [ ] Talent can access `/talent/applications` and sees empty-state or rows without crash.
- [ ] Admin can access `/admin/applications` and switch tabs.
- [ ] Admin can open an application details surface when rows exist.
- [ ] Client applications surface (`/client/applications`) loads shell, tabs, and list/empty state.
- [ ] Mobile viewport (390x844) has no horizontal overflow for applications pages.

## 3) Moderation/Admin Flow

- [ ] Admin can access `/admin/moderation` and view status buckets.
- [ ] Open bucket list supports both empty and populated states.
- [ ] Admin can access `/admin/users`, `/admin/talent`, `/admin/gigs` without role leakage.
- [ ] Role guardrail blocks direct client promotion through generic role endpoint.
- [ ] Admin diagnostic route remains accessible and renders environment panel.
- [ ] Mobile viewport (390x844) remains usable without horizontal overflow.

## Sign-off Template

- Tester:
- Environment:
- Date/Time:
- Result: PASS / PASS WITH NOTES / FAIL
- Notes:
  - 
- Evidence links:
  - 
