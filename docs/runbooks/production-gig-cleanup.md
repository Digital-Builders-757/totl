# Production gig cleanup (test / placeholder listings)

Use this runbook when scrubbing staging or production so the marketing homepage and `/gigs` reflect real agency opportunities only. **Do not run destructive SQL without a backup and written approval.**

## Before you start

1. Create a database backup or point-in-time snapshot in the Supabase dashboard.
2. Run all inventory queries in **read-only** mode first and export results (CSV or copy).
3. Share the candidate row list with the client or ops lead and get explicit sign-off on IDs or titles to change.

## Inventory (read-only examples)

List gigs that look like tests (tune patterns for your data):

```sql
SELECT id, title, status, date, application_deadline, created_at, client_id
FROM public.gigs
WHERE title ILIKE '%test%'
   OR title ILIKE '%placeholder%'
   OR title ILIKE '%sample%'
ORDER BY created_at DESC;
```

Gigs tied to known seed UUIDs from local `supabase/seed.sql` (adjust if your production used different IDs):

```sql
SELECT id, title, status, created_at
FROM public.gigs
WHERE id IN (
  'd1d1d1d1-aaaa-4444-aaaa-111111111111',
  'd2d2d2d2-bbbb-4444-bbbb-222222222222',
  'd3d3d3d3-cccc-4444-cccc-333333333333'
);
```

Count applications per gig before delete:

```sql
SELECT g.id, g.title, COUNT(a.id) AS application_count
FROM public.gigs g
LEFT JOIN public.applications a ON a.gig_id = g.id
WHERE g.id IN (/* approved gig ids */)
GROUP BY g.id, g.title;
```

## Preferred: soft-close (archive)

Closing hides listings from public “active” surfaces while preserving history:

```sql
UPDATE public.gigs
SET status = 'closed', updated_at = NOW()
WHERE id IN (/* approved ids */);
```

## Hard delete (only with zero applications)

Deleting a gig **cascades** to `applications`, `gig_requirements`, and related rows. Use only when `application_count = 0` and policy allows:

```sql
DELETE FROM public.gigs
WHERE id IN (/* approved ids */)
  AND NOT EXISTS (SELECT 1 FROM public.applications a WHERE a.gig_id = gigs.id);
```

## After changes

1. Open `/` and `/gigs` and confirm only intended opportunities appear.
2. Invalidate or redeploy the app if you rely on edge caches; Next.js `revalidatePath` on gig mutations already refreshes `/` when using the admin UI.
