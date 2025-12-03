# Blockchain Gang Life - Complete Project Specification

**Project Name:** Blockchain Gang Life  
**Metaverse:** Blockchain Gang World (BCGW)  
**Blockchain:** Solana (SPL tokens)  
**Version:** v1 Playable Web App

---

## 🎯 Project Overview

**Blockchain Gang Life** is a web-based RPG/metaverse management game set in **Blockchain Gang World**. Players navigate a post-war society where three major forces compete: the criminal underworld, the ruling class/politicians, and the legal system.

**Core Concept:** Players choose their path - become the law, rise above it, or undermine it from the shadows. The world is instance-based around cities, with player actions shaping each city's economy, politics, and culture.

---

## 🏗️ Tech Stack

### **Frontend**
- Next.js (App Router, latest stable)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui components
- Solana wallet support via `@solana/wallet-adapter` (Phantom, Solflare, Backpack minimum)
- State management: React Query (server data) + Zustand/Context (local state)

### **Backend / Database**
- Supabase (PostgreSQL) for:
  - Auth (email + wallet-based user linking)
  - Game state (players, characters, cities, jobs, timers, land, businesses, transactions)
- Row Level Security (RLS) where appropriate
- Server-side logic via Next.js Server Actions + Supabase client

### **Solana Integration**
- `@solana/web3.js` for RPC
- `@solana/wallet-adapter-react` and `@solana/wallet-adapter-wallets` for wallet abstraction
- Two SPL fungible tokens (assumed to exist):
  - `BCGW_MINT` - Blockchain Games World Token (utility/governance)
  - `BCGC_MINT` - Blockchain Game Cash (in-game currency)
- Token mint addresses via environment variables:
  - `NEXT_PUBLIC_BCGW_MINT_ADDRESS`
  - `NEXT_PUBLIC_BCGC_MINT_ADDRESS`

### **Environments**
- Local dev (mock Solana or devnet)
- Testnet/devnet deployment
- Mainnet-ready configuration

---

## 🌍 Core Lore & Game Concept

### **Setting**
Distant future, a planet recovering from a Great War. Society is unstable; rebuilding is underway.

### **Three Major Forces**
1. **Criminal Underworld** - Street gangs, biker gangs, mafioso
2. **Ruling Class / Politicians** - Mayors, political factions
3. **Legal System** - Police, courts, law enforcement

### **Player Agency**
Players choose their path:
- Become the law (police, judge, mayor)
- Rise above it (legitimate businesses, politics)
- Undermine it from the shadows (criminal organizations)

### **City Dynamics**
Each city's vibe depends on:
- Which players own land
- What businesses they've built
- Who controls politics and gangs

### **v1 Interface**
Browser-based RPG/sim interface with:
- Dashboards
- Lists
- Cards
- Timelines/timers
- Modal-based actions

---

## 💰 Tokens & Economy

### **BCGW - Utility / Governance Token (SPL)**

**Conceptual Utility:**
- Payments for goods and services across Blockchain Gang World
- **Staking BCGW → earns BCGC** over time
- Governance: More BCGW = more vote weight in ecosystem-wide proposals
- Discounts/cash-back on in-game purchases
- Ability to buy virtual land (city plots)
- Access to staking pools and higher-tier rewards
- Leveling up within the **BCGW Tier System**

**Implementation:**
- Treat BCGW as SPL token with mint address from env variable
- Do not build token-sale mechanics in v1
- Read wallet holdings for gating/tier checks
- Later: support "staking" via dedicated staking contract (stubbed for v1)

### **BCGC - In-Game Currency (SPL + Hybrid)**

**Conceptual Roles:**
- Earned through gameplay:
  - UBI (depending on BCGW stake)
  - Jobs and timers
  - Business profits
  - Competitions (boxing, dog fights, races, casino)
- Spent on:
  - NFTs/items
  - Virtual land
  - In-game goods and services
- Holding BCGC increases player status (leaderboards)
- Governance: Top BCGC holders (top 100) may vote on game-specific proposals
- Subject to periodic mint/burn mechanics for price stability

**Implementation for v1:**
- Treat BCGC as SPL token **plus** mirrored off-chain ledger in Postgres
- For v1: Maintain BCGC balances primarily in DB
- Provide hooks to sync on-chain balances later
- All transactions recorded in `bcgc_transactions` table

---

## 🏆 BCGW Tier System

### **Tiers**
- **Iron** - 100 BCGW
- **Bronze** - 1,000 BCGW
- **Gold** - 50,000 BCGW
- **Platinum** - 500,000 BCGW
- **Diamond** - 1,000,000 BCGW

### **Benefits**
- Discounts on goods & services
- Access to gated content (crypto curriculum, special Discord, private NFT auctions)
- Higher staking rewards (BCGC yield)
- Early access to announcements
- Governance/voting on impactful updates
- Access to digital real estate auctions
- Custom avatars, badges
- Inner-circle newsletter and VIP invites

### **Implementation**
- Create `lib/bcgwTiers.ts` helper module
- Accepts wallet's BCGW balance (fetched from Solana)
- Returns player's tier + benefits struct
- For v1: Implement mock RPC layer (easily swappable with real Solana calls)
- Store computed tier on `profiles` or `accounts` table for caching
- Always recompute when user reconnects wallet

---

## 👤 Core Player Flow

### **1. Access & Account Creation**

1. User visits app
2. Connects Solana wallet
3. App checks:
   - If they already have game account in Supabase
   - If they hold/stake enough BCGW to qualify
4. If eligible:
   - Create `profile` and `game_account` record
   - Let them create first character

### **2. Character Creation**

**Required Fields:**
- **Character name** - Nickname seen by others (can be changed later via premium rename)
- **Gender** - Male/Female/Unidentified (impacts NPC responses, can be changed later via "sex change surgery")
- **Starting City** - Choice influences early experience (3-5 predefined cities for v1)

**Planned (stub UI for v1):**
- Short questionnaire setting starting stats
- Determines whether character leans toward criminal or legit lifestyle

**Database Schema:**
- `profiles` - User-level record tied to Supabase auth
- `game_accounts` - Per-wallet account
- `characters`:
  - id (uuid)
  - account_id (fk)
  - name
  - gender
  - home_city_id
  - stats JSON (strength, intellect, charisma, criminal_xp, lawful_xp, health, stamina)
  - current_job_id (nullable)
  - current_city_id
  - is_alive (bool)
  - created_at / updated_at

### **3. After Creation - Character Dashboard**

**Landing View Includes:**
- Character summary (name, gender, city, tier)
- BCGW tier & BCGC balance
- Job status and timers
- Quick links: University, Army/Police, Regular job board, City Map, Land Market

**User Guidance:**
- Getting income beyond UBI
- Choosing early career path or starting to flirt with crime

---

## 💵 Making Money - Core Loops

### **1. UBI (Universal Basic Income)**

- Players receive daily UBI in BCGC scaling with BCGW staked/tier
- Implementation:
  - Store `last_ubi_claim_at` per account
  - On "Claim Daily UBI": compute amount owed based on tier & time since last claim
  - Mint BCGC off-chain into `bcgc_balances` table
  - Log in `bcgc_transactions`

### **2. Job Timer (Legit Careers)**

- Base interval: 5 minutes (configurable)
- Each completed job:
  - Pays BCGC
  - Grants career XP for chosen path

**Database:**
- `jobs` - Static definitions
- `character_jobs` - Relationship with rank/level per career
- `timers` or fields on `character_jobs`:
  - `next_job_available_at`

**Flow:**
- Player selects career-aligned job
- If `now >= next_job_available_at`:
  - Let them run the job
  - Update XP, BCGC
  - Set `next_job_available_at = now + interval`

### **3. Action Timer (Side Work + Crime)**

**Action Types:**
- **Freelance gigs**: City workforce tasks (trash pickup, mowing lawns, camera work)
- **Community service**: Improves standing, reduces criminal XP, boosts city funds
- **Aggravated crimes**: High-risk, fast money (pickpocket, mugging, GTA, B&E)
  - Creates witness statement with probability
  - Can be reported to police → may result in warrants

**Implementation:**
- Timer type: `action_timer_available_at`
- `actions` table with:
  - type: `FREELANCE`, `COMMUNITY_SERVICE`, `CRIME_AGGRAVATED`, etc.
  - min requirements, risk/reward
- For aggravated crimes:
  - On success: add BCGC, criminal XP
  - On failure: less BCGC, maybe health/damage, generate `witness_report` record

---

## 🎓 University & Career Paths

Players earn degrees that unlock full careers:

**Degrees:**
- Law → Law career path
- Medicine → Hospital career path
- Science → Mortician career path
- Engineering → Engineer career path
- Business → Bank career path

**Implementation:**
- `degrees` table (LAW, MEDICINE, SCIENCE, ENGINEERING, BUSINESS)
- `character_degrees`: progress percentage or credits
- Studying at University:
  - Consumes action timer
  - On completion: unlocks associated job ladder in `character_jobs`

---

## 💼 Jobs & Careers

### **Career Descriptions (v1 Framework)**

**Hospital**
- Surgery, curing patients, assisting police with forensics
- With criminal XP: option to steal drugs from pharmacy

**Mortician**
- Autopsies, funerals, managing funeral home
- With criminal XP: smuggle drugs inside caskets

**Engineer**
- Builds houses, apartments, businesses
- Services vehicles
- For underworld: builds gang fronts and secret rooms

**Bank**
- Approves/denies loans
- Bank Manager sets interest rates
- Underworld: laundering dirty money

**Fire Department**
- Responds to fires; helps police with arson
- Underworld: ignore certain fires to enable insurance fraud

**Customs**
- Patrols borders, airport, bus, train stations
- Catches illegal immigrants, smugglers, escaped criminals

**Armed Forces**
- Guard the mayor
- Defend city in wars along with police/customs
- Roles: rifleman, explosives expert, intelligence officer

**Police**
- "Legal gang" - solves reported crimes
- Departments: SWAT, DEA, Internal Affairs
- Can go undercover in gangs; risk of death if exposed
- Solves cases → sends them to judges

**Law**
- Law intern → legal secretary → lawyer → judge
- Lawyers defend players
- Judges sentence; risk retaliation if wrong

**Mayor**
- Manages city funds
- Decides pardons, conviction wipes
- Can declare state of emergency (army mobilization)
- Must be voted into office and hold top legal position

**Jail Staff**
- Corrections officer → jail warden
- Monitor prisoners, prevent (or enable) drugs and weapons
- Warden sets jail rules and can run for Mayor

**Criminal**
- High risk of death or prison
- Requires teamwork and organization
- If undercover cop maps crew's inner structure, RICO case can bust whole gang

**Criminal Subtypes:**
- **Street Gang** - Selling drugs on corners, tagging territory, turf wars
- **Biker Gang** - Motorcycle crews, strip clubs/tattoo shops as fronts
- **Businessmen (Mafioso)** - Suit-wearing elites in high-rises; deep in politics and all businesses

**v1 Implementation:**
- Build `careers` and `career_roles` schema
- Hooks: legit actions vs underworld alternatives (small subset to start)
- UI section "Careers" showing:
  - Current job
  - Career ladder
  - Available actions and next unlocks

---

## 🏢 Business & Land

### **Core City Infrastructure**

Every city always has these default locations:
- Military base
- Police station
- Fire station
- Court house
- Jail
- Airport
- Bus station
- Train station
- Customs center
- Funeral home
- Money market
- University
- Construction company
- Town hall

These exist as system-owned buildings (not player-owned land).

### **Player-Built Businesses**

On land players own, they can build:
- Bar
- Farm
- Boxing gym
- UFC gym
- Fitness center
- Brothel
- Casino
- Clothing shop
- Dog fighting ring
- Strip club
- Drug store
- Arena
- Tattoo parlor
- Vehicle repair shop
- Vehicle store
- Weapons shop
- Armor shop

**Database Schema:**
- `land_plots`:
  - id
  - city_id
  - owner_account_id
  - coordinates/index
  - size
- `businesses`:
  - id
  - land_plot_id (fk)
  - type (enum: BAR, FARM, etc.)
  - name
  - public_config JSON (open hours, prices)
  - secret_room_id (nullable)
- `business_rentals`:
  - Relationships between landlord and business operator

### **Secret Rooms & Underground Activities**

Players can pay engineers to add secret rooms to businesses.

**Activities:**
- Underground fight club
- Underground weapons auction
- Drug lab/drug farm
- Gang hideout
- Underground gambling

**Risk:**
- Each secret room at risk of police raids
- Shutdown unless protected politically (Mayor, police chief alliances)

**v1 Implementation:**
- Concept in DB and UI
- Create secret room and assign theme (FIGHT_CLUB, GAMBLING, etc.)
- Log and display participants
- Simple "raid" mechanic stub:
  - Random/triggered event flags room as "raided"
  - Temporarily disables it

---

## 🏘️ Buying Land & Residual Income

**Land Ownership:**
- Land directly tied to player's account
- Players can:
  - Build and run businesses on their land
  - Rent land to other players who build there

**Income:**
- Rent paid monthly (in-game time) in BCGC
- Players can resell land to others
- In-game currency can be traded for real money via "money market" (conceptual on/off-ramp)

**Implementation:**
- `land_plots` and `businesses` as above
- Simple Land Market:
  - List land plots for sale with price in BCGC
  - Allow logged-in players to buy if they have enough BCGC
- Rent System:
  - `business_rentals` with:
    - rent_amount_bcgc
    - rent_interval_days
    - last_paid_at
  - For v1: Compute rent due when landlord/tenant opens dashboard (no cron needed)

---

## ⚔️ Conflict System

**Philosophy:**
- Friendship and diplomacy encouraged
- Conflict dangerous but sometimes necessary
- All conflict resolution is server-side for security

**Conflict Types:**

1. **Pickpocket** (`crime_aggravated`)
   - Steal BCGC without major confrontation
   - Success based on: `(attacker.dexterity + criminal_xp)` vs `(defender.intellect + lawful_xp)`
   - Low damage, low witness probability
   - Steals 10-50 BCGC on success

2. **Mugging** (`crime_aggravated`)
   - Direct confrontation, steal BCGC
   - Success based on: `(attacker.strength + criminal_xp)` vs `(defender.strength + agility)`
   - Medium damage (10-30 HP), medium witness probability
   - Steals 50-200 BCGC on success

3. **B&E (Breaking & Entering)** (`crime_aggravated`)
   - Break into businesses/buildings
   - Success based on: `(attacker.agility + criminal_xp)` vs building security
   - Low damage, high witness probability
   - Steals items/BCGC from business

4. **GTA (Grand Theft Auto)** (`crime_aggravated`)
   - Steal vehicles
   - Success based on: `(attacker.agility + strength)` vs vehicle security
   - Medium damage, high witness probability
   - Steals vehicle (future: vehicle inventory)

5. **GBH (Great Bodily Harm)** (`conflict_gbh`)
   - Serious non-fatal damage
   - Success based on: `(attacker.strength + agility + weapons)` vs `(defender.strength + agility + armor)`
   - High damage (30-70 HP)
   - May require hospital visit
   - Can steal BCGC

6. **Kill** (`conflict_kill`)
   - Fatal attack
   - Success based on: `(attacker.strength + weapons)` vs `(defender.health + armor)`
   - Sets `is_alive = false`
   - Triggers inheritance system
   - High witness probability

**Conflict Resolution Flow:**

**CRITICAL:** All conflicts resolved server-side via `lib/game/conflict.ts`

1. **Client sends intent:**
   ```typescript
   // Client only sends: attacker_id, defender_id, conflict_type
   await performConflict(attackerId, defenderId, 'pickpocket');
   ```

2. **Server validates:**
   - Both characters exist and are alive
   - Both in same city
   - Attacker has required stats/equipment
   - Timers allow action

3. **Server calculates:**
   - Success chance based on stats
   - Damage amount
   - BCGC stolen (if applicable)
   - Witness report probability

4. **Server updates atomically:**
   - Character health
   - BCGC balances
   - Death flags
   - Conflict log

5. **Server emits Realtime event:**
   - Notify both players
   - Update UI instantly

**Health System:**
- Range: 0-100
- At 0: Character dies (`is_alive = false`)
- Healing: Hospital jobs, time-based recovery, drugs/items

**v1 Implementation:**
- Implement pickpocket, mugging, GBH, kill
- All resolved via `lib/game/conflict.ts`
- Inheritance to same-account character

---

## 💀 Will & Inheritance System

### **Will Creation**

Players can create/update wills:
- Designate beneficiary character (can be on different account)
- Choose what transfers:
  - BCGC (in-game currency)
  - Land plots
  - Businesses
- Default: If no will, transfer to another character on same account

### **Inheritance Resolution**

**Trigger Events:**
- New character created on account with dead characters
- Player logs in with account that has dead characters

**Process:**
1. Find all dead characters on account where `inheritance_transferred = false`
2. For each dead character:
   - Look up `wills` table for beneficiary
   - If no will, use default (another character on same account)
   - Transfer BCGC: Update `bcgc_balances` for both accounts
   - Transfer land: Update `land_plots.owner_account_id`
   - Transfer businesses: Update `businesses.owner_account_id`
   - Mark `conflict_logs.inheritance_transferred = true`

**Implementation:** `lib/game/wills.ts` - `applyInheritanceForAccount(accountId)`

---

## 👥 Social & Relationship System

### **Friendships**

- Players can add other characters as friends
- Friend list displayed on dashboard
- Future: Friend bonuses, crew-only features, friend notifications

### **Faction Membership**

- Characters join factions via `faction_members` table
- Roles: leader, officer, member, recruit
- Faction controls cities via `factions.controlled_cities`
- Faction chat (future feature)
- Faction-only secret rooms and businesses

### **Relationships**

Types: friend, rival, spouse, family, enemy
- Mutual relationships (`is_mutual = true`) when both characters have relationship
- Can affect gameplay (future: bonuses, penalties, special actions)
- Displayed on character profiles

---

## 🏰 City Wars System

### **War Mechanics**

- Wars declared between cities
- Duration: Time-bounded events (e.g., 24-48 hours)
- Conflicts during war generate `war_events`
- Outcome determines city control changes

### **War Resolution**

- Track conflicts during war period
- Calculate victory based on:
  - Number of successful attacks
  - BCGC stolen/destroyed
  - Key character deaths
  - Building raids
- Update `factions.controlled_cities` on victory
- Winning faction gains control of defeated city

### **War Events**

- All conflicts during active war are linked to `city_wars`
- Creates `war_events` records for visualization
- Real-time war feed shows activity
- Players can see war status and participate

**v1 Implementation:**
- Basic war declaration system
- Link conflicts to wars
- Simple victory calculation
- Update city control

---

## 💊 Drugs (Placeholder)

**Intended Function:**
- Modify timers (e.g., reduce job timer)
- Boost certain stats
- Introduce risk (addiction, legal consequences)

**v1 Implementation:**
- Scaffold:
  - `drugs` table with name, effect JSON
  - `character_drug_effects` for currently active effects
- Implement one simple effect:
  - "Energy Pill" reduces job timer from 5 minutes to 3 minutes for N uses per day

---

## 💸 Revenue Streams (Ecosystem, Not Code Logic)

**Blockchain Games Revenue Streams:**
- Land sales → primarily fund BCGW liquidity
- Company NFT sales → liquidity + treasury via royalties
- Subscriptions & services → liquidity
- Transaction fees → small cut to treasury
- Ads → split between liquidity and treasury

**v1 Implementation:**
- Ensure clear places where:
  - Land is sold for BCGW or BCGC
  - NFTs/in-game items could be sold
  - Subscriptions (premium features) could be plugged in later

---

## 🎯 Implementation Priorities for v1

### **1. Project Setup**
- Next.js + Tailwind + shadcn/ui
- Supabase client and basic auth
- Solana wallet adapter integration and wallet connect button

### **2. Data Model (Supabase)**
- `profiles`, `game_accounts`, `characters`, `cities`
- `bcgc_balances`, `bcgc_transactions`
- `jobs`, `character_jobs`, `timers` (job + action)
- `degrees`, `character_degrees`

### **3. BCGW Tier Logic**
- `lib/bcgwTiers.ts` with mocked balance → tier mapping
- UI on dashboard showing current tier and benefits

### **4. Character Creation Flow**
- Gated by wallet connection and simple BCGW check (stubbed)
- Name, gender, city

### **5. Dashboard**
- Show character info, BCGC balance, timers, quick actions

### **6. Money-Making Loops**
- UBI claim flow
- Job timer jobs
- Action timer freelance gig
- Simple aggravated crime action:
  - May or may not succeed
  - Adds BCGC and criminal XP
  - Has chance to create `witness_report` record

### **7. University & Degree Progression**
- Study actions consuming action timer
- Degree completion unlocking new jobs

### **8. Land & Simple Businesses**
- Schema + simple UI:
  - Show available plots
  - Let players buy plot and assign business type (e.g., Bar)

### **9. Basic Conflict (GBH)**
- Single GBH option to "rough up" another character
- Record conflict logs

**Everything else** (secret rooms, deeper crime networks, elections, complex raids, on-chain staking program, etc.) can be stubbed with well-named TODOs and placeholder UI sections.

---

## 📝 Coding Style & Expectations

- Use **TypeScript** strictly
- Encapsulate domain logic in `lib/` modules (e.g., `lib/economy`, `lib/conflict`, `lib/land`)
- Use **React Server Components** where appropriate, but keep wallet logic client-side
- Ensure all critical actions go through **server-side functions** (server actions or API routes) that enforce:
  - Auth
  - Basic sanity checks
  - Timer checks

- Design UI to be:
  - Mobile-friendly
  - Card-based
  - Clear about timers and consequences (especially around crimes and conflict)

**End Goal:**
- Clean, extensible codebase skeleton with:
  - Fully working auth, wallet connect, character creation
  - Basic UBI + job + simple crime loop
  - Early schema and UI for land, businesses, careers, and conflict

**Future Iterations:**
- Wire in real Solana devnet/mainnet token mints
- Add staking contracts
- Implement more complex underworld, elections, and real-time city dynamics

---

## 🔗 Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture details
- [QUICKSTART.md](./QUICKSTART.md) - Implementation guide
- [EXTRACTION_PLAN.md](./EXTRACTION_PLAN.md) - Template extraction steps

