# TOTL → Blockchain Gang Life Extraction Plan

**Date:** January 2025  
**Status:** Planning Phase  
**Project:** Blockchain Gang Life (Blockchain Gang World)  
**Purpose:** Step-by-step guide to extract reusable architecture from TOTL for Blockchain Gang Life

---

## 🎯 Overview

This document provides a detailed plan for extracting the proven architecture patterns from TOTL Agency and adapting them for BlockchainGames.com. The goal is to create a clean, game-specific codebase while leveraging all the hard-won lessons from TOTL.

---

## 📋 Pre-Extraction Checklist

Before starting, ensure you have:
- ✅ TOTL project fully committed and pushed
- ✅ New Supabase project created for BlockchainGames
- ✅ New GitHub repository created (or local folder ready)
- ✅ Environment variables documented

---

## 🗂️ Step 1: Create New Project Structure

### **1.1 Clone TOTL as Starting Point**

```bash
# Clone TOTL repo
git clone <totl-repo-url> blockchain-gang-life
cd blockchain-gang-life

# Create new git repo (remove TOTL history)
rm -rf .git
git init
git add .
git commit -m "Initial commit: Extracted from TOTL template"
```

### **1.2 Install Solana Dependencies**

```bash
npm install @solana/web3.js @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets
```

### **1.3 Update Project Metadata**

**Files to update:**
- `package.json` - Change name, description
- `README.md` - Update project description
- `.env.local.example` - Update with new Supabase project variables and Solana config

---

## 🗑️ Step 2: Remove TOTL-Specific Code

### **2.1 Remove TOTL App Routes**

```bash
# Remove TOTL-specific routes
rm -rf app/talent
rm -rf app/client
rm -rf app/admin/gigs
rm -rf app/post-gig
rm -rf app/gigs
rm -rf app/choose-role
rm -rf app/onboarding
```

**Keep:**
- ✅ `app/auth/` - Login, signup, password reset
- ✅ `app/dashboard/` - Will be repurposed for game dashboard
- ✅ `app/settings/` - User settings (reusable)
- ✅ `app/layout.tsx` - Root layout
- ✅ `app/page.tsx` - Landing page (will update)

### **2.2 Remove TOTL Components**

```bash
# Remove TOTL-specific components
rm -rf components/talent
rm -rf components/client
rm -rf components/admin
rm -rf components/portfolio
rm -rf components/application-details-modal.tsx
rm -rf components/apply-as-talent-button.tsx
rm -rf components/post-gig-footer-link.tsx
rm -rf components/subscription-prompt.tsx
```

**Keep:**
- ✅ `components/ui/` - All shadcn/ui components
- ✅ `components/auth/` - Auth components (reusable)
- ✅ `components/navbar.tsx` - Will adapt for game
- ✅ `components/theme-provider.tsx` - Theme system

### **2.3 Remove TOTL-Specific Database Code**

**Files to remove:**
- ❌ `lib/actions/` - TOTL-specific server actions
- ❌ `lib/gig-access.ts` - TOTL-specific
- ❌ `lib/subscription.ts` - Stripe subscriptions (unless you want premium accounts)
- ❌ `lib/stripe.ts` - Stripe integration (unless needed)

**Keep:**
- ✅ `lib/supabase-client.ts` - Core Supabase client
- ✅ `lib/supabase-admin-client.ts` - Admin client
- ✅ `lib/utils.ts` - Utility functions
- ✅ `lib/error-logger.ts` - Error handling
- ✅ `lib/image-utils.ts` - Image utilities

### **2.4 Remove TOTL Database Migrations**

```bash
# Remove all TOTL migrations
rm -rf supabase/migrations/*

# Keep structure, remove content
# We'll create new migrations for game schema
```

**Keep:**
- ✅ `supabase/config.toml` - Supabase config (update project ref)
- ✅ `supabase/functions/` - Structure (remove TOTL functions)

---

## 🔄 Step 3: Adapt Core Systems

### **3.1 Set Up Solana Wallet Integration**

**Files to create:**
- `app/providers.tsx` - Solana wallet provider wrapper
- `components/wallet/wallet-button.tsx` - Wallet connect button
- `lib/solana/wallet.ts` - Wallet utilities
- `lib/bcgwTiers.ts` - BCGW tier calculation

**Files to modify:**
- `components/auth/auth-provider.tsx`
  - Remove TOTL role logic (`talent`, `client`, `admin`)
  - Add wallet-based authentication
  - Link wallet address to Supabase profile
  - Keep auth state management

- `middleware.ts`
  - Remove TOTL role-based routing
  - Add wallet-based routing
  - Protect game routes (require wallet connection)

**New pattern:**
```typescript
// Instead of: role === 'talent' → /talent/dashboard
// Use: hasWallet && hasCharacter → /dashboard
//      hasWallet && !hasCharacter → /character/create
//      !hasWallet → /connect-wallet
```

### **3.2 Create Game Logic Modules**

**CRITICAL:** Create these modules to centralize game logic:

- `lib/game/conflict.ts` - **All PVP/conflict resolution (server-side only)**
- `lib/game/wills.ts` - Inheritance resolution
- `lib/game/factions.ts` - Faction management
- `lib/game/wars.ts` - City war logic
- `lib/game/ubi.ts` - UBI calculations
- `lib/game/jobs.ts` - Job timer logic
- `lib/game/actions.ts` - Action timer logic
- `lib/game/education.ts` - University/degree logic
- `lib/game/land.ts` - Land/business logic

**Rule:** Never put game logic in React components. All calculations must be server-side.

### **3.2 Update Database Schema**

**Create new migrations:**
1. `supabase/migrations/20250101000000_initial_game_schema.sql`
   - Copy schema from `ARCHITECTURE.md`
   - Create all game tables
   - Set up RLS policies

2. `supabase/migrations/20250101000001_create_profiles_trigger.sql`
   - Adapt TOTL's profile creation trigger
   - Create character instead of talent/client profile

### **3.3 Update Type Generation**

**Update scripts:**
- `package.json` - Update `types:regen` script with new project ID
- Generate types: `npm run types:regen`
- Update imports: Use `@/types/supabase` (same pattern as TOTL)

---

## ✨ Step 4: Add Game-Specific Code

### **4.1 Create Game Directory Structure**

```bash
# Create game-specific directories
mkdir -p app/character
mkdir -p app/jobs
mkdir -p app/events
mkdir -p app/combat
mkdir -p components/character
mkdir -p components/jobs
mkdir -p components/combat
mkdir -p lib/game
```

### **4.2 Create Core Game Files**

**Priority order:**

1. **Solana Wallet Integration** (Week 1, Day 1-2)
   - `app/providers.tsx` - Wallet provider
   - `components/wallet/wallet-button.tsx`
   - `lib/solana/wallet.ts`
   - `lib/bcgwTiers.ts` - Tier calculation

2. **Character Creation** (Week 1, Day 3-7)
   - `app/character/create/page.tsx`
   - `app/character/create/actions.ts`
   - `components/character/city-selection.tsx`
   - `components/character/gender-selection.tsx`

3. **Game Dashboard** (Week 1, Day 8-10)
   - `app/dashboard/page.tsx` (repurpose existing)
   - `components/character/stats-display.tsx`
   - `components/character/bcgc-balance.tsx`
   - `components/character/bcgw-tier.tsx`
   - `components/timers/job-timer.tsx`
   - `components/timers/action-timer.tsx`

4. **Money-Making Loops** (Week 2)
   - `app/dashboard/ubi/` - UBI claim system
   - `app/jobs/` - Job timer system
   - `app/actions/` - Action timer system
   - `lib/game/ubi.ts`
   - `lib/game/jobs.ts`
   - `lib/game/actions.ts`

5. **PVP & Conflict System** (Week 2-3)
   - `lib/game/conflict.ts` - **CRITICAL: All conflict logic here**
   - `app/conflict/[characterId]/actions.ts` - Conflict server actions
   - `components/conflict/attack-button.tsx` - Attack UI
   - `components/conflict/health-bar.tsx` - Health display
   - Functions: `performPickpocket()`, `performMugging()`, `performGBH()`, `performKill()`

6. **Will & Inheritance** (Week 3)
   - `lib/game/wills.ts` - Inheritance resolution
   - `app/wills/page.tsx` - Will creation UI
   - `app/wills/actions.ts` - Will server actions
   - Function: `applyInheritanceForAccount()`

7. **Social & Factions** (Week 3-4)
   - `lib/game/factions.ts` - Faction logic
   - `app/friends/page.tsx` - Friend list UI
   - `app/factions/page.tsx` - Faction UI
   - `components/social/friend-button.tsx` - Add friend button

8. **University & Careers** (Week 3)
   - `app/university/` - Study system
   - `app/careers/` - Career paths
   - `lib/game/education.ts`

9. **Land & Business** (Week 4)
   - `app/land/` - Land market
   - `lib/game/land.ts`

10. **City Wars** (Week 4)
    - `lib/game/wars.ts` - War logic
    - `app/wars/page.tsx` - War list UI
    - `app/wars/[warId]/page.tsx` - War detail page

---

## 🔧 Step 5: Configuration Updates

### **5.1 Environment Variables**

**Create `.env.local`:**
```bash
# Supabase (new project)
NEXT_PUBLIC_SUPABASE_URL=<blockchain-gang-life-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<blockchain-gang-life-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<blockchain-gang-life-service-key>

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet  # or mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_BCGW_MINT_ADDRESS=<bcgw-mint-address>
NEXT_PUBLIC_BCGC_MINT_ADDRESS=<bcgc-mint-address>

# Remove TOTL-specific vars:
# - STRIPE keys (unless you want payments)
# - RESEND keys (unless you want emails)
```

### **5.2 Update Config Files**

**Files to update:**
- `next.config.mjs` - Update project name
- `tailwind.config.ts` - Keep as-is (reusable)
- `tsconfig.json` - Keep as-is (reusable)
- `components.json` - Keep as-is (shadcn/ui config)

### **5.3 Update Documentation**

**Create new docs:**
- `README.md` - BlockchainGames project overview
- `docs/GAME_DESIGN.md` - Game design document
- `docs/API_REFERENCE.md` - API documentation

**Remove TOTL docs:**
- Remove `docs/` folder contents (or move to archive)
- Keep only game-specific docs

---

## 📊 Step 6: Database Migration

### **6.1 Create New Supabase Project**

1. Go to Supabase Dashboard
2. Create new project: `blockchaingames`
3. Note project URL and keys
4. Link local project: `supabase link --project-ref <project-ref>`

### **6.2 Run Initial Migrations**

```bash
# Create migration files
supabase migration new initial_game_schema
supabase migration new create_profiles_trigger
supabase migration new seed_initial_data

# Copy SQL from ARCHITECTURE.md
# Run migrations
supabase db push
```

### **6.3 Set Up RLS Policies**

Copy RLS patterns from TOTL, adapt for game tables:
- Characters can view their own data
- Public can view active events
- Players can interact with events in their city

---

## 🎨 Step 7: UI Updates

### **7.1 Update Landing Page**

**File:** `app/page.tsx`
- Remove TOTL-specific content
- Add game introduction
- Character creation CTA

### **7.2 Update Navigation**

**File:** `components/navbar.tsx`
- Remove TOTL links
- Add game navigation:
  - Dashboard
  - Jobs
  - Events
  - Inventory
  - Character

### **7.3 Update Theme**

**Keep:**
- ✅ Dark/light mode toggle
- ✅ shadcn/ui components
- ✅ TailwindCSS setup

**Update:**
- Color scheme (if needed for game theme)
- Logo/branding

---

## ✅ Step 8: Verification Checklist

### **8.1 Code Verification**

- [ ] All TOTL-specific routes removed
- [ ] All TOTL-specific components removed
- [ ] Database migrations created and tested
- [ ] Type generation working
- [ ] Environment variables set
- [ ] Build passes: `npm run build`
- [ ] Linting passes: `npm run lint`

### **8.2 Functionality Verification**

- [ ] User can sign up
- [ ] User can create character
- [ ] Character data saves to database
- [ ] Dashboard displays character stats
- [ ] Navigation works
- [ ] Auth flow works

### **8.3 Database Verification**

- [ ] All tables created
- [ ] RLS policies active
- [ ] Triggers working
- [ ] Indexes created
- [ ] Foreign keys working

---

## 🚀 Step 9: Initial Commit

```bash
# Stage all changes
git add .

# Commit extraction
git commit -m "feat: Extract Blockchain Gang Life from TOTL template

- Removed TOTL-specific routes and components
- Added Solana wallet integration
- Created game database schema (22+ tables)
- Set up BCGW tier system
- Set up BCGC ledger system
- Set up character creation system
- Updated authentication for wallet-based auth
- Configured new Supabase project"

# Push to new repo
git remote add origin <blockchain-gang-life-repo-url>
git push -u origin main
```

---

## 📝 Step 10: Documentation

### **10.1 Create Project README**

**File:** `README.md`
```markdown
# Blockchain Gang Life

Web-based RPG/metaverse management game set in Blockchain Gang World.

## Tech Stack
- Next.js 15 + App Router
- Supabase (PostgreSQL + Auth + Real-time)
- Solana (SPL tokens: BCGW & BCGC)
- TypeScript (strict mode)
- TailwindCSS + shadcn/ui

## Getting Started
[Setup instructions - see docs/blockchaingames/QUICKSTART.md]
```

### **10.2 Set Up Cursor AI**

**Critical:** Set up Cursor AI for efficient development:

1. **Create `.cursorrules` file**
   - Copy template from `docs/blockchaingames/CURSOR_SETUP_GUIDE.md`
   - Adapt for game-specific needs
   - Place in project root

2. **Create project context file**
   - Create `BLOCKCHAINGAMES_PROJECT_CONTEXT.md`
   - Reference TOTL's `TOTL_PROJECT_CONTEXT_PROMPT.md` for structure
   - Adapt for game architecture

3. **Configure Cursor settings**
   - Enable project context
   - Enable codebase indexing
   - Follow `docs/blockchaingames/CURSOR_SETUP_GUIDE.md`

### **10.3 Set Up CI/CD**

**Critical:** Set up automated checks:

1. **Create GitHub Actions workflows**
   - Copy from `docs/blockchaingames/CI_CD_SETUP.md`
   - Adapt project IDs and secrets
   - Test workflows

2. **Configure GitHub Secrets**
   - Set up Supabase credentials
   - Set up access tokens
   - Configure environment-specific secrets

3. **Set up pre-commit hooks**
   - Install Husky
   - Create pre-commit and pre-push hooks
   - Test locally

**See:** `docs/blockchaingames/CI_CD_SETUP.md` for complete guide

### **10.4 Archive TOTL Docs**

Move TOTL-specific docs to archive or remove:
- Keep only game-relevant documentation
- Reference TOTL patterns in comments where applicable

---

## 🎯 Post-Extraction Tasks

### **Immediate (Week 1):**
1. ✅ Solana wallet connection
2. ✅ BCGW tier system
3. ✅ Character creation form
4. ✅ Basic dashboard with timers
5. ✅ UBI claim system

### **Short-term (Weeks 2-3):**
1. ✅ Job timer system
2. ✅ Action timer system (freelance + crime)
3. ✅ University system
4. ✅ Career paths
5. ✅ Witness report system

### **Long-term (Weeks 4+):**
1. ✅ Land market
2. ✅ Business system
3. ✅ Conflict system (GBH)
4. ✅ Secret rooms
5. ✅ Factions
6. ✅ Multiple cities
7. ✅ Advanced crime networks

---

## 💡 Pro Tips

1. **Don't Delete TOTL Yet** - Keep it as reference for patterns
2. **Commit Often** - Small, focused commits
3. **Test Each Step** - Verify before moving to next step
4. **Use Git Branches** - Create `extraction` branch for this work
5. **Document Decisions** - Note why you kept/removed things

---

## 🔗 Reference Files

**Keep these TOTL files as reference:**
- `lib/supabase-client.ts` - Supabase client pattern
- `components/auth/auth-provider.tsx` - Auth pattern
- `middleware.ts` - Route protection pattern
- `lib/utils.ts` - Utility functions

**Study these patterns:**
- RLS policy creation
- Server Actions pattern
- Type safety patterns
- Error handling patterns

---

## ✅ Extraction Complete Checklist

- [ ] New project created
- [ ] TOTL code removed
- [ ] Game code added
- [ ] Database migrated
- [ ] Types generated
- [ ] Build passes
- [ ] Tests pass (if any)
- [ ] Documentation updated
- [ ] Initial commit pushed

---

**Ready to extract? Start with Step 1!** 🚀

