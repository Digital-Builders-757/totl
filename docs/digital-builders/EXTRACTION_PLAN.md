# TOTL → Digital Builders Extraction Plan

**Date:** December 2025  
**Status:** Planning Phase  
**Project:** Digital Builders (Text-Based MMO)  
**Purpose:** Step-by-step guide to extract reusable architecture from TOTL for Digital Builders

---

## 🎯 Overview

This document provides a detailed plan for extracting the proven architecture patterns from TOTL Agency and adapting them for Digital Builders. The goal is to create a clean, game-specific codebase while leveraging all the hard-won lessons from TOTL. **v1 MVP is Web2-only** (no Solana/wallet requirements); crypto integration comes in v2+.

---

## 📋 Pre-Extraction Checklist

Before starting, ensure you have:
- ✅ TOTL project fully committed and pushed
- ✅ New Supabase project created for Digital Builders
- ✅ New GitHub repository created (or local folder ready)
- ✅ Environment variables documented

---

## 🗂️ Step 1: Create New Project Structure

### **1.1 Clone TOTL as Starting Point**

```bash
# Clone TOTL repo
git clone <totl-repo-url> digital-builders
cd digital-builders

# Create new git repo (remove TOTL history)
rm -rf .git
git init
git add .
git commit -m "Initial commit: Extracted from TOTL template"
```

### **1.2 Install Dependencies (Optional Solana for v2+)**

```bash
# Core dependencies (required)
npm install

# Optional: Install Solana dependencies for future v2+ integration
# Keep these behind feature flags - do NOT require in core flows
npm install @solana/web3.js @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets
```

**Note:** Solana code should live in `lib/solana/` but be behind feature flags. v1 MVP does NOT require wallet connection.

### **1.3 Update Project Metadata**

**Files to update:**
- `package.json` - Change name, description
- `README.md` - Update project description
- `.env.local.example` - Update with new Supabase project variables
  - **Optional:** Add Solana config (commented out for v1)

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

### **3.1 Set Up Authentication (Email/Password Only for v1)**

**Files to modify:**
- `components/auth/auth-provider.tsx`
  - Remove TOTL role logic (`talent`, `client`, `admin`)
  - Keep email/password auth (Supabase)
  - Add game account creation on first login
  - Keep auth state management

- `middleware.ts`
  - Remove TOTL role-based routing
  - Add game-based routing:
    - Has character → `/dashboard`
    - No character → `/character/create`
    - Not authenticated → `/login`

**New pattern:**
```typescript
// Instead of: role === 'talent' → /talent/dashboard
// Use: hasCharacter → /dashboard
//      !hasCharacter → /character/create
//      !authenticated → /login
```

**Optional for v2+:** Keep Solana wallet adapter code in `lib/solana/` but behind feature flags. Do NOT require wallet connection for v1 MVP.

### **3.2 Create Game Logic Modules**

**CRITICAL:** Create these modules to centralize game logic:

- `lib/game/conflict.ts` - **All PVP-lite/interaction resolution (server-side only)**
- `lib/game/jobs.ts` - Job timer logic
- `lib/game/actions.ts` - Action timer logic
- `lib/game/progression.ts` - XP and leveling logic
- `lib/game/daily-checkin.ts` - Daily reward logic (optional)

**Rule:** Never put game logic in React components. All calculations must be server-side.

### **3.3 Update Database Schema**

**Create new migrations:**
1. `supabase/migrations/20250101000000_initial_game_schema.sql`
   - Copy schema from `ARCHITECTURE.md` (adapted for Digital Builders)
   - Create all game tables:
     - `profiles` (from Supabase auth)
     - `game_accounts` (Digital Builders account)
     - `characters` (player characters)
     - `cities` / `districts` (locations)
     - `jobs`, `character_jobs` (job system)
     - `actions`, `character_actions` (action system)
     - `db_cred_balances`, `db_cred_transactions` (DB Cred ledger - off-chain for v1)
     - `interaction_logs` (PVP-lite interactions)
   - Set up RLS policies

2. `supabase/migrations/20250101000001_create_profiles_trigger.sql`
   - Adapt TOTL's profile creation trigger
   - Create game_account + character instead of talent/client profile

### **3.4 Update Type Generation**

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
mkdir -p app/actions
mkdir -p app/city
mkdir -p components/character
mkdir -p components/jobs
mkdir -p components/timers
mkdir -p lib/game
```

### **4.2 Create Core Game Files**

**Priority order:**

1. **Character Creation** (Week 1, Day 1-3)
   - `app/character/create/page.tsx`
   - `app/character/create/actions.ts`
   - `components/character/track-selection.tsx`
   - `components/character/district-selection.tsx`

2. **Game Dashboard** (Week 1, Day 4-7)
   - `app/dashboard/page.tsx` (repurpose existing)
   - `components/character/stats-display.tsx`
   - `components/character/db-cred-balance.tsx`
   - `components/character/builder-level.tsx`
   - `components/timers/job-timer.tsx`
   - `components/timers/action-timer.tsx`
   - `components/city/location-cards.tsx`
   - `components/city/online-players-list.tsx`

3. **Job System** (Week 2, Day 1-3)
   - `app/jobs/page.tsx` - Job selection UI
   - `app/jobs/[jobId]/page.tsx` - Job detail page
   - `app/jobs/actions.ts` - Job execution server actions
   - `lib/game/jobs.ts` - Job timer logic

4. **Action System** (Week 2, Day 4-5)
   - `app/actions/page.tsx` - Action selection UI
   - `app/actions/[actionId]/page.tsx` - Action detail page
   - `app/actions/actions.ts` - Action execution server actions
   - `lib/game/actions.ts` - Action timer logic

5. **PVP-lite & Presence** (Week 2, Day 6-7)
   - `lib/game/conflict.ts` - **CRITICAL: All interaction logic here**
   - `app/city/online-players/page.tsx` - Online players list
   - `components/conflict/risky-action-button.tsx` - PVP-lite UI
   - Functions: `performUnderbid()`, `performIdeaPoach()`, `performCollabChallenge()`

6. **Progression System** (Week 3)
   - `lib/game/progression.ts` - XP and leveling logic
   - `app/progression/page.tsx` - Progression UI
   - `app/careers/page.tsx` - Career paths UI

7. **Daily Check-In (Optional)** (Week 3)
   - `lib/game/daily-checkin.ts` - Daily reward logic
   - `app/dashboard/daily-checkin/page.tsx` - Daily check-in UI

---

## 🔧 Step 5: Configuration Updates

### **5.1 Environment Variables**

**Create `.env.local`:**
```bash
# Supabase (new project)
NEXT_PUBLIC_SUPABASE_URL=<digital-builders-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<digital-builders-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<digital-builders-service-key>

# Optional: Solana Configuration (for v2+)
# NEXT_PUBLIC_SOLANA_NETWORK=devnet  # or mainnet-beta
# NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
# NEXT_PUBLIC_BUILDER_POWER_MINT_ADDRESS=<future-governance-token>
# NEXT_PUBLIC_DB_CRED_MINT_ADDRESS=<future-currency-token>

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
- `README.md` - Digital Builders project overview
- `docs/digital-builders/PROJECT_SPEC.md` - Game design document
- `docs/digital-builders/MVP_ROADMAP.md` - MVP roadmap
- `docs/digital-builders/ARCHITECTURE.md` - Architecture documentation

**Remove TOTL docs:**
- Remove `docs/` folder contents (or move to archive)
- Keep only game-specific docs

---

## 📊 Step 6: Database Migration

### **6.1 Create New Supabase Project**

1. Go to Supabase Dashboard
2. Create new project: `digital-builders`
3. Note project URL and keys
4. Link local project: `supabase link --project-ref <project-ref>`

### **6.2 Run Initial Migrations**

```bash
# Create migration files
supabase migration new initial_game_schema
supabase migration new create_profiles_trigger
supabase migration new seed_initial_data

# Copy SQL from ARCHITECTURE.md (adapted for Digital Builders)
# Run migrations
supabase db push
```

### **6.3 Set Up RLS Policies**

Copy RLS patterns from TOTL, adapt for game tables:
- Characters can view their own data
- Players can view online players in their district
- Players can interact with jobs/actions in their district

---

## 🎨 Step 7: UI Updates

### **7.1 Update Landing Page**

**File:** `app/page.tsx`
- Remove TOTL-specific content
- Add Digital Builders introduction
- Character creation CTA

### **7.2 Update Navigation**

**File:** `components/navbar.tsx`
- Remove TOTL links
- Add game navigation:
  - Dashboard
  - Jobs
  - Actions
  - City
  - Progression

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

- [ ] User can sign up (email/password)
- [ ] User can create character (handle, track, district)
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
git commit -m "feat: Extract Digital Builders from TOTL template

- Removed TOTL-specific routes and components
- Added character creation system
- Created game database schema (profiles, game_accounts, characters, jobs, actions, db_cred ledger)
- Set up DB Cred ledger system (off-chain for v1)
- Set up job and action timer systems
- Updated authentication for game-based routing
- Configured new Supabase project
- v1 MVP is Web2-only (no Solana/wallet requirements)"

# Push to new repo
git remote add origin <digital-builders-repo-url>
git push -u origin main
```

---

## 📝 Step 10: Documentation

### **10.1 Create Project README**

**File:** `README.md`
```markdown
# Digital Builders

Text-based MMO for the creative tech community.

## Tech Stack
- Next.js 15 + App Router
- Supabase (PostgreSQL + Auth + Real-time)
- TypeScript (strict mode)
- TailwindCSS + shadcn/ui
- **Future v2+:** Solana integration (optional)

## Getting Started
[Setup instructions - see docs/digital-builders/QUICKSTART.md]
```

### **10.2 Set Up Cursor AI**

**Critical:** Set up Cursor AI for efficient development:

1. **Create `.cursorrules` file**
   - Copy template from `docs/digital-builders/CURSOR_SETUP_GUIDE.md`
   - Adapt for game-specific needs
   - Place in project root
   - **Important:** Note that v1 MVP is Web2-only

2. **Create project context file**
   - Create `DIGITAL_BUILDERS_PROJECT_CONTEXT.md`
   - Reference TOTL's `TOTL_PROJECT_CONTEXT_PROMPT.md` for structure
   - Adapt for game architecture

3. **Configure Cursor settings**
   - Enable project context
   - Enable codebase indexing
   - Follow `docs/digital-builders/CURSOR_SETUP_GUIDE.md`

### **10.3 Set Up CI/CD**

**Critical:** Set up automated checks:

1. **Create GitHub Actions workflows**
   - Copy from TOTL patterns
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

### **10.4 Archive TOTL Docs**

Move TOTL-specific docs to archive or remove:
- Keep only game-relevant documentation
- Reference TOTL patterns in comments where applicable

---

## 🎯 Post-Extraction Tasks

### **Immediate (Week 1):**
1. ✅ Character creation (handle, track, district)
2. ✅ Basic dashboard with timers
3. ✅ City location cards
4. ✅ Online players list

### **Short-term (Weeks 2-3):**
1. ✅ Job timer system (5-minute cooldown)
2. ✅ Action timer system (freelance + PVP-lite)
3. ✅ DB Cred ledger (off-chain)
4. ✅ PVP-lite interactions (underbid, idea poach)
5. ✅ Progression system (XP, builder levels)

### **Long-term (Weeks 4+):**
1. ✅ Career paths and unlocks
2. ✅ Virtual spaces (optional for v1)
3. ✅ Advanced social features
4. ✅ **Future v2+:** Solana integration
5. ✅ **Future v2+:** On-chain tokens

---

## 💡 Pro Tips

1. **Don't Delete TOTL Yet** - Keep it as reference for patterns
2. **Commit Often** - Small, focused commits
3. **Test Each Step** - Verify before moving to next step
4. **Use Git Branches** - Create `extraction` branch for this work
5. **Document Decisions** - Note why you kept/removed things
6. **Keep Solana Code Separate** - Put it in `lib/solana/` behind feature flags
7. **v1 MVP is Web2-Only** - Don't require wallet connection for core flows

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

## 🚨 Important Notes

**v1 MVP Requirements:**
- ✅ Email/password auth (Supabase)
- ✅ Off-chain DB Cred ledger
- ✅ No wallet connection required
- ✅ No Solana dependencies in core flows

**v2+ Future Integration:**
- ⏳ Solana wallet connection (optional)
- ⏳ On-chain tokens (DB Cred → SPL token, Builder Power → governance token)
- ⏳ NFT achievements

**Keep Solana code separate:**
- Put all Solana code in `lib/solana/`
- Use feature flags to enable/disable
- Do NOT require wallet connection for v1 MVP

---

**Ready to extract? Start with Step 1!** 🚀

