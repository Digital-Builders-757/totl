# 🧪 QA Test Data Reference

**Status:** Ready for local + preview environments  
**Purpose:** Provide deterministic fixtures for manual, E2E, and integration testing without polluting production data.  
**Source:** `supabase/seed.sql` (runs automatically on `supabase db reset`)

---

## 1. How to Reset and Seed

```bash
# Blow away your local database, run migrations, and execute supabase/seed.sql
supabase db reset

# OPTIONAL: if you only need to reseed without rebuild
supabase db reset --seed
```

> ℹ️  The seed inserts data directly into `public.*` tables. No `auth.users` are created.  
> Create login-ready Accounts with Supabase Auth Admin once the DB is reset (see §4).

---

## 2. Seeded Personas & IDs

| Role | Profile ID | Display Name | Notes |
| --- | --- | --- | --- |
| Admin | `ca1a1a1a-1111-4444-aaaa-000000000001` | QA Admin | Owns moderation dashboard + content flag assignments |
| Client (active) | `cb2b2b2b-2222-4444-bbbb-000000000002` | Lumen Media | Has gigs, applications, bookings |
| Client (suspended) | `cc3c3c3c-3333-4444-cccc-000000000003` | Northwind Events | Triggers `/suspended` middleware |
| Talents | `1111…` – `bbbb…` | Emma → Mia | Existing gallery data retained |

### Client Profiles & Companies
- **Lumen Media:** size 11‑50, contact `ops@lumenmedia.co`, industry “Media & Entertainment”.
- **Northwind Events:** size 51‑200, contact `hello@northwind.events`, industry “Events & Experiential”.

### Gigs
| Gig ID | Title | Status | Client |
| --- | --- | --- | --- |
| `d1d1…1111` | Runway Residency Casting | `active` | Lumen Media |
| `d2d2…2222` | Brand Storytelling Campaign | `featured` | Lumen Media |
| `d3d3…3333` | Fitness Product Launch | `urgent` | Northwind Events (suspended) |

Each gig includes rich descriptions, deadlines, and `gig_requirements` records for filtering UI tests.

### Applications & Bookings
- `app-runway-emma` (`shortlisted`) and `app-runway-marcus` (`under_review`) cover admin review cases.
- `app-brand-olivia` (`accepted`) + `book-brand-olivia` power booking dashboards.
- Additional `new` / `rejected` states ensure status badge coverage.

### Portfolio Items
Three curated `portfolio_items` rows (Emma, Marcus, Olivia) drive gallery + hover effects with real Unsplash images.

### Client Applications
| ID | Status | Follow-up State | Purpose |
| --- | --- | --- | --- |
| `cab-pending-followup` | `pending` | `NULL` (older than 3 days) | Trigger reminder job |
| `cab-approved` | `approved` | Timestamped 2 days ago | Shows success badge |
| `cab-rejected` | `rejected` | `NULL` | Negative path validation |

### Content Flags
| Flag ID | Resource | Status | Notes |
| --- | --- | --- | --- |
| `flag-gig-runway-spam` | Gig `d3d3…3333` | `in_review` | Reporter Ethan, assigned to QA Admin |
| `flag-talent-profile` | Talent `5555…` | `resolved` | Demonstrates closure workflow |

---

## 3. Recommended Test Scenarios Using This Data

1. **Admin moderation:** View `/admin/moderation`, acknowledge `flag-gig-runway-spam`, verify CTA state changes.  
2. **Client workflow:** Log in as Lumen Media (once auth user created) to see gigs, booking statuses, and CSV export data.  
3. **Talent experiences:** Showcase portfolio carousel, gig gating, and follow-up emails referencing seeded entries.  
4. **Client applications dashboard:** Use “Send follow-ups” action to move `cab-pending-followup` through automation.

Document results in `PAST_PROGRESS_HISTORY.md` or open issues when regressions occur.

---

## 4. Creating Auth Users for Seeded Profiles (Optional but Recommended)

The seed only populates `public.profiles`. To log in through Supabase Auth:

1. **Generate a service-role session** (locally add `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_URL` to your shell).  
2. Run the following SQL in Supabase Studio (SQL Editor) *after* `supabase db reset`:

```sql
-- Example admin user (adjust email/password as needed)
select auth.create_user(
  email             => 'admin+qa@thetotlagency.com',
  password          => 'Admin#2025!',
  email_confirm     => true,
  user_metadata     => jsonb_build_object('role','admin','first_name','QA','last_name','Admin'),
  user_id           => 'ca1a1a1a-1111-4444-aaaa-000000000001'
);

-- Active client (Lumen Media)
select auth.create_user(
  email             => 'tessa@lumenmedia.co',
  password          => 'Client#2025!',
  email_confirm     => true,
  user_metadata     => jsonb_build_object('role','client','company_name','Lumen Media'),
  user_id           => 'cb2b2b2b-2222-4444-bbbb-000000000002'
);
```

> ✅ Using `auth.create_user` ensures rows are mirrored into `auth.users`, `auth.identities`, and triggers the profile hooks.  
> If you already seeded `profiles`, the `user_id` values must match exactly (otherwise duplicate rows will appear).

Repeat for any additional personas you want to exercise (e.g., `Northwind Events`, a dedicated talent tester, etc.).

---

## 5. Maintenance

- **Whenever schema changes**, rerun `supabase db reset` to keep test data aligned.  
- **Update this document** if you add/remove fixtures so QA knows what to expect.  
- **Never run seeds against production.** The IDs are public and intended for non-prod only.

---

**Last updated:** November 27, 2025  
**Maintainer:** TOTL Engineering  
**Related docs:** `supabase/seed.sql`, `docs/COMPREHENSIVE_QA_CHECKLIST.md`, `MVP_STATUS_NOTION.md` (Testing Expansion)

