
# TOTL Onboarding + Notifications Work Order

## Purpose
This work order defines the implementation scope for improving TOTL’s onboarding responsiveness and admin notification experience.

The immediate goal is to make new member activity more visible, faster to act on, and easier to manage from the admin dashboard.

This document is the source of truth for the current implementation pass.

---
## Background
Client feedback identified three key issues:

1. Admins need faster visibility when a new member joins
2. New members should receive immediate onboarding/welcome communication
3. The Notifications button in the Admin Office is currently broken/unresponsive

There was also feedback around user list cleanup and subscription visibility, but the paid-user visibility work is already largely addressed and broader user-data cleanup is not the main focus of this work order.

---

## In Scope

### 1. Real-time or near-real-time admin visibility for new signups
Create a reliable way for admins to know immediately when a new member registers.
This can be implemented via:
- in-platform admin notification
- admin email alert
- or both, depending on the current system and what is practical in this pass

Goal:
A new member registration should create a visible admin-side signal without manual checking.

### 2. Automated welcome / getting-started communication
Ensure that a new user receives a welcome message automatically after successful registration.

This should:
- trigger only when registration is successfully completed
- use the current email infrastructure if already available
- be structured so final client-approved copy/design can be swapped in cleanly later

Goal:
Every new member gets an immediate welcome touchpoint.

### 3. Notifications button bug fix
Fix the Admin Office Notifications button so it actually works.

Expected result:
- tapping/clicking the button opens the intended notification UI
- it is responsive on desktop/mobile
- it is not visually or functionally broken
- if a placeholder notification panel exists, wire it properly
- if the notification UI is incomplete, create the minimal working version needed for this flow
---

## Out of Scope for This Work Order
Unless discovered as a blocker, do not let this pass turn into a full admin rebuild.

Out of scope for now:
- large-scale user-list redesign
- broad database cleanup tooling
- deep talent/profile deduplication tooling
- complex CRM workflow expansion
- final client-approved email copy/design polish
- anything unrelated to onboarding + notifications + button functionality

Note:
If ghost/test/fake profiles are clearly discovered while implementing, document findings, but do not allow that to derail this work order unless it directly blocks the signup/notification pipeline.
---

## Current State / Assumptions

### Already addressed or mostly addressed
- paid user visibility in the admin/users experience has already been improved or partially addressed

### Partially available
- email sending infrastructure exists
- welcome email capability may already be partially wired

### Still needed
- final approved welcome email content/design from client
- admin notification pipeline for new signups
- working notifications button behavior in admin UI

---

## Implementation Goals

### Goal A — Admin knows when someone joins
When a new member signs up, admins should not need to refresh random pages or manually inspect data.

Minimum acceptable outcome:
- an admin notification record is created and surfaced somewhere usable
- or an admin email alert is sent immediately
- ideally both if the system supports it cleanly

### Goal B — New member gets welcomed immediately
After successful registration, the user should receive a welcome/getting-started communication automatically.

Minimum acceptable outcome:
- welcome email is triggered automatically
- trigger is tied to successful registration completion
- there is a clean place to later update subject line, body copy, and design

### Goal C — Notifications UI is usable
Admins should be able to click/tap the Notifications button and get a working result.

Minimum acceptable outcome:
- button opens the intended menu/panel/page
- it works reliably on supported screen sizes
- it does not appear broken or dead
---

## Technical Expectations

### Notification logic
- use the real registration success path as the source of truth
- avoid duplicate notifications if possible
- do not create false positives for incomplete registrations
- if an admin notification table or mechanism already exists, reuse it
- if not, implement the lightest reliable version

### Welcome automation
- use existing email infrastructure where possible
- avoid hardcoding messy content directly into fragile UI code
- structure templates/copy in a maintainable way
- leave clear placeholders or TODOs where client copy/design approval is still needed

### UI fix expectations
- inspect why the Notifications button is currently non-responsive
- fix event handling, menu state, routing, layering, z-index, or missing component wiring as needed
- ensure keyboard and pointer interaction both behave correctly where appropriate

---

## Definition of Done

This work order is complete when all of the following are true:

### Admin notifications
- a new successful member registration creates an admin-visible notification, email alert, or both
- the signal is reliable enough that admins can notice new signups quickly
- the flow is tested against the real registration path

### Welcome automation
- a successful new registration triggers an automatic welcome communication
- the system uses the existing email infrastructure cleanly
- the implementation is ready for final client copy/design updates later
- the current welcome flow is no longer manual or ambiguous

### Notifications button
- the Notifications button in the Admin Office is fully functional
- clicking/tapping it produces the expected UI behavior
- the behavior works responsively and does not feel broken

### Documentation / handoff
- implementation notes are documented
- any remaining client dependencies are clearly listed
- any unresolved issues are clearly marked as follow-up items

---

## Client Dependencies / Pending Inputs
These items may still require client approval or additional direction:

1. final welcome email copy
2. final welcome email visual design/branding preferences
3. preferred admin notification channel:
   - email only
   - in-app only
   - both
These should not block implementation of the underlying system unless absolutely necessary.

---

## Follow-Up Items (Not Blocking This Pass)
These can be addressed in a future work order if needed:
- deeper talent/profile cleanup audit
- fake/test/duplicate profile purge tooling
- richer admin notification center UX
- expanded onboarding sequence
- broader lifecycle emails beyond initial welcome
