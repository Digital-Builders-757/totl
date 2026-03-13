# Handoff Prompt for New Agent

Use this prompt to bring a new agent up to speed:

---

## Context: TOTL Agency – Notifications & Booking UX

TOTL is a Next.js + Supabase talent booking platform. Talent apply to gigs; Career Builders (clients) accept or reject applications; accepted applications create bookings.

---

## What's Done

### 1. Real booking data in talent dashboard
- **`lib/actions/booking-actions.ts`**: Added `getTalentBookings()` to fetch bookings with gig and client data.
- **Talent dashboard Bookings tab** (`app/talent/dashboard/client.tsx`): Uses real booking data (date, time, compensation, notes) instead of application data.
- **`ApplicationDetailsModal`** (`components/application-details-modal.tsx`): Accepts optional `booking` prop and shows booking date/time, compensation, and notes when present.
- **View Details**: Opens the modal with full booking details when a booking card is clicked.

### 2. Time field in Accept dialog
- **`components/client/accept-application-dialog.tsx`**: Added "Call Time" input (`type="time"`).
- Date and time are combined into an ISO string and passed to the `accept_application_and_create_booking` RPC.
- **Booking Confirmed email** (`lib/actions/booking-actions.ts`): Includes `bookingTime` when a time is set.
- Talent dashboard shows date and time using `SafeDate` with `format="datetime"`.

### 3. 24-hour booking reminder
- **`app/api/cron/booking-reminders/route.ts`**: Cron endpoint that finds bookings in the next 20–28 hours and sends reminder emails to talent.
- **`vercel.json`**: Cron schedule set to run daily at 8:00 AM UTC.
- **`CRON_SECRET`**: Documented in `docs/guides/ENV_VARIABLES_COMPLETE_LIST.md`; must be set in Vercel env for the cron to run.

---

### 4. In-app notifications (Approach B) — DONE
- **`user_notifications` table** (`supabase/migrations/20260313120000_add_user_notifications.sql`): RLS, indexes, idempotent inserts.
- **Notification inserts**: Talent applies → client; client accepts/rejects → talent.
- **Badge counts**: Client and Talent layouts fetch unread count on page load; Admin uses real `content_flags` open count.
- **Notification dropdown**: Last 10 notifications in bell dropdown for Client and Talent.
- **Apply migration**: Run `supabase db push` (or `supabase db reset` locally) before or after deploy.

---

## What's Left to Do

### Reminder setup
- Add `CRON_SECRET` to Vercel environment variables.
- Confirm the cron runs as expected in production.

---

## Important Files & Conventions

- **Architecture**: `docs/ARCHITECTURE_CONSTITUTION.md` – no DB calls in client components; all mutations in Server Actions.
- **Cost**: `docs/development/COST_OPTIMIZATION_STRATEGY.md` – avoid Realtime and polling; prefer page-load fetches.
- **Schema**: `database_schema_audit.md` – schema reference; migrations in `supabase/migrations/`.
- **Email**: `docs/contracts/EMAIL_NOTIFICATIONS_CONTRACT.md` – use `sendEmail` + `lib/services/email-templates.tsx` directly; avoid `fetch()` to internal email routes.

---

## Suggested Next Steps for a New Agent

1. Read `docs/plans/NOTIFICATIONS_IMPLEMENTATION_PLAN.md`.
2. Choose an approach (A, B, or C) and implement it.
3. Wire real notification counts into `AdminHeader` and `ClientTerminalHeader`.
4. Ensure `CRON_SECRET` is set and the booking reminder cron runs in production.
