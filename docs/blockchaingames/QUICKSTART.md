# Blockchain Gang Life - Quick Start Guide

**Status:** Planning Phase  
**Project:** Blockchain Gang Life (Blockchain Gang World)  
**Goal:** Get MVP running in 4 weeks  
**Blockchain:** Solana (SPL tokens)

---

## 📋 Implementation Phases

### **Phase 0: Foundation & Extraction**
- Extract from TOTL template
- Set up Solana wallet integration
- Create database schema
- Basic auth system

### **Phase 1: Core Economy & Timers**
- Character creation
- UBI system
- Job timer system
- Action timer system
- Basic dashboard

### **Phase 2: PVP, Health, Death, Wills**
- Conflict system (pickpocket, mugging, GBH, kill)
- Health system
- Death handling
- Will & inheritance system
- PVP UI

### **Phase 3: Social & Factions**
- Friend system
- Faction membership
- Relationship system
- Faction UI

### **Phase 4: City Wars & Advanced**
- City war system
- War events
- Advanced conflict mechanics
- War UI

---

## 🎯 Week 1: Foundation (Phase 0 + Phase 1 Start)

### **Day 1-2: Project Setup**

1. **Create new Supabase project**
   ```bash
   # In Supabase dashboard, create new project
   # Name: blockchain-gang-life
   # Region: Choose closest to users
   ```

2. **Clone TOTL as template**
   ```bash
   git clone <totl-repo-url> blockchain-gang-life
   cd blockchain-gang-life
   
   # Remove TOTL-specific files
   rm -rf app/talent app/client app/admin/gigs
   rm -rf components/talent components/client
   ```

3. **Install Solana dependencies**
   ```bash
   npm install @solana/web3.js @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets
   ```

4. **Update environment variables**
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=<new-project-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<new-project-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<new-project-service-key>
   
   # Solana Configuration
   NEXT_PUBLIC_SOLANA_NETWORK=devnet  # or mainnet-beta
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
   NEXT_PUBLIC_BCGW_MINT_ADDRESS=<bcgw-mint-address>
   NEXT_PUBLIC_BCGC_MINT_ADDRESS=<bcgc-mint-address>
   ```

5. **Create initial database schema**
   ```bash
   # Create migration file
   supabase migration new initial_game_schema
   
   # Copy schema from ARCHITECTURE.md
   # Run migration
   supabase db push
   ```

### **Day 3-4: Wallet Connection & BCGW Tier**

**Files to create:**
- `app/providers.tsx` - Solana wallet provider wrapper
- `components/wallet/wallet-button.tsx` - Wallet connect button
- `lib/solana/wallet.ts` - Wallet utilities
- `lib/bcgwTiers.ts` - BCGW tier calculation

**Features:**
- Solana wallet adapter setup
- Connect Phantom/Solflare/Backpack wallets
- Fetch BCGW balance from Solana
- Calculate tier (Iron → Diamond)
- Display tier on dashboard

**Database:**
- Update `profiles` table with wallet address
- Cache BCGW balance and tier

### **Day 5-7: Character Creation**

**Files to create:**
- `app/character/create/page.tsx` - Character creation form
- `app/character/create/actions.ts` - Server actions
- `components/character/city-selection.tsx` - City selection UI
- `components/character/gender-selection.tsx` - Gender selection UI

**Features:**
- Wallet-gated character creation
- Name input
- Gender selection (Male/Female/Unidentified)
- Starting city selection (3-5 predefined cities)
- Character preview

**Database:**
- Insert into `characters` table
- Link to `game_accounts` via `account_id`
- Create initial `bcgc_balances` record

### **Day 8-10: Basic Dashboard**

**Files to create:**
- `app/dashboard/page.tsx` - Main game dashboard
- `components/character/stats-display.tsx` - Show character stats
- `components/character/bcgc-balance.tsx` - Show BCGC balance
- `components/character/bcgw-tier.tsx` - Show BCGW tier badge
- `components/timers/job-timer.tsx` - Job timer display
- `components/timers/action-timer.tsx` - Action timer display

**Features:**
- Display character info (name, gender, city, tier)
- Show BCGC balance
- Show BCGW tier and benefits
- Display job timer status
- Display action timer status
- Quick action buttons (UBI, Jobs, Actions)

---

## 🎯 Week 2: Money-Making Loops

### **Day 11-13: UBI System**

**Files to create:**
- `app/dashboard/ubi/page.tsx` - UBI claim interface
- `app/dashboard/ubi/actions.ts` - UBI claim server action
- `lib/game/ubi.ts` - UBI calculation logic

**Features:**
- Calculate UBI based on BCGW tier
- Daily claim system
- Update `last_ubi_claim_at`
- Credit BCGC to account
- Log transaction in `bcgc_transactions`

### **Day 14-17: Job Timer System**

**Files to create:**
- `app/jobs/page.tsx` - Job selection interface
- `app/jobs/[jobId]/page.tsx` - Job detail page
- `app/jobs/[jobId]/actions.ts` - Job execution server action
- `lib/game/jobs.ts` - Job timer logic

**Actions to implement:**
- **Basic Jobs** - Entry-level jobs (5-minute timer)
- Job execution with timer check
- BCGC payment
- Career XP gain
- Update `next_job_available_at`

**Database:**
- Create `jobs` table entries (basic jobs)
- Create `character_jobs` records
- Update `bcgc_transactions`

### **Day 18-21: Action Timer System**

**Files to create:**
- `app/actions/page.tsx` - Action selection interface
- `app/actions/[actionId]/page.tsx` - Action detail page
- `app/actions/[actionId]/actions.ts` - Action execution server action
- `lib/game/actions.ts` - Action timer logic

**Actions to implement:**
- **Freelance** - City workforce tasks
- **Community Service** - Improve standing
- **Aggravated Crime** - High-risk, fast money
  - Success/failure probability
  - BCGC reward
  - Criminal XP gain
  - Witness report generation

**Database:**
- Create `actions` table entries
- Create `character_actions` records
- Create `witness_reports` on crime success

---

## 🎯 Week 3: University & Careers

### **Day 22-24: University System**

**Files to create:**
- `app/university/page.tsx` - University interface
- `app/university/study/actions.ts` - Study action server action
- `lib/game/education.ts` - Degree progression logic

**Features:**
- Display available degrees
- Study action (consumes action timer)
- Track degree progress (credits)
- Degree completion unlocks careers

**Database:**
- Create `degrees` table entries
- Create `character_degrees` records
- Update progress on study actions

### **Day 25-28: Career System**

**Files to create:**
- `app/careers/page.tsx` - Career overview
- `app/careers/[careerId]/page.tsx` - Career detail page
- `components/careers/career-ladder.tsx` - Show career progression

**Features:**
- Display career paths
- Show job requirements
- Career progression tracking
- Job promotion system

**Database:**
- Create `careers` table entries
- Link `jobs` to `careers`
- Track `character_jobs` progression

---

## 🎯 Week 4: Land & Basic Conflict

### **Day 29-31: Land Market**

**Files to create:**
- `app/land/page.tsx` - Land market interface
- `app/land/[plotId]/page.tsx` - Land plot detail
- `app/land/[plotId]/actions.ts` - Land purchase server action
- `lib/game/land.ts` - Land purchase logic

**Features:**
- Display available land plots
- Show plot prices (BCGC or BCGW)
- Purchase land with BCGC
- Assign business type to land

**Database:**
- Create `land_plots` table entries
- Create `businesses` records
- Update `bcgc_transactions`

### **Day 32-35: Basic Conflict (GBH)**

**Files to create:**
- `app/conflict/page.tsx` - Conflict interface
- `app/conflict/[characterId]/actions.ts` - GBH action server action
- `lib/game/conflict.ts` - Conflict calculation logic

**Features:**
- Select target character
- Execute GBH action
- Calculate damage
- Apply health debuffs
- Record conflict logs

**Database:**
- Create `conflict_logs` records
- Update character health

### **Day 36-38: Basic PVP (Phase 2 Start)**

**Files to create:**
- `lib/game/conflict.ts` - Conflict resolution module
- `app/conflict/[characterId]/actions.ts` - Conflict server actions
- `components/conflict/attack-button.tsx` - Attack UI
- `components/conflict/health-bar.tsx` - Health display

**Features:**
- Implement `performPickpocket()` function
- Implement `performGBH()` function
- Implement `performKill()` function
- Health system (0-100 range)
- Death handling (`is_alive = false`)

**Database:**
- Ensure `conflict_logs` table exists
- Test conflict resolution flow

### **Day 39-42: Will & Inheritance (Phase 2)**

**Files to create:**
- `lib/game/wills.ts` - Inheritance resolution
- `app/wills/page.tsx` - Will creation UI
- `app/wills/actions.ts` - Will server actions

**Features:**
- Create/update will
- Designate beneficiary
- Inheritance resolution on death
- Transfer BCGC, land, businesses

**Database:**
- Create `wills` table migration
- Test inheritance flow

### **Day 43-45: Social System (Phase 3)**

**Files to create:**
- `app/friends/page.tsx` - Friend list UI
- `app/factions/page.tsx` - Faction UI
- `components/social/friend-button.tsx` - Add friend button
- `lib/game/factions.ts` - Faction logic

**Features:**
- Add/remove friends
- Join/leave factions
- Display relationships
- Faction roster

**Database:**
- Create `faction_members` table migration
- Create `character_relationships` table migration

### **Day 46-49: City Wars (Phase 4)**

**Files to create:**
- `app/wars/page.tsx` - War list UI
- `app/wars/[warId]/page.tsx` - War detail page
- `lib/game/wars.ts` - War logic

**Features:**
- Declare war between cities
- Link conflicts to wars
- War event feed
- War resolution

**Database:**
- Create `city_wars` table migration
- Create `war_events` table migration

### **Day 50-52: Testing & Polish**

- Test all features
- Fix bugs
- Add loading states
- Improve mobile responsiveness
- Performance optimization

### **Day 53-56: Launch Prep**

- Deploy to Vercel
- Configure Solana devnet/mainnet
- Test wallet connections
- Verify database migrations
- Deploy to production

---

## 📋 Essential Files Structure

```
blockchain-gang-life/
├── app/
│   ├── providers.tsx (Solana wallet provider)
│   ├── character/
│   │   ├── create/
│   │   │   ├── page.tsx
│   │   │   └── actions.ts
│   │   └── [id]/
│   │       └── page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── ubi/
│   │       ├── page.tsx
│   │       └── actions.ts
│   ├── jobs/
│   │   ├── page.tsx
│   │   └── [jobId]/
│   │       ├── page.tsx
│   │       └── actions.ts
│   ├── actions/
│   │   ├── page.tsx
│   │   └── [actionId]/
│   │       ├── page.tsx
│   │       └── actions.ts
│   ├── university/
│   │   ├── page.tsx
│   │   └── study/
│   │       └── actions.ts
│   ├── careers/
│   │   ├── page.tsx
│   │   └── [careerId]/
│   │       └── page.tsx
│   ├── land/
│   │   ├── page.tsx
│   │   └── [plotId]/
│   │       ├── page.tsx
│   │       └── actions.ts
│   └── conflict/
│       ├── page.tsx
│       └── [characterId]/
│           └── actions.ts
├── components/
│   ├── wallet/
│   │   └── wallet-button.tsx
│   ├── character/
│   │   ├── stats-display.tsx
│   │   ├── bcgc-balance.tsx
│   │   └── bcgw-tier.tsx
│   ├── timers/
│   │   ├── job-timer.tsx
│   │   └── action-timer.tsx
│   └── careers/
│       └── career-ladder.tsx
├── lib/
│   ├── solana/
│   │   └── wallet.ts
│   ├── bcgwTiers.ts
│   ├── game/
│   │   ├── ubi.ts
│   │   ├── jobs.ts
│   │   ├── actions.ts
│   │   ├── education.ts
│   │   ├── land.ts
│   │   └── conflict.ts
│   └── supabase-client.ts (from TOTL)
└── supabase/
    └── migrations/
        └── 20250101000000_initial_game_schema.sql
```

---

## 🚀 Getting Started Right Now

1. **Create Supabase project** (5 minutes)
2. **Clone TOTL** (2 minutes)
3. **Install Solana dependencies** (2 minutes)
4. **Set up environment variables** (3 minutes)
5. **Create first migration** (15 minutes)
6. **Set up Solana wallet adapter** (30 minutes)
7. **Build BCGW tier system** (1 hour)
8. **Build character creation form** (2 hours)

**Total time to MVP foundation: ~4-5 hours**

---

## 💡 Pro Tips

1. **Start with Wallet Connection** - Get Solana wallet adapter working first
2. **Mock BCGW Balance Initially** - Use mock data for tier system, swap to real RPC later
3. **Focus on Core Loop** - UBI → Jobs → Actions → Character progression
4. **Test Timers Locally** - Use shorter intervals (30 seconds) for testing
5. **Use Server Actions** - All game logic must be server-side for security
6. **Cache BCGW Tier** - Store tier in DB, recompute on wallet reconnect
7. **BCGC in Postgres First** - Use off-chain ledger for v1, sync to chain later

---

## 🔑 Key Implementation Notes

- **Solana Integration:** Start with devnet, use mock RPC for development
- **BCGW Tier:** Calculate from wallet balance, cache in `profiles` table
- **BCGC Ledger:** Maintain in Postgres, all transactions logged
- **Timers:** Enforce server-side, use `next_job_available_at` and `action_timer_available_at`
- **Witness Reports:** Generate probabilistically on aggravated crimes
- **Conflict:** Start with GBH only, death system comes later

---

**Ready to build? Start with wallet connection and BCGW tier system!** 🎮

