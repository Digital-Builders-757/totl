# Blockchain Gang Life - MVP Roadmap

**Status:** Planning Phase  
**Purpose:** Phased implementation checklist for Cursor AI and development tracking

---

## 🎯 Overview

This roadmap breaks down the MVP into clear phases with specific deliverables. Each phase builds on the previous one, creating a playable game incrementally.

---

## Phase 0 – Foundation / Extraction

**Goal:** Extract base from TOTL and set up infrastructure

### **Extraction Tasks**
- [ ] Extract base from TOTL into new BCGW repo
- [ ] Strip all TOTL-specific models & Stripe logic
- [ ] Keep: Auth, layout, shadcn/Tailwind, basic dashboard pattern
- [ ] Wire Supabase project for BCGW (auth + DB)
- [ ] Wire Solana wallet adapter and "Connect Wallet" button

### **Infrastructure Setup**
- [ ] Create new Supabase project
- [ ] Set up environment variables (Supabase + Solana)
- [ ] Install Solana dependencies
- [ ] Configure wallet adapter (Phantom, Solflare, Backpack)
- [ ] Set up CI/CD pipelines
- [ ] Configure Cursor rules (`.cursorrules`)

### **Database Setup**
- [ ] Create initial migration file
- [ ] Implement core schema (profiles, game_accounts, characters, cities)
- [ ] Implement economy schema (bcgc_balances, bcgc_transactions)
- [ ] Implement job schema (jobs, character_jobs)
- [ ] Implement action schema (actions, character_actions)
- [ ] Set up RLS policies
- [ ] Run migrations and verify

---

## Phase 1 – Core MMO Skeleton

**Goal:** Basic character creation and dashboard

### **BCGW Tier System**
- [ ] Create `lib/bcgwTiers.ts` with mocked balance → tier mapping
- [ ] Implement tier calculation (Iron → Diamond)
- [ ] Cache tier in `profiles` table
- [ ] UI component: BCGW tier badge
- [ ] Display tier on dashboard

### **Character Creation**
- [ ] Wallet-gated character creation flow
- [ ] Name input with validation
- [ ] Gender selection (Male/Female/Unidentified)
- [ ] Starting city selection (3-5 predefined cities)
- [ ] Character preview
- [ ] Server action: Create character
- [ ] Link character to `game_accounts`

### **Character Dashboard**
- [ ] Display character info (name, gender, city, tier)
- [ ] Show BCGC balance
- [ ] Show BCGW tier badge
- [ ] Display health bar (0-100)
- [ ] Show current city
- [ ] Quick action buttons (UBI, Jobs, Actions)
- [ ] Navigation links (University, Careers, City Map, Land Market)

---

## Phase 2 – Money Loops & Crime

**Goal:** Core economic gameplay loops

### **UBI System**
- [ ] Create `lib/game/ubi.ts` - UBI calculation logic
- [ ] Store `last_ubi_claim_at` per account
- [ ] Calculate UBI based on BCGW tier
- [ ] UBI claim UI (`app/dashboard/ubi/page.tsx`)
- [ ] Server action: Claim UBI
- [ ] Update `bcgc_balances`
- [ ] Log transaction in `bcgc_transactions`
- [ ] Display UBI claim timer

### **Job Timer System**
- [ ] Create `lib/game/jobs.ts` - Job timer logic
- [ ] Create `jobs` table entries (basic jobs)
- [ ] Create `character_jobs` records
- [ ] Job selection UI (`app/jobs/page.tsx`)
- [ ] Job detail page (`app/jobs/[jobId]/page.tsx`)
- [ ] Server action: Execute job
- [ ] Timer check: `next_job_available_at`
- [ ] Pay BCGC on completion
- [ ] Grant career XP
- [ ] Update `next_job_available_at`
- [ ] Display job timer status

### **Action Timer System**
- [ ] Create `lib/game/actions.ts` - Action timer logic
- [ ] Create `actions` table entries:
  - Freelance (city workforce tasks)
  - Community service
  - Aggravated crime (pickpocket, mugging)
- [ ] Action selection UI (`app/actions/page.tsx`)
- [ ] Action detail page (`app/actions/[actionId]/page.tsx`)
- [ ] Server action: Execute action
- [ ] Timer check: `action_timer_available_at`
- [ ] Success/failure probability calculation
- [ ] Reward BCGC and XP on success
- [ ] Update `action_timer_available_at`

### **Witness System**
- [ ] On failed aggravated crime: chance to create `witness_reports`
- [ ] Witness report generation logic
- [ ] Police notification system (real-time)
- [ ] Witness report UI (for police)

---

## Phase 3 – PVP, Health, Death, Wills

**Goal:** Conflict system and inheritance

### **Conflict System Core**
- [ ] Create `lib/game/conflict.ts` - **CRITICAL: All conflict logic here**
- [ ] Function: `performPickpocket(attackerId, defenderId)`
- [ ] Function: `performMugging(attackerId, defenderId)`
- [ ] Function: `performGBH(attackerId, defenderId)`
- [ ] Function: `performKill(attackerId, defenderId)`
- [ ] Each function:
  - Loads attacker + defender stats from DB (server-side only)
  - Validates: same city, both alive, requirements met
  - Computes success chance from stats + equipment + drugs
  - Calculates damage and BCGC stolen
  - Updates `characters.stats.health` and `is_alive` atomically
  - Inserts `conflict_logs` rows
  - Emits Realtime event

### **Health System**
- [ ] Health range: 0-100
- [ ] At 0 health: Set `is_alive = false`
- [ ] Health bar component (`components/conflict/health-bar.tsx`)
- [ ] Display health on dashboard
- [ ] Healing methods (stub for future):
  - Hospital jobs
  - Time-based recovery
  - Drugs/items

### **Will & Inheritance System**
- [ ] Create `wills` table migration
- [ ] Create `lib/game/wills.ts` - Inheritance resolution
- [ ] Function: `applyInheritanceForAccount(accountId)`
- [ ] Will creation UI (`app/wills/page.tsx`)
- [ ] Will creation server action
- [ ] Designate beneficiary character
- [ ] Choose what transfers (BCGC, land, businesses)
- [ ] Inheritance resolution on death:
  - Mark character dead + `inheritance_transferred = false`
  - On new character or login: Apply inheritance
  - Transfer BCGC, land, businesses to beneficiary
  - Mark `conflict_logs.inheritance_transferred = true`

### **PVP UI**
- [ ] Attack button on character profile (`components/conflict/attack-button.tsx`)
- [ ] Conflict type selection (pickpocket, mugging, GBH, kill)
- [ ] Conflict result display
- [ ] Death screen
- [ ] "Create new character / heir" flow

---

## Phase 4 – Social, Factions, City Wars

**Goal:** Social systems and city-level conflict

### **Social System**
- [ ] Create `faction_members` table migration
- [ ] Create `character_relationships` table migration
- [ ] Create `lib/game/factions.ts` - Faction logic
- [ ] Friend list UI (`app/friends/page.tsx`)
- [ ] Add/remove friend functionality
- [ ] Display friends on dashboard
- [ ] Relationship types: friend, rival, spouse, family, enemy

### **Faction System**
- [ ] Faction UI (`app/factions/page.tsx`)
- [ ] Join/leave faction functionality
- [ ] Display faction roster
- [ ] Faction roles: leader, officer, member, recruit
- [ ] Faction-controlled cities display

### **City Wars**
- [ ] Create `city_wars` table migration
- [ ] Create `war_events` table migration
- [ ] Create `lib/game/wars.ts` - War logic
- [ ] War declaration system
- [ ] Link conflicts to wars
- [ ] War event feed
- [ ] War resolution logic
- [ ] Update city control on victory
- [ ] War UI (`app/wars/page.tsx`)

---

## Phase 5 – University & Careers

**Goal:** Education and career progression

### **University System**
- [ ] Create `degrees` table entries
- [ ] Create `character_degrees` records
- [ ] University UI (`app/university/page.tsx`)
- [ ] Study action (consumes action timer)
- [ ] Degree progress tracking
- [ ] Degree completion unlocks careers

### **Career System**
- [ ] Create `careers` table entries
- [ ] Link `jobs` to `careers`
- [ ] Career UI (`app/careers/page.tsx`)
- [ ] Display career paths
- [ ] Show job requirements
- [ ] Career progression tracking
- [ ] Job promotion system

---

## Phase 6 – Land & Business

**Goal:** Economic systems

### **Land Market**
- [ ] Create `land_plots` table entries
- [ ] Land market UI (`app/land/page.tsx`)
- [ ] Display available plots
- [ ] Land purchase flow (BCGC or BCGW)
- [ ] Assign business type to land

### **Business System**
- [ ] Create `businesses` table entries
- [ ] Business creation UI
- [ ] Business types: Bar, Farm, Casino, etc.
- [ ] Business operations
- [ ] Rent system (`business_rentals`)
- [ ] Secret rooms (`secret_rooms`)

---

## 📊 Phase Summary

| Phase | Focus | Duration | Key Deliverables |
|-------|-------|----------|------------------|
| **0** | Foundation | 1 week | Extraction, wallet setup, DB schema |
| **1** | Core Skeleton | 1 week | Character creation, dashboard |
| **2** | Economy | 1 week | UBI, jobs, actions, witness system |
| **3** | PVP & Wills | 1 week | Conflict system, health, death, inheritance |
| **4** | Social & Wars | 1 week | Friends, factions, city wars |
| **5** | Education | 1 week | University, careers |
| **6** | Land & Business | 1 week | Land market, businesses |

**Total MVP Timeline: 6-8 weeks**

---

## 🎯 v1 MVP Scope

**Included:**
- ✅ Wallet connection & BCGW tier
- ✅ Character creation
- ✅ UBI, jobs, actions
- ✅ Basic PVP (pickpocket, mugging, GBH, kill)
- ✅ Health & death system
- ✅ Will & inheritance
- ✅ Basic social (friends, factions)
- ✅ One city

**Future (v2+):**
- ⏳ Multiple cities
- ⏳ City wars (full implementation)
- ⏳ Advanced crime networks
- ⏳ Elections
- ⏳ Complex raids
- ⏳ On-chain staking program
- ⏳ NFT marketplace

---

## ✅ Definition of Done

**Phase 0:**
- [ ] Project extracted from TOTL
- [ ] Wallet connects successfully
- [ ] Database schema created and migrated
- [ ] Build passes locally

**Phase 1:**
- [ ] Player can connect wallet
- [ ] Player can see BCGW tier
- [ ] Player can create character
- [ ] Player can view dashboard

**Phase 2:**
- [ ] Player can claim UBI
- [ ] Player can execute jobs (with timer)
- [ ] Player can execute actions (with timer)
- [ ] Witness reports generate on crimes

**Phase 3:**
- [ ] Player can attack other players
- [ ] Health system works (0-100)
- [ ] Death system works (`is_alive = false`)
- [ ] Inheritance transfers assets

**Phase 4:**
- [ ] Player can add friends
- [ ] Player can join factions
- [ ] Wars can be declared
- [ ] War events track conflicts

**Phase 5:**
- [ ] Player can study at university
- [ ] Player can earn degrees
- [ ] Degrees unlock careers
- [ ] Career progression works

**Phase 6:**
- [ ] Player can buy land
- [ ] Player can create businesses
- [ ] Rent system works
- [ ] Secret rooms can be created

---

**Ready to start Phase 0? Let's extract and build!** 🚀

