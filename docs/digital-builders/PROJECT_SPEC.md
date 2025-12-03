# Digital Builders – Text-Based MMO for the Creative Tech City

**Project Name:** Digital Builders  

**Version:** v1 – Web2 MVP (crypto optional in v2+)  

**Original Template:** Extracted from TOTL Agency architecture (Next.js + Supabase)  

---

## 🎯 High-Level Concept

**Digital Builders** is a browser-based, text-driven MMO for the existing Digital Builders community (Discord, Instagram, real-life events). Players create a character in a shared "City of Builders," pick a track (developer, designer, creator, founder, community organizer, etc.), and progress by running timed "jobs" and "actions" that simulate real work and collaboration in the tech/creative world.

The game is:

- **Text-first:** Inspired by games like Mafia Returns: mostly lists, cards, timers, and text events.

- **Learn-by-doing:** The "grind" is built around repeating actions that build skill, connections, and "Builder Cred."

- **Community-driven:** Built specifically for the Digital Builders community you already have (Discord, IG).

- **Future crypto-ready:** v1 uses an internal, off-chain currency and XP; Solana + tokens come later.

---

## 🌍 Theme & Lore

### Setting

A near-future city where **creative technologists** are rebuilding culture and infrastructure with code, art, and community. The "gangs" are guilds and crews of builders:

- **Coders** – Full-stack devs, automation wizards, AI tinkerers.

- **Creators** – Content makers, editors, storytellers, community builders.

- **Strategists** – Product thinkers, marketers, operators.

- **Mystics** (hidden later) – People who find the secret "inner game" of Digital Builders (rituals, lore, hidden quests).

The city is structured like a **hub world**:

- **Coworking Spaces** (Assembly analog, etc.)  

- **Studios** (video, audio, design labs)  

- **Campus** (university / bootcamp)  

- **Neighborhoods** (residential areas, side-hustle work)  

- **HQs** (guild houses, hidden Societies later on)

---

## 👤 Core Player Flow

### 1. Access & Account Creation (MVP)

- Auth is **Supabase email/password** (reuse TOTL auth patterns).

- No wallet requirement for v1 (Solana hooks live in the background for v2).

- When a user signs in the first time, the system:

  - Creates a `profile` row

  - Creates a `game_account` (Digital Builders account)

  - Sends them to **Character Creation**

> This reuses the existing TOTL authentication setup as the base and swaps "talent/client/admin" for "builder player."

### 2. Character Creation

**Fields (MVP):**

- Display name / handle  

- Track (Developer, Creator, Strategist, Other)  

- Starting District (e.g., Downtown, Arts District, Campus, Harbor)  

- Optional: short "About" tagline

Hidden fields:

- `skill_code`, `skill_creative`, `skill_ops`, `charisma`, `consistency`, `mystic` (all numeric)  

- `health` (0–100), `energy` (0–100)  

- `builder_level`, `builder_xp`  

Stats are **hidden from the player** in the UI but used server-side for all checks (job outcomes, PVP, unlocks).

### 3. Main Dashboard (MVP)

The dashboard has three main zones:

1. **Top bar:**

   - "Job Income" indicator with:

     - Status: `READY` or countdown timer (e.g., `02:31` left)

   - "Action Timer" indicator (for side-quests / PVP actions)

   - Quick buttons: `Jobs`, `Actions`, `City`, `Messages`

2. **Center content:**

   - Card grid for **City Locations**:

     - Cowork, University, Studio, Neighborhoods, etc.

     - Clicking into a building shows the available jobs/actions/quests for that location.

3. **Bottom bar:**

   - "Players Online in Your City: X"

   - Button to view **Online Players** → list of characters currently active (last_seen within N minutes)

   - From the list, you can:

     - View profile  

     - Send a DM (later)  

     - Attempt a PVP action (debate, collab steal, "pickpocket" analog, etc.)

---

## 💰 Economy – Web2 First

### Core Currency for v1

- Call the internal off-chain currency **DB Cred** (`db_cred_balance` in DB).

- Players earn **DB Cred** from:

  - Jobs (on a job timer)

  - Actions (side gigs)

  - Completing missions or mini-quests

- DB Cred is used to:

  - Buy cosmetic upgrades (profile themes, titles)

  - Buy "Tools" (bonus items that improve success odds)

  - Unlock certain areas or events (e.g., VIP coworking room)

> Architecturally, DB Cred is the same pattern as BCGC in the old docs, just **off-chain only** in v1; later it can be mirrored to a Solana SPL token using the same ledger pattern you already defined for BCGC.

### Future Crypto Layer (v2+)

- Introduce **Solana** integration later:

  - 1 on-chain token for long-term "Builder Power" / governance (analogous to BCGW).

  - 1 on-chain token for "spendable" in-game currency (analogous to BCGC).

- v1 should:

  - Keep currency and transactions **in Supabase tables**.

  - Keep Solana code behind feature flags / stub functions so integration is smooth later.

---

## 🔁 Core Loops (MVP)

### 1. Job Timer – Learn & Earn

- Every **5 minutes** (configurable), the player can run **one job action**.

- Jobs are tied to the player's **track** and **district**:

  - Dev example: "Fix a small bug", "Ship a landing page section"

  - Creator example: "Draft a hook for a short", "Edit a 30s clip"

  - Strategist example: "Write a 3-bullet pitch", "Plan a sprint backlog"

**Flow:**

1. Player clicks `Jobs` → sees available jobs.

2. Chooses one (with difficulty + reward info).

3. Server:

   - Checks `next_job_available_at`.

   - Rolls success/failure using hidden stats + randomness.

   - Rewards DB Cred + XP on success (XP tied to relevant stat).

   - Updates `next_job_available_at`.

The UX is "simple text outcome" – think Mafia Returns, not flashy visuals.

### 2. Action Timer – Side Actions & Risky Plays

Separate timer: **Action Timer** (also 5 minutes; can be tuned).

Action types (MVP):

- **Freelance Gigs** – Extra DB Cred, more variance.

- **Collab Actions** – E.g., "Cold DM a creator", "Jump on a spontaneous collab".

- **PVP-ish Actions** – Lightweight attacks like:

  - "Underbid a job" (you try to steal a job from another player)

  - "Idea Poach" (chance to swipe a tiny bit of their DB Cred or XP)

These use **hidden stats + randomness**. For example:

```text
successChance = f(attacker.skill_creative + attacker.charisma, defender.consistency, random)
```

No blood and death here – "harm" is missed opportunities, lost Cred, or temporary debuffs to timers.

### 3. Progression

Players progress by:

* Accumulating **DB Cred**

* Gaining **XP** in track-specific skills

* Unlocking:

  * New jobs (higher payouts)

  * New neighborhoods / buildings

  * Titles and profile cosmetics

Later phases:

* Real world cross-over: linking in-game mastery to **real workshops, mentorships, bounties**, etc.

---

## ⚔️ PvP & Presence (MVP)

We need a **minimal but real** sense of "who's online" and ability to interact.

### Online Presence

* Store `last_seen_at` on each character.

* "Online" = `last_seen_at` within last 5 minutes.

* Bottom bar always shows: "X Builders Online in Your City".

* Clicking opens a panel with:

  * Username/handle

  * Track (Dev, Creator, etc.)

  * Simple action buttons:

    * `View Profile`

    * `Invite to Collab` (stub)

    * `Try Risky Action` (e.g. "Underbid This Builder")

### PVP Resolution Rules

* All PVP logic runs server-side in `lib/game/conflict.ts`, just like the old design. 

* Client only sends:

  * `attacker_character_id`

  * `defender_character_id`

  * `interaction_type` (e.g., `UNDERBID`, `IDEA_POACH`)

* Server:

  * Validates both players exist, are in same district, not on cooldown.

  * Fetches hidden stats.

  * Computes outcome + rewards/penalties.

  * Writes to interaction log.

  * Emits a Supabase Realtime event so both UIs update quickly.

There's **no permanent character death** in v1; that's reserved for more "hardcore" later modes if you want them.

---

## 🧱 Architecture & Stack (MVP)

We reuse the existing TOTL + Blockchain Gang Life architecture:

* **Frontend:** Next.js 15 App Router, strict TypeScript, Tailwind, shadcn/ui.

* **Backend:** Supabase (Postgres + Auth + Realtime).

* **Hosting:** Vercel.

* **AI & Dev:** Cursor IDE with `.cursorrules` enforcing docs + schema as source of truth. 

### Core Tables (Renamed / Simplified)

At a high level (not going into every column here):

* `profiles` – user-level record (from Supabase auth).

* `game_accounts` – "Digital Builders account" (one per player).

* `characters` – individual characters (could support multiple later).

* `cities` / `districts` – starting locations.

* `jobs`, `character_jobs` – job definitions + progression.

* `actions`, `character_actions` – side actions + timers.

* `db_cred_balances`, `db_cred_transactions` – DB Cred ledger (copy pattern from `bcgc_balances` / `bcgc_transactions`).

* `interaction_logs` – PVP & social interactions.

Solana/BCGW/BCGC tables and logic are **kept out of v1** or turned into commented "future-phase" code.

---

## 🗺️ MVP Scope

**Included in v1:**

* Supabase auth (email/password).

* Single character per account.

* Dashboard with:

  * Job timer

  * Action timer

  * City location cards

  * Online users list

* Job system:

  * 3–5 starter jobs per track

  * 5-minute cooldown

  * DB Cred + XP rewards

* Action system:

  * At least 2–3 actions per track (freelance + PVP-lite)

* Hidden stat-based outcomes.

* Simple PVP interactions (no death, just Cred/XP swings).

* Basic profile customization (avatar placeholder, tagline).

**Not in v1 (but architected for later):**

* Full Solana integration & tokens.

* Land, businesses, secret rooms.

* Deep crime/legal/political systems from previous spec.

* City wars.

* Will/inheritance system.

* Detailed factions and elections.

We still use the **phased roadmap** style from the old MVP doc (Phase 0–6), but phases now map to Digital Builders features instead of crypto-crime features.

---

