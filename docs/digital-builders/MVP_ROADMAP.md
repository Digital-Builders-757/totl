# Digital Builders - MVP Roadmap

**Status:** Planning Phase  
**Purpose:** Phased implementation checklist for Cursor AI and development tracking

---

## 🎯 Overview

This roadmap breaks down the MVP into clear phases with specific deliverables. Each phase builds on the previous one, creating a playable game incrementally. **v1 MVP is Web2-only** (no Solana/wallet requirements); crypto integration comes in v2+.

---

## Phase 0 – Foundation / Extraction

**Goal:** Extract base from TOTL and set up infrastructure

### **Extraction Tasks**
- [ ] Extract base from TOTL into new Digital Builders repo
- [ ] Strip all TOTL-specific models & Stripe logic
- [ ] Keep: Auth, layout, shadcn/Tailwind, basic dashboard pattern
- [ ] Wire Supabase project for Digital Builders (auth + DB)
- [ ] **Optional for v1:** Keep Solana wallet adapter code in `lib/solana/` but do NOT require it in core flows

### **Infrastructure Setup**
- [ ] Create new Supabase project
- [ ] Set up environment variables (Supabase)
- [ ] **Optional for v1:** Install Solana dependencies (for future v2+ integration)
- [ ] **Optional for v1:** Configure wallet adapter (Phantom, Solflare, Backpack) - behind feature flag
- [ ] Set up CI/CD pipelines
- [ ] Configure Cursor rules (`.cursorrules`)

### **Database Setup**
- [ ] Create initial migration file
- [ ] Implement core schema (profiles, game_accounts, characters, cities/districts)
- [ ] Implement economy schema (db_cred_balances, db_cred_transactions) - **off-chain only for v1**
- [ ] Implement job schema (jobs, character_jobs)
- [ ] Implement action schema (actions, character_actions)
- [ ] Set up RLS policies
- [ ] Run migrations and verify

---

## Phase 1 – Core MMO Skeleton

**Goal:** Basic character creation and dashboard

### **Character Creation**
- [ ] Email/password auth (Supabase) - **no wallet required for v1**
- [ ] Name input with validation (display name / handle)
- [ ] Track selection (Developer, Creator, Strategist, Other)
- [ ] Starting District selection (Downtown, Arts District, Campus, Harbor, etc.)
- [ ] Optional: short "About" tagline
- [ ] Character preview
- [ ] Server action: Create character
- [ ] Link character to `game_accounts`
- [ ] Initialize hidden stats (skill_code, skill_creative, skill_ops, charisma, consistency, mystic)
- [ ] Initialize health (100), energy (100), builder_level (1), builder_xp (0)

### **Character Dashboard**
- [ ] Display character info (name, track, district)
- [ ] Show DB Cred balance
- [ ] Show Builder Level badge
- [ ] Display energy bar (0-100) - **not health, energy for v1**
- [ ] Show current district/city
- [ ] Top bar with:
  - Job timer indicator (READY or countdown)
  - Action timer indicator
  - Quick buttons: Jobs, Actions, City, Messages
- [ ] Center content: City location cards (Cowork, University, Studio, Neighborhoods)
- [ ] Bottom bar: "Players Online in Your City: X" with online users list

---

## Phase 2 – Economy & Timers

**Goal:** Core economic gameplay loops

### **Daily Check-In / UBI System (Optional)**
- [ ] Create `lib/game/daily-checkin.ts` - Daily reward logic
- [ ] Store `last_daily_checkin_at` per account
- [ ] Calculate daily reward (small DB Cred + XP)
- [ ] Daily check-in UI (`app/dashboard/daily-checkin/page.tsx`)
- [ ] Server action: Claim daily check-in
- [ ] Update `db_cred_balances`
- [ ] Log transaction in `db_cred_transactions`
- [ ] Display daily check-in timer

### **Job Timer System**
- [ ] Create `lib/game/jobs.ts` - Job timer logic
- [ ] Create `jobs` table entries (3-5 starter jobs per track):
  - Dev: "Fix a small bug", "Ship a landing page section"
  - Creator: "Draft a hook for a short", "Edit a 30s clip"
  - Strategist: "Write a 3-bullet pitch", "Plan a sprint backlog"
- [ ] Create `character_jobs` records
- [ ] Job selection UI (`app/jobs/page.tsx`)
- [ ] Job detail page (`app/jobs/[jobId]/page.tsx`)
- [ ] Server action: Execute job
- [ ] Timer check: `next_job_available_at` (5-minute cooldown)
- [ ] Success/failure roll using hidden stats + randomness
- [ ] Pay DB Cred on completion
- [ ] Grant track-specific XP on success
- [ ] Update `next_job_available_at`
- [ ] Display job timer status

### **Action Timer System**
- [ ] Create `lib/game/actions.ts` - Action timer logic
- [ ] Create `actions` table entries:
  - Freelance Gigs (extra DB Cred, more variance)
  - Collab Actions ("Cold DM a creator", "Jump on a spontaneous collab")
  - PVP-lite Actions ("Underbid a job", "Idea Poach")
- [ ] Action selection UI (`app/actions/page.tsx`)
- [ ] Action detail page (`app/actions/[actionId]/page.tsx`)
- [ ] Server action: Execute action
- [ ] Timer check: `action_timer_available_at` (5-minute cooldown)
- [ ] Success/failure probability calculation (using hidden stats)
- [ ] Reward DB Cred and XP on success
- [ ] Update `action_timer_available_at`
- [ ] Display action timer status

---

## Phase 3 – PVP-lite & Presence

**Goal:** Lightweight conflict system and online presence

### **Online Presence System**
- [ ] Store `last_seen_at` on each character
- [ ] "Online" = `last_seen_at` within last 5 minutes
- [ ] Bottom bar: "X Builders Online in Your City"
- [ ] Online players list UI (`app/city/online-players/page.tsx`)
- [ ] Display: Username/handle, Track, District
- [ ] Action buttons: View Profile, Invite to Collab (stub), Try Risky Action

### **PVP-lite Conflict System**
- [ ] Create `lib/game/conflict.ts` - **CRITICAL: All conflict logic here**
- [ ] Function: `performUnderbid(attackerId, defenderId)` - Try to steal a job
- [ ] Function: `performIdeaPoach(attackerId, defenderId)` - Swipe DB Cred or XP
- [ ] Function: `performCollabChallenge(attackerId, defenderId)` - Compete for opportunity
- [ ] Each function:
  - Loads attacker + defender stats from DB (server-side only)
  - Validates: same district, both active, not on cooldown
  - Computes success chance from stats + randomness
  - Calculates DB Cred/XP swing (no permanent harm)
  - Updates character stats atomically
  - Inserts `interaction_logs` rows
  - Emits Realtime event

### **Interaction Logs**
- [ ] Create `interaction_logs` table migration
- [ ] Log all PVP-lite interactions
- [ ] Display interaction history on profile
- [ ] Real-time updates via Supabase Realtime

### **PVP-lite UI**
- [ ] Risky action button on character profile (`components/conflict/risky-action-button.tsx`)
- [ ] Interaction type selection (Underbid, Idea Poach, Collab Challenge)
- [ ] Interaction result display (text-based, Mafia Returns style)
- [ ] No death screen - just outcome messages

**Note:** No permanent character death in v1. That's reserved for future hardcore modes if desired.

---

## Phase 4 – Progression & Careers

**Goal:** Skill-based progression and track advancement

### **Progression System**
- [ ] Track XP accumulation (skill_code, skill_creative, skill_ops)
- [ ] Builder Level calculation based on total XP
- [ ] Unlock system:
  - New jobs (higher payouts) at certain levels
  - New neighborhoods/buildings at certain levels
  - Titles and profile cosmetics
- [ ] Progression UI (`app/progression/page.tsx`)
- [ ] Display skill progress (hidden stats shown as progress bars, not exact numbers)

### **Career/Track System**
- [ ] Create `careers` table entries (linked to tracks)
- [ ] Link `jobs` to `careers`
- [ ] Career UI (`app/careers/page.tsx`)
- [ ] Display career paths per track
- [ ] Show job requirements and unlocks
- [ ] Career progression tracking
- [ ] Job promotion system (unlock better jobs as you level)

### **Unlocks & Cosmetics**
- [ ] Profile themes/titles unlockable with DB Cred
- [ ] "Tools" (bonus items that improve success odds) purchasable with DB Cred
- [ ] VIP areas/events unlockable with DB Cred
- [ ] Cosmetic shop UI (`app/shop/page.tsx`)

---

## Phase 5 – Land/Spaces (Optional for v1)

**Goal:** Virtual spaces and ownership

**Note:** This phase is optional for v1 MVP. Can be deferred to v2+.

### **Virtual Spaces**
- [ ] Create `land_plots` table entries (desks, offices, studios)
- [ ] Space market UI (`app/spaces/page.tsx`)
- [ ] Display available spaces
- [ ] Space purchase flow (DB Cred)
- [ ] Assign space type (desk, office, studio)

### **Space Income**
- [ ] Income streams tied to owning spaces
- [ ] Passive income generation
- [ ] Space management UI

---

## Phase 6 – Crypto Integration (v2+)

**Goal:** On-chain token integration

**Note:** This phase is for v2+ and beyond. v1 MVP does NOT include this.

### **Solana Integration**
- [ ] Map DB Cred to on-chain SPL token (spendable currency)
- [ ] Map Builder Power to governance token (long-term status)
- [ ] Wallet connection flow (optional)
- [ ] Token minting/burning logic
- [ ] On-chain transaction logging

### **NFT Integration (Future)**
- [ ] NFT achievements for unique accomplishments
- [ ] NFT profile customization
- [ ] NFT marketplace integration

---

## 📊 Phase Summary

| Phase | Focus | Duration | Key Deliverables |
|-------|-------|----------|------------------|
| **0** | Foundation | 1 week | Extraction, DB schema, auth setup |
| **1** | Core Skeleton | 1 week | Character creation, dashboard |
| **2** | Economy | 1 week | Daily check-in, jobs, actions, DB Cred ledger |
| **3** | PVP-lite & Presence | 1 week | Online players, PVP-lite interactions |
| **4** | Progression | 1 week | Skills, careers, unlocks |
| **5** | Land/Spaces | 1 week | Virtual spaces, ownership (optional for v1) |
| **6** | Crypto Integration | Future | Solana tokens, NFTs (v2+) |

**Total MVP Timeline: 4-5 weeks** (Phases 0-4 for core MVP)

---

## 🎯 v1 MVP Scope

**Included:**
- ✅ Email/password auth (no wallet required)
- ✅ Character creation (handle, track, district)
- ✅ Dashboard (job timer, action timer, city locations, online users)
- ✅ Daily check-in (optional)
- ✅ Job system (5-minute timer, DB Cred + XP rewards)
- ✅ Action system (freelance + PVP-lite)
- ✅ PVP-lite interactions (underbid, idea poach, collab challenge)
- ✅ Online presence system
- ✅ Progression system (hidden stats, builder levels, unlocks)
- ✅ DB Cred economy (off-chain ledger)

**Not in v1 (but architected for later):**
- ⏳ Full Solana integration & tokens
- ⏳ Land, businesses, secret rooms
- ⏳ Deep crime/legal/political systems
- ⏳ City wars
- ⏳ Will/inheritance system
- ⏳ Detailed factions and elections
- ⏳ Permanent character death

---

## ✅ Definition of Done

**Phase 0:**
- [ ] Project extracted from TOTL
- [ ] Database schema created and migrated
- [ ] Auth works (email/password)
- [ ] Build passes locally

**Phase 1:**
- [ ] Player can sign up/login
- [ ] Player can create character (handle, track, district)
- [ ] Player can view dashboard
- [ ] Dashboard shows job timer, action timer, city locations, online users count

**Phase 2:**
- [ ] Player can claim daily check-in (if implemented)
- [ ] Player can execute jobs (with 5-minute timer)
- [ ] Player can execute actions (with 5-minute timer)
- [ ] DB Cred ledger works (balances and transactions)

**Phase 3:**
- [ ] Player can see online players list
- [ ] Player can attempt PVP-lite interactions (underbid, idea poach)
- [ ] Interaction logs record all conflicts
- [ ] Real-time updates work via Supabase Realtime

**Phase 4:**
- [ ] Player gains XP from jobs/actions
- [ ] Builder Level increases with XP
- [ ] New jobs unlock at certain levels
- [ ] Player can purchase cosmetics/tools with DB Cred

**Phase 5 (Optional):**
- [ ] Player can buy virtual spaces
- [ ] Spaces generate passive income

**Phase 6 (Future v2+):**
- [ ] Wallet connection works
- [ ] DB Cred maps to on-chain token
- [ ] Builder Power maps to governance token

---

**Ready to start Phase 0? Let's extract and build!** 🚀

