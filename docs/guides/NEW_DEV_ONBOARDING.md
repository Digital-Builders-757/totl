# ✈️ TOTL Agency — New Developer Onboarding  
### The Airport You’re Now Operating

Welcome to **TOTL Agency**.

You are not here to redesign the airport.  
You are here to **operate it safely**.

This platform already moves users from signup → paid work.  
Your job is to understand **who does what**, **where decisions are made**, and **which parts of the system you should never improvise in**.

---

## 🧍‍♂️ 1. A Passenger Arrives (User Signs Up)

A user lands on the website.

They are *outside* the airport.

### What happens
- User signs up or logs in
- Credentials are validated

### Who handles this
- **Supabase Auth** → *Passport Control*

Supabase Auth answers one question only:

> “Is this a real person with valid credentials?”

Auth does **not** know:
- the user’s role
- what pages they can access
- whether onboarding is complete

It only provides identity (`auth.users.id`).

---

## 🖨️ 2. Automatic Check-In (Database Trigger)

When a user is created in `auth.users`, the system automatically prepares their internal record.

### What happens
- Database trigger `handle_new_user()` runs
- Creates:
  - `profiles` row (application identity)
  - `talent_profiles` or `client_profiles` row

### Airport metaphor
This is the **self-service check-in kiosk**.

No UI code runs.  
No middleware runs.  
The database handles it.

⚠️ **Rule**
Never recreate this logic in frontend code or middleware.  
If this breaks, you fix the **trigger**, not the UI.

---

## 🛂 3. Airport Security (Middleware)

Once authenticated, the user attempts to enter the app.

They hit **middleware**.

### Middleware’s job
Middleware is **airport security**.

It checks:
1. Is there a valid session?
2. Is the user suspended?
3. Is this route allowed for this passenger?

Middleware does **not**:
- create profiles
- fix onboarding
- apply business rules
- mutate data

### Critical design decision
If a user’s `profiles` row is *temporarily missing*:
- Middleware allows them through on **safe routes**
- The app heals itself later

This prevents:
- infinite redirect loops
- random login failures
- “works on refresh” bugs

---

## 🏢 4. The Terminal (Frontend UI)

The UI is the **terminal building**.

It:
- displays dashboards
- shows forms
- collects intent

It does **not**:
- decide permissions
- enforce roles
- write business rules

The UI asks questions.  
It does not answer them.

---

## 👩‍✈️ 5. Airport Staff (Server Actions)

When a user clicks:
- “Apply”
- “Post Gig”
- “Accept Application”
- “Subscribe”

### Who acts
**Server Actions** are trusted airport staff.

They:
- create gigs
- insert applications
- create bookings
- talk to Stripe
- send emails

⚠️ **Rule**
All database mutations happen here.

If you see writes in client components, that’s a violation.

---

## ✈️ 6. Flights (Gigs)

A **Gig** is a flight.

- Clients = airlines
- Gigs = published flights

A gig includes:
- destination
- requirements
- compensation
- status (draft / active / closed)

Once active, it becomes visible to Talent.

---

## 🎟️ 7. Seat Requests (Applications)

Talent applies to a gig.

This creates an **application**.

Think:
> “I want a seat on this flight. Here’s why I qualify.”

Rules:
- One application per talent per gig
- Enforced by DB + server actions

Emails are sent.
Both sides are notified.

---

## 🪪 8. Confirmed Seats (Bookings)

When a client accepts an application:

- application status updates
- a **booking** is created

Booking = **confirmed seat on the manifest**

Downstream systems trust bookings as truth.

---

## 🧳 9. Baggage & Proof (Storage + Portfolio)

Talent uploads:
- avatars
- portfolio items

These live in **Supabase Storage**.

Database rows store:
- object paths (tags)
- not the files themselves

Signed URLs are temporary claim tickets.

⚠️ Never expose raw storage paths.

---

## 💳 10. Ticketing & Access (Stripe)

Stripe is the **ticketing counter**.

It:
- collects payment
- manages subscriptions

Stripe does **not** update your database directly.

Instead:
1. Stripe sends webhooks
2. API routes receive them
3. Server updates `profiles.subscription_status`

Access is granted or revoked based on DB state.

---

## 📣 11. Announcements (Email)

Resend is the **airport PA system**.

Emails include:
- application confirmations
- booking updates
- status notifications

No business logic lives here.

If email fails, the system still functions.

---

## 🔒 12. Locked Doors Everywhere (RLS)

Row Level Security is the airport’s **physical locks**.

Even if someone:
- bypasses UI
- crafts a bad request
- skips middleware

The database doors do not open.

RLS is the final authority.

---

## 🧠 13. Control Tower (Admin)

Admins are airport operations.

They can:
- view everything
- suspend users
- close gigs
- moderate abuse

They don’t bypass rules.
They have higher clearance.

---

## 🧭 14. The Golden Rules

If you remember nothing else, remember this:

- **Middleware** → security only  
- **Auth** → identity only  
- **Profiles** → source of truth  
- **Server Actions** → all mutations  
- **RLS** → final authority  
- **UI** → presentation only  

If something feels “random,” it’s usually because one of these boundaries was crossed.

---

## 🏁 Final Note

> **You are not building pages.  
> You are operating an airport.  
> Stability comes from respecting who is allowed to do what.**
