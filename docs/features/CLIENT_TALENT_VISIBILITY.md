# Client Talent Visibility

**Last Updated:** December 1, 2025

## Purpose

This note explains how TOTL surfaces talent to clients and why the platform never offers a public talent directory. It also captures the messaging we lean on when we tell clients how the product works today.

## Current behavior

- Clients only see talent who have actually applied to their gigs. Every dashboard query filters `applications` by `.eq("gigs.client_id", user.id)` and joins the `profiles` entry for each applicant.
- The `View Profile` action simply routes to the applicant's existing public profile (`/talent/:slug` or `/talent/:id`), so clients never get direct access to the entire roster.
- There is no equivalent client-only “browse everyone” view. `/talent` is a talent-facing experience guarded by `profiles.role === "talent"`, so clients automatically hit the gate if they try to land there.

## Messaging guidance

1. **Navbar wording (clients only):** replace any generic “Talent” link with “Applicants,” “My Talent Pool,” or similar so the nav copy matches the data. Linking clients to `/client/applications` or a future `/client/talent` page keeps expectations aligned.
2. **Dashboard copy:** Wherever we surface client applications, insert a sentence such as _“This view only shows talent who applied to your gigs—post a gig to start collecting curated applicants.”_ This reinforces the product choice and avoids confusion.
3. **About / marketing copy:** Mention that TOTL keeps talent private unless they opt into a specific project. That transparency works well with the “curated, invite-only” brand voice.
4. **Gig creation success messaging:** After a client posts a gig, remind them that talent will appear as applications in their Applicants tab. This reinforces the funnel: post → apply → review.

## Why it matters

- **Privacy & safety:** Talent profiles are not exposed to every client; only those who opted in through applications appear in a given client’s view.
- **Quality control:** Clients have to commit to a real, paid project before seeing applicant details, which discourages speculative browsing.
- **Product simplicity:** We avoid building (and maintaining) a giant filter/sort experience — instead we focus on giving each client their own curated roster.

## Optional evolution

If we ever want a richer “My Talent Pool” page:

1. Build `/client/talent` that aggregates unique `talent_id`s for `applications` where `gigs.client_id = current_client`.
2. Join each talent's public profile data + “applied to X gigs” metadata.
3. This keeps the directional guardrail (only your applicants) without duplicating a global directory.

## Reference snippet

```ts
.from("applications")
.select(`
  *,
  gigs!inner(title, category, location, compensation),
  profiles!talent_id(display_name, email_verified, role, avatar_url)
`)
.eq("gigs.client_id", user.id)
```

Call this doc from `docs/DOCUMENTATION_INDEX.md` so the team always has a reference for the client visibility rule.

