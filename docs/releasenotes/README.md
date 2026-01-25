# Release Notes Index

This directory contains versioned release notes for TOTL Agency.

## Versioning

We follow semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes or major workflow shifts
- **MINOR**: Monthly feature releases (new capabilities or meaningful improvements)
- **PATCH**: Hotfixes and small improvements between releases

## Release Notes Cadence

Release notes are published on the **first business day of each month**, covering changes merged in the prior month.

## Current Releases

### [v1.0.0](./v1.0.0.md) - MVP Complete
**Date:** January 25, 2026  
**Status:** ✅ COMPLETE  
**Audience:** Technical stakeholders

First production-ready MVP release with full role-based experiences, gig lifecycle management, portfolio gallery, subscription system, and admin operations suite.

### [v1.0.0 - Team Version](./v1.0.0-team.md) - MVP Launch
**Date:** January 25, 2026  
**Status:** ✅ COMPLETE  
**Audience:** Non-technical team members

Non-technical release notes for team members covering what the app does, how to use it, what's included, and action items for testing.

---

## How to Create New Release Notes

1. Create a new file: `docs/releasenotes/vX.Y.Z.md` (e.g., `v1.1.0.md`)
2. Use the template from `v1.0.0.md` as a starting point
3. Update this README.md to include the new version
4. Follow the structure:
   - Date, Status, Audience, Scope
   - Highlights (key features/changes)
   - By Role Surface (what changed for each role)
   - Platform & Trust (security, performance, infrastructure)
   - Known Limitations / In Progress
   - Schema/Type Changes (if any)

## Template Structure

```markdown
# Release Notes — vX.Y.Z (Title)

**Date:** YYYY-MM-DD
**Status:** ✅ COMPLETE / 🔄 IN PROGRESS
**Audience:** External + internal stakeholders
**Scope:** Brief description

## Highlights
- Key feature 1
- Key feature 2

## By Role Surface
### Talent
- Changes for talent

### Career Builder
- Changes for clients

### Admin
- Changes for admins

## Platform & Trust
- Security/performance/infrastructure updates

## Known Limitations / In Progress
- Ongoing work

## Schema/Type Changes
- SQL migrations, RLS policies, type definitions
- Or "No schema/type changes."
```
