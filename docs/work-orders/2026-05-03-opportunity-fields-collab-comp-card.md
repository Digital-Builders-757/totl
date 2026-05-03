# Work Order: Opportunity Fields, On-Platform Collaboration, and Digital Comp Card

Date: 2026-05-03
Branch: develop
Owner: Cursor

## Context

A client email requested a product expansion for TOTL Agency’s Career Builder / opportunities flow.

The ask is to make the platform feel more like a real creative ecosystem, not just a job board. Members and career builders should be able to collaborate on-platform, express more complete talent profiles, and manage opportunity filtering with better field coverage.

## Goals

- Expand opportunity type selection fields.
- Add an on-platform collaboration action between members and career builders.
- Add a simple “paid” compensation option.
- Improve talent profile fields so the profile can evolve into a digital comp card.
- Preserve admin visibility into referrals / invites where possible.
- Keep the implementation server-validated and production-safe.

## Requested Opportunity Type Options

Add the following to opportunity type selection:

- Designers
- MUA
- Hairstylists
- Wedding
- Internship
- Crew
- Athlete
- Craft Services

Also preserve existing options.

## Collaboration Feature

Add a one-click “collab” action that sends an in-platform message or collaboration request from one member to another.

Desired behavior:

- One click expresses interest in collaborating on a future project.
- Communication should stay on-platform where possible.
- The target member receives a clear notification or inbox message.
- Admins can review collaboration activity if needed.

## Compensation

Add a new compensation option:

- Paid

This should work alongside min/max compensation fields when those exist.

## Talent Profile / Digital Comp Card

Expand member profile data to support comp-card style details:

- eye color
- hair color
- bust
- hips
- waist
- suit
- shoe
- resume link

The profile should be structured so it can later act like a digital comp card.

## Admin / Vetting Improvements

If feasible, add admin visibility for:

- who invited a career builder
- who referred a member
- basic provenance for new account relationships

Also confirm whether career builders can be deleted, or whether the current product model only allows suspension. If delete is not supported, document that clearly and decide whether to add it.

## UX Support

Add a small guidance surface or helper text for profile photos / comp card prep if needed.

Example guidance:

- how to resize images
- how to use a resizer tool
- optional tutorial link or short instruction

## Implementation Notes

- Prefer Next.js + Supabase-native patterns.
- Keep admin actions server-validated.
- Do not trust the client for permissions or deletes.
- Keep the flow clear, calm, and easy to extend.

## Definition of Done

- Opportunity type selection includes the new requested fields.
- Users can send or trigger a collaboration action on-platform.
- “Paid” is available as a compensation option.
- Talent profiles support comp-card-style fields.
- Admin can see invite/referral provenance if implemented.
- The feature is documented and ready for Cursor implementation.
