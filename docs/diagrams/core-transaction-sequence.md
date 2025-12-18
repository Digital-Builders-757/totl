# Core Transaction Sequence Diagram

**File:** `docs/diagrams/core-transaction-sequence.png`  
**Purpose:** Shows the **primary business flow**: create gig → apply → accept → booking → notifications.

## What this diagram represents
1. Client creates gig → DB inserts `gigs`
2. Talent applies → Server inserts `applications(status=new)`
3. System emails client (new application)
4. Client accepts → Server updates application + creates booking
5. System emails talent + client (booking confirmed)

## When to use this diagram
Use when touching:
- gig creation
- application submission/status changes
- booking creation/status changes
- email notifications around these steps

## Key risks this diagram highlights
- RLS mismatches between “who inserts bookings” vs “who owns the gig”
- Double-email or double-booking if endpoints aren’t idempotent
- Status transitions that get out of sync between `applications` and `bookings`

## Notes
- This is where most marketplace logic lives (Airport Staff).
