# Blockchain Gang Life - Architecture Plan

**Date:** January 2025  
**Status:** Planning Phase  
**Project:** Blockchain Gang Life (Blockchain Gang World)  
**Blockchain:** Solana (SPL tokens)

---

## 🎯 Executive Summary

**YES - You can absolutely use the same tech stack!**

Next.js + Supabase + Vercel is **perfect** for this project. The architecture we've built for TOTL provides an excellent foundation that can scale to handle:
- ✅ Solana wallet integration
- ✅ SPL token management (BCGW & BCGC)
- ✅ Real-time game events
- ✅ Complex character/job systems
- ✅ Dynamic world events
- ✅ Digital real estate and businesses
- ✅ Conflict and crime systems

**Key Advantage:** We already have proven patterns for auth, RLS, real-time subscriptions, and server-side logic that will translate perfectly to a Solana-based game.

---

## 🏗️ Architecture Overview

### **Tech Stack**

- **Frontend:** Next.js 15 + App Router + TypeScript (strict mode)
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Hosting:** Vercel
- **UI:** TailwindCSS + shadcn/ui components
- **Blockchain:** Solana (SPL tokens)
  - `@solana/web3.js` for RPC
  - `@solana/wallet-adapter-react` for wallet integration
  - `@solana/wallet-adapter-wallets` (Phantom, Solflare, Backpack)
- **State Management:** React Query (server data) + Zustand/Context (local state)

### **Why This Stack Works:**

1. **Supabase Real-time** - Perfect for:
   - Live game events (crimes, witness reports)
   - Online users in same city
   - Conflict updates
   - Job timer notifications

2. **PostgreSQL** - Excellent for:
   - Character stats and progression
   - Job hierarchies and promotions
   - Event system (crimes, witness reports)
   - BCGC ledger (hybrid on-chain/off-chain)
   - Digital real estate ownership
   - Business management

3. **Solana Integration** - For:
   - BCGW token holdings (tier system)
   - BCGC token (in-game currency)
   - Wallet-based authentication
   - Future: NFT items, staking contracts

4. **Server Actions** - For:
   - Game logic (combat calculations, event generation)
   - Timer enforcement
   - BCGC transactions
   - All critical actions server-side

---

## 💰 Token Architecture

### **BCGW - Utility/Governance Token (SPL)**

**Purpose:** Ecosystem utility token on Solana

**Uses:**
- Staking BCGW → earns BCGC over time
- Governance voting (more BCGW = more vote weight)
- Tier system (Iron → Diamond)
- Discounts on goods & services
- Virtual land purchases
- Access to staking pools and higher-tier rewards

**Implementation:**
- Read wallet holdings via Solana RPC
- Mint address: `NEXT_PUBLIC_BCGW_MINT_ADDRESS` (env variable)
- Tier calculation: `lib/bcgwTiers.ts`
- Cache tier on `profiles` table, recompute on wallet reconnect

### **BCGC - In-Game Currency (SPL + Hybrid)**

**Purpose:** Official in-game currency

**Uses:**
- Earned through gameplay (UBI, jobs, businesses, competitions)
- Spent on NFTs, land, goods, services
- Leaderboard status
- Governance (top 100 holders vote)

**Implementation:**
- SPL token: `NEXT_PUBLIC_BCGC_MINT_ADDRESS` (env variable)
- **v1:** Maintain balances primarily in Postgres (`bcgc_balances` table)
- All transactions logged in `bcgc_transactions` table
- Hooks for future on-chain sync

---

## 📊 Database Schema Design

### **Core Tables**

#### **1. `profiles`** - User Accounts
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Wallet Info
  wallet_address TEXT UNIQUE NOT NULL, -- Solana wallet address
  wallet_public_key TEXT NOT NULL,
  
  -- BCGW Tier (cached, recomputed on wallet connect)
  bcgw_tier TEXT DEFAULT 'none', -- 'iron', 'bronze', 'gold', 'platinum', 'diamond'
  bcgw_balance_cache DECIMAL(18, 8) DEFAULT 0,
  tier_last_updated_at TIMESTAMPTZ,
  
  -- Account Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### **2. `game_accounts`** - Per-Wallet Game Accounts
```sql
CREATE TABLE game_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- UBI Tracking
  last_ubi_claim_at TIMESTAMPTZ,
  total_ubi_claimed DECIMAL(18, 8) DEFAULT 0,
  
  -- Account Metadata
  account_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### **3. `characters`** - Player Characters
```sql
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES game_accounts(id) ON DELETE CASCADE NOT NULL,
  
  -- Character Identity
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'unidentified')),
  avatar_url TEXT,
  avatar_path TEXT,
  
  -- Stats
  strength INTEGER DEFAULT 0,
  intellect INTEGER DEFAULT 0,
  charisma INTEGER DEFAULT 0,
  agility INTEGER DEFAULT 0,
  luck INTEGER DEFAULT 0,
  
  -- Experience Tracks
  criminal_xp INTEGER DEFAULT 0,
  lawful_xp INTEGER DEFAULT 0,
  
  -- Status
  health INTEGER DEFAULT 100,
  max_health INTEGER DEFAULT 100,
  stamina INTEGER DEFAULT 100,
  max_stamina INTEGER DEFAULT 100,
  
  -- Location
  home_city_id UUID REFERENCES cities(id) NOT NULL,
  current_city_id UUID REFERENCES cities(id) NOT NULL,
  
  -- Career
  current_job_id UUID REFERENCES jobs(id),
  
  -- Life Status
  is_alive BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### **4. `cities`** - Game Cities
```sql
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  law_summary TEXT,
  
  -- Control
  controlling_gang_id UUID REFERENCES factions(id),
  controlling_political_faction_id UUID REFERENCES factions(id),
  
  -- City Funds
  city_funds_bcgc DECIMAL(18, 8) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **5. `bcgc_balances`** - BCGC Balance Ledger
```sql
CREATE TABLE bcgc_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES game_accounts(id) ON DELETE CASCADE NOT NULL,
  
  balance DECIMAL(18, 8) NOT NULL DEFAULT 0,
  
  -- Sync Tracking
  last_on_chain_sync_at TIMESTAMPTZ,
  on_chain_balance DECIMAL(18, 8),
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(account_id)
);
```

#### **6. `bcgc_transactions`** - BCGC Transaction Log
```sql
CREATE TABLE bcgc_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES game_accounts(id) NOT NULL,
  character_id UUID REFERENCES characters(id),
  
  transaction_type TEXT NOT NULL, -- 'ubi', 'job', 'crime', 'business', 'purchase', 'rent'
  amount DECIMAL(18, 8) NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  
  -- Related Entities
  job_id UUID REFERENCES jobs(id),
  action_id UUID REFERENCES actions(id),
  business_id UUID REFERENCES businesses(id),
  land_plot_id UUID REFERENCES land_plots(id),
  
  -- Metadata
  description TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **7. `jobs`** - Job Definitions
```sql
CREATE TYPE job_type AS ENUM (
  'hospital', 'mortician', 'engineer', 'bank', 'fire_department',
  'customs', 'armed_forces', 'police', 'law', 'mayor', 'jail_staff',
  'criminal_street_gang', 'criminal_biker_gang', 'criminal_mafioso'
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  job_type job_type NOT NULL,
  name TEXT NOT NULL, -- "Police Officer", "Defense Attorney", etc.
  
  -- Requirements
  min_level INTEGER DEFAULT 1,
  required_degree_id UUID REFERENCES degrees(id),
  required_stats JSONB, -- {strength: 50, intellect: 30}
  
  -- Career Path
  career_path_id UUID REFERENCES careers(id),
  rank INTEGER DEFAULT 1, -- 1 = entry level
  
  -- Rewards
  base_pay_bcgc DECIMAL(18, 8) DEFAULT 100,
  experience_per_job INTEGER DEFAULT 10,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **8. `character_jobs`** - Character Job Assignments
```sql
CREATE TABLE character_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) NOT NULL,
  
  -- Progression
  rank INTEGER DEFAULT 1,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  
  -- Timer
  next_job_available_at TIMESTAMPTZ DEFAULT now(),
  job_interval_minutes INTEGER DEFAULT 5,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(character_id, job_id)
);
```

#### **9. `actions`** - Action Definitions
```sql
CREATE TYPE action_type AS ENUM (
  'freelance', 'community_service', 'crime_aggravated',
  'study', 'conflict_gbh', 'conflict_kill'
);

CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  action_type action_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Requirements
  min_level INTEGER DEFAULT 1,
  required_stats JSONB,
  required_items JSONB, -- Array of item IDs
  
  -- Risk/Reward
  success_rate DECIMAL(5, 2) DEFAULT 100.00, -- Percentage
  reward_bcgc DECIMAL(18, 8) DEFAULT 0,
  reward_xp JSONB, -- {criminal_xp: 10, lawful_xp: 0}
  risk_damage INTEGER DEFAULT 0, -- Health damage on failure
  
  -- Timer
  action_interval_minutes INTEGER DEFAULT 5,
  
  -- Special Flags
  can_create_witness_report BOOLEAN DEFAULT false,
  witness_report_probability DECIMAL(5, 2) DEFAULT 0, -- Percentage
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **10. `character_actions`** - Character Action Timer
```sql
CREATE TABLE character_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  
  -- Timer
  action_timer_available_at TIMESTAMPTZ DEFAULT now(),
  
  -- Last Action
  last_action_id UUID REFERENCES actions(id),
  last_action_at TIMESTAMPTZ,
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(character_id)
);
```

#### **11. `witness_reports`** - Crime Reports
```sql
CREATE TABLE witness_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Crime Details
  action_id UUID REFERENCES actions(id) NOT NULL,
  perpetrator_id UUID REFERENCES characters(id) NOT NULL,
  witness_id UUID REFERENCES characters(id), -- NULL if system-generated
  
  -- Location
  city_id UUID REFERENCES cities(id) NOT NULL,
  location_description TEXT,
  
  -- Report Details
  report_text TEXT NOT NULL,
  reported_at TIMESTAMPTZ DEFAULT now(),
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'closed', 'dismissed')),
  assigned_police_id UUID REFERENCES characters(id),
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolution_details TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **12. `degrees`** - University Degrees
```sql
CREATE TYPE degree_type AS ENUM (
  'law', 'medicine', 'science', 'engineering', 'business'
);

CREATE TABLE degrees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  degree_type degree_type NOT NULL UNIQUE,
  name TEXT NOT NULL, -- "Law Degree", "Medical Degree", etc.
  description TEXT,
  
  -- Requirements
  credits_required INTEGER DEFAULT 100,
  study_action_id UUID REFERENCES actions(id), -- Action to study
  
  -- Unlocks
  unlocks_career_id UUID REFERENCES careers(id),
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **13. `character_degrees`** - Character Degree Progress
```sql
CREATE TABLE character_degrees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  degree_id UUID REFERENCES degrees(id) NOT NULL,
  
  -- Progress
  credits_earned INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(character_id, degree_id)
);
```

#### **14. `careers`** - Career Paths
```sql
CREATE TABLE careers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name TEXT NOT NULL UNIQUE, -- "Law Enforcement", "Criminal Underworld", etc.
  description TEXT,
  
  -- Career Type
  is_legitimate BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **15. `land_plots`** - Virtual Land
```sql
CREATE TABLE land_plots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID REFERENCES cities(id) NOT NULL,
  
  -- Ownership
  owner_account_id UUID REFERENCES game_accounts(id),
  
  -- Location
  plot_index INTEGER NOT NULL, -- Position in city grid
  size INTEGER DEFAULT 1, -- Plot size multiplier
  
  -- Sale Info
  is_for_sale BOOLEAN DEFAULT false,
  sale_price_bcgc DECIMAL(18, 8),
  sale_price_bcgw DECIMAL(18, 8),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(city_id, plot_index)
);
```

#### **16. `businesses`** - Player Businesses
```sql
CREATE TYPE business_type AS ENUM (
  'bar', 'farm', 'boxing_gym', 'ufc_gym', 'fitness_center',
  'brothel', 'casino', 'clothing_shop', 'dog_fighting_ring',
  'strip_club', 'drug_store', 'arena', 'tattoo_parlor',
  'vehicle_repair', 'vehicle_store', 'weapons_shop', 'armor_shop'
);

CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  land_plot_id UUID REFERENCES land_plots(id) NOT NULL,
  
  business_type business_type NOT NULL,
  name TEXT NOT NULL,
  
  -- Owner/Operator
  owner_account_id UUID REFERENCES game_accounts(id) NOT NULL,
  operator_character_id UUID REFERENCES characters(id), -- May differ from owner
  
  -- Configuration
  public_config JSONB, -- {open_hours: "9am-5pm", prices: {...}}
  
  -- Secret Room
  secret_room_id UUID REFERENCES secret_rooms(id),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_raided BOOLEAN DEFAULT false,
  raid_ends_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### **17. `secret_rooms`** - Underground Activities
```sql
CREATE TYPE secret_room_type AS ENUM (
  'fight_club', 'weapons_auction', 'drug_lab', 'drug_farm',
  'gang_hideout', 'gambling'
);

CREATE TABLE secret_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  
  secret_room_type secret_room_type NOT NULL,
  name TEXT,
  
  -- Protection
  is_protected BOOLEAN DEFAULT false, -- Protected by Mayor/police chief
  
  -- Status
  is_raided BOOLEAN DEFAULT false,
  raid_ends_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **18. `business_rentals`** - Land Rental Agreements
```sql
CREATE TABLE business_rentals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  land_plot_id UUID REFERENCES land_plots(id) NOT NULL,
  business_id UUID REFERENCES businesses(id) NOT NULL,
  
  -- Parties
  landlord_account_id UUID REFERENCES game_accounts(id) NOT NULL,
  tenant_account_id UUID REFERENCES game_accounts(id) NOT NULL,
  
  -- Terms
  rent_amount_bcgc DECIMAL(18, 8) NOT NULL,
  rent_interval_days INTEGER DEFAULT 30,
  last_paid_at TIMESTAMPTZ,
  next_payment_due_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### **19. `conflict_logs`** - Conflict Records
```sql
CREATE TYPE conflict_type AS ENUM ('pickpocket', 'mugging', 'gbh', 'kill', 'b_and_e', 'gta');
CREATE TYPE conflict_result AS ENUM ('success', 'fail', 'partial');

CREATE TABLE conflict_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Participants
  attacker_id UUID REFERENCES characters(id) NOT NULL,
  defender_id UUID REFERENCES characters(id) NOT NULL,
  
  -- Conflict Details
  conflict_type conflict_type NOT NULL,
  action_id UUID REFERENCES actions(id), -- Links to action definition
  result conflict_result NOT NULL,
  
  -- Outcomes
  damage_dealt INTEGER DEFAULT 0,
  bcgc_stolen DECIMAL(18, 8) DEFAULT 0,
  attacker_health_after INTEGER,
  defender_health_after INTEGER,
  
  -- Death Handling
  character_killed_id UUID REFERENCES characters(id),
  inheritance_transferred BOOLEAN DEFAULT false,
  
  -- Location
  city_id UUID REFERENCES cities(id) NOT NULL,
  
  -- War Context (optional)
  city_war_id UUID REFERENCES city_wars(id),
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Conflict Resolution Rules:**
- All conflicts resolved server-side via `lib/game/conflict.ts`
- Client sends intent only (attacker_id, defender_id, conflict_type)
- Server validates: same city, both alive, requirements met
- Server calculates outcome based on stats + equipment + drugs
- Server updates health, BCGC, death flags atomically
- Server emits Realtime event for instant UI updates

#### **20. `wills`** - Inheritance System
```sql
CREATE TABLE wills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  testator_character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  beneficiary_character_id UUID REFERENCES characters(id) NOT NULL,
  
  -- Scope of inheritance
  transfers_bcgc BOOLEAN DEFAULT true,
  transfers_land BOOLEAN DEFAULT true,
  transfers_businesses BOOLEAN DEFAULT true,
  
  -- Optional % splits (for future multi-beneficiary)
  bcgc_percentage DECIMAL(5, 2) DEFAULT 100.00,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE (testator_character_id)
);
```

**Inheritance Resolution:**
- On death: Set `is_alive = false`, leave `conflict_logs.inheritance_transferred = false`
- On new character creation OR next login: Run `applyInheritanceForAccount(account_id)`
- Transfer BCGC, land, businesses to beneficiary
- Mark `conflict_logs.inheritance_transferred = true`
- If no will exists, default to another character on same account

#### **21. `faction_members`** - Faction Membership
```sql
CREATE TABLE faction_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faction_id UUID REFERENCES factions(id) ON DELETE CASCADE NOT NULL,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  
  role TEXT DEFAULT 'member', -- 'leader', 'officer', 'member', 'recruit'
  rank INTEGER DEFAULT 1,
  
  joined_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE (faction_id, character_id)
);
```

#### **22. `character_relationships`** - Social Graph
```sql
CREATE TYPE relationship_type AS ENUM ('friend', 'rival', 'spouse', 'family', 'enemy');

CREATE TABLE character_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  to_character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  
  relationship_type relationship_type NOT NULL,
  is_mutual BOOLEAN DEFAULT false, -- Both characters have relationship
  
  -- Optional metadata
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE (from_character_id, to_character_id, relationship_type)
);
```

#### **23. `city_wars`** - City-Level Conflicts
```sql
CREATE TABLE city_wars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attacker_city_id UUID REFERENCES cities(id) NOT NULL,
  defender_city_id UUID REFERENCES cities(id) NOT NULL,
  
  -- Initiating factions (optional)
  attacker_faction_id UUID REFERENCES factions(id),
  defender_faction_id UUID REFERENCES factions(id),
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
  
  -- Outcome
  attacker_victory BOOLEAN,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **24. `war_events`** - War Activity Log
```sql
CREATE TABLE war_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_war_id UUID REFERENCES city_wars(id) NOT NULL,
  conflict_log_id UUID REFERENCES conflict_logs(id), -- Link to specific conflict
  
  -- Event details
  description TEXT NOT NULL,
  event_type TEXT DEFAULT 'conflict', -- 'conflict', 'raid', 'sabotage', etc.
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **20. `drugs`** - Drug Definitions
```sql
CREATE TABLE drugs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Effects
  effects JSONB NOT NULL, -- {job_timer_reduction_percent: 40, stamina_boost: 20}
  
  -- Risks
  addiction_risk DECIMAL(5, 2) DEFAULT 0,
  legal_consequences BOOLEAN DEFAULT false,
  
  -- Usage Limits
  max_uses_per_day INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **21. `character_drug_effects`** - Active Drug Effects
```sql
CREATE TABLE character_drug_effects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  drug_id UUID REFERENCES drugs(id) NOT NULL,
  
  -- Effect Tracking
  effects_applied JSONB NOT NULL,
  uses_today INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(character_id, drug_id)
);
```

#### **25. `factions`** - Organizations (Gangs, Political Factions)
```sql
CREATE TYPE faction_type AS ENUM (
  'street_gang', 'biker_gang', 'mafioso', 'political_party', 'police_department'
);

CREATE TABLE factions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name TEXT NOT NULL UNIQUE,
  faction_type faction_type NOT NULL,
  description TEXT,
  
  -- Leadership
  leader_character_id UUID REFERENCES characters(id),
  
  -- Territory
  controlled_cities UUID[] DEFAULT '{}',
  
  -- Faction Stats
  member_count INTEGER DEFAULT 0,
  total_bcgc DECIMAL(18, 8) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Note:** Leader is determined by `faction_members.role = 'leader'`. Update `factions.leader_character_id` when leadership changes.

---

## 🔄 Real-time Features

### **Supabase Realtime Subscriptions**

#### **1. Live Events in City**
```typescript
// Subscribe to witness reports in player's current city
const subscription = supabase
  .channel('city-events')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'witness_reports',
    filter: `city_id=eq.${currentCityId}`
  }, (payload) => {
    // Show notification: "A crime has been reported!"
    showEventNotification(payload.new);
  })
  .subscribe();
```

#### **2. PVP Conflict Notifications**
```typescript
// Subscribe to conflicts involving my character
const subscription = supabase
  .channel('my-conflicts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'conflict_logs',
    filter: `or(attacker_id.eq.${characterId},defender_id.eq.${characterId})`
  }, (payload) => {
    // Show notification: "You've been attacked!" or "Attack successful!"
    showConflictNotification(payload.new);
  })
  .subscribe();
```

#### **3. Job Timer Notifications**
```typescript
// Notify when job timer is ready
const subscription = supabase
  .channel('job-timers')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'character_jobs',
    filter: `character_id=eq.${characterId}`
  }, (payload) => {
    if (isJobReady(payload.new)) {
      showJobReadyNotification(payload.new);
    }
  })
  .subscribe();
```

#### **4. City Chat (Future)**
```typescript
// Subscribe to city chat messages
const subscription = supabase
  .channel('city-chat')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'city_messages',
    filter: `city_id=eq.${currentCityId}`
  }, (payload) => {
    addMessageToChat(payload.new);
  })
  .subscribe();
```

#### **5. War Events (Future)**
```typescript
// Subscribe to war events in my city
const subscription = supabase
  .channel('war-events')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'war_events',
    filter: `city_war_id.in(${activeWarsInMyCity.join(',')})`
  }, (payload) => {
    showWarEvent(payload.new);
  })
  .subscribe();
```

**Real-time Optimization Rules:**
- Only subscribe to events in player's current city
- Only subscribe to conflicts involving player's character
- Unsubscribe when player changes cities or logs out
- Use polling (30-second intervals) for less critical data

---

## ⚔️ PVP & Conflict System

### **Conflict Resolution Architecture**

**CRITICAL RULE:** All PVP and conflict logic must go through `lib/game/conflict.ts` and must only trust server-side data from Supabase, never client-provided values.

#### **Conflict Types**

1. **Pickpocket** (`crime_aggravated`)
   - Low damage, BCGC steal focus
   - Success based on: `attacker.dexterity + criminal_xp` vs `defender.intellect + lawful_xp`
   - Low witness report probability

2. **Mugging** (`crime_aggravated`)
   - Medium damage, BCGC steal
   - Success based on: `attacker.strength + criminal_xp` vs `defender.strength + agility`
   - Medium witness report probability

3. **GBH (Great Bodily Harm)** (`conflict_gbh`)
   - High damage, no death
   - Success based on: `attacker.strength + agility` vs `defender.strength + agility`
   - May require hospital visit

4. **Kill** (`conflict_kill`)
   - Fatal damage, sets `is_alive = false`
   - Success based on: `attacker.strength + weapons` vs `defender.health + armor`
   - Triggers inheritance system

#### **Conflict Resolution Flow**

```typescript
// lib/game/conflict.ts

export async function performConflict(
  attackerId: string,
  defenderId: string,
  conflictType: ConflictType
): Promise<ConflictResult> {
  // 1. Load attacker + defender from DB (server-side only)
  const attacker = await getCharacter(attackerId);
  const defender = await getCharacter(defenderId);
  
  // 2. Validate
  if (!attacker || !defender) throw new Error('Character not found');
  if (!attacker.is_alive || !defender.is_alive) throw new Error('Character dead');
  if (attacker.current_city_id !== defender.current_city_id) throw new Error('Not in same city');
  
  // 3. Check requirements (weapons, location, etc.)
  const action = await getAction(conflictType);
  if (!meetsRequirements(attacker, action)) throw new Error('Requirements not met');
  
  // 4. Calculate success chance
  const successChance = calculateSuccessChance(attacker, defender, conflictType);
  const result = Math.random() < successChance ? 'success' : 'fail';
  
  // 5. Calculate outcomes
  const damage = calculateDamage(attacker, defender, conflictType, result);
  const bcgcStolen = result === 'success' ? calculateBCGCStolen(defender, conflictType) : 0;
  
  // 6. Update characters atomically
  await updateCharacterHealth(defenderId, defender.health - damage);
  if (defender.health - damage <= 0) {
    await setCharacterDead(defenderId);
    await markInheritancePending(defenderId);
  }
  
  if (bcgcStolen > 0) {
    await transferBCGC(defender.account_id, attacker.account_id, bcgcStolen);
  }
  
  // 7. Log conflict
  const conflictLog = await createConflictLog({
    attacker_id: attackerId,
    defender_id: defenderId,
    conflict_type: conflictType,
    result,
    damage_dealt: damage,
    bcgc_stolen: bcgcStolen,
    defender_health_after: defender.health - damage,
    character_killed_id: defender.health - damage <= 0 ? defenderId : null,
    inheritance_transferred: false
  });
  
  // 8. Emit Realtime event
  await emitConflictEvent(conflictLog);
  
  return conflictLog;
}
```

#### **Health System Rules**

- Health range: 0-100
- At 0 health: Set `is_alive = false`
- Healing methods:
  - Hospital jobs (restore health)
  - Time-based recovery (1 health per hour)
  - Drugs/items (temporary boosts)
  - Community service (reduces criminal XP, improves standing)

---

## 💀 Inheritance & Wills System

### **Will Creation**

Players can create/update wills:
- Designate beneficiary character
- Choose what transfers (BCGC, land, businesses)
- Default: If no will, transfer to another character on same account

### **Inheritance Resolution**

**Trigger:** On new character creation OR next login after death

**Process:**
1. Find all dead characters on account where `inheritance_transferred = false`
2. For each dead character:
   - Look up `wills` table for beneficiary
   - Transfer BCGC: Update `bcgc_balances` for both accounts
   - Transfer land: Update `land_plots.owner_account_id`
   - Transfer businesses: Update `businesses.owner_account_id`
   - Mark `conflict_logs.inheritance_transferred = true`

**Implementation:** `lib/game/wills.ts`

```typescript
export async function applyInheritanceForAccount(accountId: string): Promise<void> {
  // Find dead characters with pending inheritance
  const deadChars = await getDeadCharactersWithPendingInheritance(accountId);
  
  for (const deadChar of deadChars) {
    const will = await getWill(deadChar.id);
    const beneficiary = will 
      ? await getCharacter(will.beneficiary_character_id)
      : await getDefaultBeneficiary(accountId);
    
    if (!beneficiary) continue;
    
    // Transfer assets
    if (will?.transfers_bcgc ?? true) {
      await transferBCGCToBeneficiary(deadChar.account_id, beneficiary.account_id);
    }
    
    if (will?.transfers_land ?? true) {
      await transferLandToBeneficiary(deadChar.id, beneficiary.account_id);
    }
    
    if (will?.transfers_businesses ?? true) {
      await transferBusinessesToBeneficiary(deadChar.id, beneficiary.account_id);
    }
    
    // Mark inheritance as transferred
    await markInheritanceTransferred(deadChar.id);
  }
}
```

---

## 👥 Social & Relationship System

### **Friendships**

- Players can add other characters as friends
- Friend list displayed on dashboard
- Future: Friend bonuses, crew-only features

### **Faction Membership**

- Characters join factions via `faction_members` table
- Roles: leader, officer, member, recruit
- Faction controls cities via `factions.controlled_cities`
- Faction chat (future feature)

### **Relationships**

Types: friend, rival, spouse, family, enemy
- Mutual relationships (`is_mutual = true`) when both characters have relationship
- Can affect gameplay (future: bonuses, penalties)

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
- Update `factions.controlled_cities` on victory

---

## ⛓️ Solana Integration

### **Wallet Connection**

```typescript
// lib/solana/wallet.ts
import { useWallet } from '@solana/wallet-adapter-react';

export function useSolanaWallet() {
  const { publicKey, connected, connect, disconnect } = useWallet();
  
  return {
    publicKey,
    connected,
    connect,
    disconnect,
    address: publicKey?.toBase58()
  };
}
```

### **BCGW Balance & Tier Check**

```typescript
// lib/bcgwTiers.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount } from '@solana/spl-token';

export async function getBCGWBalance(
  connection: Connection,
  walletAddress: string
): Promise<number> {
  const mintAddress = process.env.NEXT_PUBLIC_BCGW_MINT_ADDRESS!;
  const publicKey = new PublicKey(walletAddress);
  
  try {
    const account = await getAccount(connection, publicKey);
    return Number(account.amount) / 1e8; // Assuming 8 decimals
  } catch {
    return 0;
  }
}

export function getTierFromBalance(balance: number): string {
  if (balance >= 1_000_000) return 'diamond';
  if (balance >= 500_000) return 'platinum';
  if (balance >= 50_000) return 'gold';
  if (balance >= 1_000) return 'bronze';
  if (balance >= 100) return 'iron';
  return 'none';
}
```

### **BCGC Token Operations**

```typescript
// lib/bcgc/token.ts
// For v1, primarily use off-chain ledger
// Future: sync with on-chain SPL token

export async function transferBCGC(
  fromAccountId: string,
  toAccountId: string,
  amount: number
): Promise<void> {
  // Server action - update Postgres ledger
  // Future: Also transfer on-chain SPL token
}
```

---

## 💰 Cost Considerations

### **Supabase Free Tier Limits:**
- ✅ Database: 500MB (plenty for initial launch)
- ✅ Storage: 1GB (for images/NFTs)
- ✅ Bandwidth: 2GB/month
- ✅ Realtime: 200 concurrent connections
- ✅ Edge Functions: 500K invocations/month

### **Solana Costs:**
- Devnet: Free
- Mainnet: ~0.000005 SOL per transaction (~$0.0001)
- RPC: Free tier available (Helius, QuickNode)

### **Cost Optimization:**
- Cache BCGW balances (update on wallet reconnect)
- Batch BCGC transactions
- Use Postgres for BCGC ledger (sync to chain periodically)
- Minimize real-time subscriptions

---

## 🚀 Phased Rollout Plan

### **Phase 1: MVP (Weeks 1-4)**
**Goal:** Core gameplay loop working

- ✅ Wallet connection
- ✅ BCGW tier system
- ✅ Character creation
- ✅ UBI claim system
- ✅ Job timer (basic jobs)
- ✅ Action timer (freelance + simple crime)
- ✅ Basic dashboard
- ✅ One city

**Database Tables:**
- `profiles`, `game_accounts`, `characters`, `cities`
- `bcgc_balances`, `bcgc_transactions`
- `jobs`, `character_jobs`, `character_actions`
- `actions`, `witness_reports`

---

### **Phase 2: Careers & Education (Weeks 5-8)**
**Goal:** Career progression system

- ✅ University system
- ✅ Degree progression
- ✅ Career paths
- ✅ Multiple job types
- ✅ Job promotions

**New Tables:**
- `degrees`, `character_degrees`
- `careers`

---

### **Phase 3: Land & Business (Weeks 9-12)**
**Goal:** Economic systems

- ✅ Land market
- ✅ Business creation
- ✅ Rent system
- ✅ Business operations

**New Tables:**
- `land_plots`, `businesses`
- `business_rentals`

---

### **Phase 4: Conflict & Advanced Features (Weeks 13-16)**
**Goal:** Full game systems

- ✅ Conflict system (GBH)
- ✅ Secret rooms
- ✅ Factions
- ✅ Multiple cities
- ✅ Advanced crime networks

**New Tables:**
- `conflict_logs`
- `secret_rooms`
- `factions`
- `drugs`, `character_drug_effects`

---

## 📋 Template Extraction Strategy

### **What to Extract from TOTL:**

1. **Core Architecture**
   - ✅ Next.js 15 App Router setup
   - ✅ Supabase client patterns
   - ✅ TypeScript configuration
   - ✅ RLS policy patterns
   - ✅ Server Actions patterns

2. **Auth System**
   - ✅ User authentication patterns
   - ✅ Profile creation triggers
   - ✅ Adapt for wallet-based auth

3. **UI Components**
   - ✅ shadcn/ui setup
   - ✅ Form components
   - ✅ Modal dialogs
   - ✅ Toast notifications
   - ✅ Loading states

4. **Utilities**
   - ✅ Error handling
   - ✅ Image upload utilities
   - ✅ Type safety patterns

### **What to Add:**

- ✅ Solana wallet adapter setup
- ✅ BCGW tier calculation logic
- ✅ BCGC ledger system
- ✅ Game-specific tables (characters, jobs, actions, etc.)
- ✅ Timer systems (job + action)
- ✅ Conflict calculation logic
- ✅ Real-time subscription patterns

---

## ✅ Conclusion

**You can absolutely build this on the same stack!**

The TOTL architecture provides:
- ✅ Proven auth system (adapt for wallet-based)
- ✅ Scalable database patterns
- ✅ Real-time capabilities
- ✅ Type-safe codebase
- ✅ Production-ready infrastructure

**The game will scale beautifully** because:
- Supabase handles real-time events perfectly
- PostgreSQL is excellent for game state
- Solana provides fast, cheap transactions
- Server Actions handle game logic securely

**Start with Phase 1 MVP** - get the core loop working, then add complexity!

---

**Ready to start building?** Let's begin with wallet connection and character creation! 🚀
