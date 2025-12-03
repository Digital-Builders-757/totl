# Cursor AI Setup Guide - Blockchain Gang Life

**Purpose:** Complete guide to setting up Cursor AI for efficient development with proper context and rules  
**Project:** Blockchain Gang Life (Blockchain Gang World)  
**Blockchain:** Solana (SPL tokens)

---

## 🎯 Overview

This guide explains how to configure Cursor AI to work effectively with the BlockchainGames.com project. It covers:
- Cursor rules configuration
- Context prompt setup
- CI/CD integration
- Best practices for AI-assisted development

---

## 📋 Prerequisites

Before setting up Cursor:
- ✅ Cursor IDE installed
- ✅ Project cloned locally
- ✅ Node.js and npm installed
- ✅ Git configured

---

## 🔧 Step 1: Create `.cursorrules` File

Create a `.cursorrules` file in the project root. This file tells Cursor how to behave when working on your codebase.

### **File Location:** `.cursorrules` (project root)

### **Template for BlockchainGames:**

```markdown
# Blockchain Gang Life - Cursor AI Assistant Rules

## 🎯 MANDATORY CONTEXT REFERENCE

**BEFORE WRITING ANY CODE, YOU MUST:**

1. **READ** `docs/blockchaingames/PROJECT_SPEC.md` for complete game design
2. **READ** `docs/blockchaingames/ARCHITECTURE.md` for technical architecture
3. **CHECK** `supabase/migrations/` for current database schema
4. **VERIFY** RLS policies match architecture
5. **USE** generated types from `types/database.ts` (NO `any` types)
6. **FOLLOW** established project structure and naming conventions

## 📋 PROJECT OVERVIEW

**Blockchain Gang Life** - Web-based RPG/metaverse management game set in Blockchain Gang World

**Tech Stack:**
- Next.js 15 + App Router + TypeScript 5 (strict mode)
- Supabase (PostgreSQL + Auth + Storage + Real-time)
- Solana (SPL tokens: BCGW & BCGC)
- TailwindCSS + shadcn/ui components
- `@solana/wallet-adapter` for wallet integration

**Database:** PostgreSQL with RLS policies on all tables
**Auth:** Supabase Auth + Solana wallet-based authentication
**Key Tables:** profiles, game_accounts, characters, cities, jobs, character_jobs, bcgc_balances, bcgc_transactions, actions, witness_reports, land_plots, businesses, conflict_logs
**Tokens:** BCGW (utility/governance), BCGC (in-game currency)

## ✅ COMPLIANCE CHECKLIST

Before generating any code, ensure:
- [ ] Referenced `docs/blockchaingames/ARCHITECTURE.md` for complete context
- [ ] **🚨 CRITICAL: database_schema_audit.md is the SINGLE SOURCE OF TRUTH**
- [ ] Used proper TypeScript types (no `any`)
- [ ] Followed RLS-compatible query patterns
- [ ] Separated database logic from React components
- [ ] Used centralized Supabase clients (`lib/supabase-client.ts`)
- [ ] Implemented proper error handling
- [ ] Followed project naming conventions

## 🏗️ ARCHITECTURE RULES

### Database Access
- Use `lib/supabase-client.ts` for client-side queries
- Use `lib/supabase-admin-client.ts` for server-side admin operations
- Always assume RLS is active - never bypass security policies
- Use generated types from `types/database.ts`

### Component Structure
- React components should be presentational only
- No direct database calls in components
- Use server components for data fetching
- Pass data as props to client components

### Solana Integration
- Wallet connection via `@solana/wallet-adapter-react`
- BCGW balance fetched from Solana RPC
- BCGW tier calculated from balance (cached in DB)
- BCGC primarily in Postgres ledger (sync to chain later)
- All token operations must be server-side

### Game Logic
- All game calculations in `lib/game/` directory
- UBI calculations in `lib/game/ubi.ts`
- Job timer logic in `lib/game/jobs.ts`
- Action timer logic in `lib/game/actions.ts`
- Conflict calculations in `lib/game/conflict.ts`
- Land/business logic in `lib/game/land.ts`

### Timer Systems
- Job timer: `next_job_available_at` (5-minute base interval)
- Action timer: `action_timer_available_at` (5-minute base interval)
- All timer checks must be server-side
- Use shorter intervals for testing (30 seconds)

### Real-time Features
- Use Supabase Realtime subscriptions for live events
- Subscribe only to events in player's current city
- Unsubscribe when player changes cities
- Use polling for less critical data

## 🚫 FORBIDDEN PATTERNS

- Using `any` types in TypeScript
- **🚨 Making database changes without updating `database_schema_audit.md`**
- **🚨 Updating `types/database.ts` without referencing the audit file**
- Direct database calls in React components
- Bypassing RLS policies
- Exposing service keys to client
- Mixing database logic with UI logic
- Using raw SQL instead of Supabase query builder
- Creating game logic in components (must be in `lib/game/`)

## 📁 CRITICAL FILES TO REFERENCE

- `docs/blockchaingames/PROJECT_SPEC.md` - Complete game design specification
- `docs/blockchaingames/ARCHITECTURE.md` - Technical architecture
- **🚨 `database_schema_audit.md` - SINGLE SOURCE OF TRUTH for database schema**
- `docs/blockchaingames/QUICKSTART.md` - Implementation guide
- `types/database.ts` - Generated Supabase types
- `supabase/migrations/` - Database schema history
- `lib/supabase-client.ts` - Client configuration
- `lib/solana/wallet.ts` - Solana wallet utilities
- `lib/bcgwTiers.ts` - BCGW tier calculation
- `middleware.ts` - Route protection logic

## 🔄 WHEN TO APPLY

This rule applies to:
- All code generation for this project
- Database schema changes or migrations
- New feature development
- Bug fixes or refactoring
- API route creation or modification
- Component creation or updates
- Game logic implementation

## Database Types & Codegen
- `types/database.ts` is auto-generated from Supabase. Do not hand-edit.
- After any SQL/migration changes, run:
  `npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" --schema public > types/database.ts`
- Prepend an AUTO-GENERATED banner to discourage edits.

## Supabase Client
- Use a single typed client from `lib/supabase-client.ts`.
- Do not import `@supabase/supabase-js` directly in pages/components.

## Query Style
- Default: explicit column selection. Avoid `select('*')` in app code.
- Exception: internal admin scripts in `scripts/` may use `*`.

## Security
- No service role in client/browser code. Server-only (API routes, server actions).

## Component Boundaries
- Presentational components: no data fetching.
- Server components/actions do all data I/O and pass typed props.

## Game-Specific Rules

### **PVP & Conflict Rules**
- **CRITICAL:** All PVP and conflict logic must go through `lib/game/conflict.ts`
- **CRITICAL:** Never trust client-provided values for conflict resolution
- **CRITICAL:** All conflict calculations must be server-side only
- Client sends intent only (attacker_id, defender_id, conflict_type)
- Server validates: same city, both alive, requirements met
- Server calculates: success chance, damage, BCGC stolen
- Server updates: health, BCGC, death flags atomically
- Server emits: Realtime event for instant UI updates

### **Timer Rules**
- All timer checks must be server-side (job + action timers)
- Client can display timer status, but cannot execute actions without server validation
- Timer enforcement: `next_job_available_at` and `action_timer_available_at` checked server-side

### **Inheritance Rules**
- Inheritance resolution via `lib/game/wills.ts` - `applyInheritanceForAccount()`
- Triggered on: new character creation OR next login after death
- Transfer BCGC, land, businesses atomically
- Mark `conflict_logs.inheritance_transferred = true` after transfer

### **General Rules**
- Character stats must be validated on server side
- BCGW tier must be recalculated on wallet reconnect
- BCGC transactions must be logged in `bcgc_transactions` table
- All game actions (UBI, jobs, crimes) must go through server actions
- Witness reports generated probabilistically on aggravated crimes
- Real-time subscriptions must be cleaned up on unmount
- Never put game logic in React components - use `lib/game/` modules

## 📚 MANDATORY DOCUMENTATION CHECK WORKFLOW

**BEFORE starting ANY work:**
1. Check `docs/blockchaingames/README.md` to identify relevant documentation
2. Read ALL relevant docs for the area you're working on
3. Verify your approach aligns with documented patterns
4. Only then proceed with implementation

**AFTER completing work:**
1. Update any relevant documentation
2. Add new documentation if you created a significant feature
3. Update `docs/blockchaingames/README.md` if you added new docs

## 🚨 CRITICAL ERROR PREVENTION

**BEFORE PUSHING ANY CODE, YOU MUST:**

### **1. SCHEMA & TYPES VERIFICATION**
```bash
npm run schema:verify:comprehensive
npm run types:check
npm run build
```

### **2. IMPORT PATH VERIFICATION**
**❌ NEVER USE THESE INCORRECT PATHS:**
- `@/lib/supabase/supabase-admin-client` (WRONG - extra `/supabase/`)
- `@/types/database` (WRONG - should be `/types/supabase`)

**✅ ALWAYS USE THESE CORRECT PATHS:**
- `@/lib/supabase-admin-client` (CORRECT)
- `@/types/supabase` (CORRECT)

### **3. PRE-PUSH CHECKLIST**
1. ✅ `npm run schema:verify:comprehensive`
2. ✅ `npm run build`
3. ✅ `npm run lint`
4. ✅ Check import paths are correct
5. ✅ Verify types are generated

**🚨 CRITICAL RULE: NEVER PUSH CODE THAT DOESN'T BUILD LOCALLY!**

---

**Remember: Always reference the full context file before writing any code. This ensures consistency, security, and proper architecture compliance.**
```

---

## 📝 Step 2: Create Project Context Prompt

Create a comprehensive context prompt file that Cursor can reference.

### **File Location:** `BLOCKCHAINGAMES_PROJECT_CONTEXT.md` (project root)

This file should mirror the structure of TOTL's `TOTL_PROJECT_CONTEXT_PROMPT.md` but adapted for BlockchainGames.

**Key sections to include:**
1. Mandatory Pre-Work Checklist
2. Architecture & Data Access Rules
3. Database & Schema Guardrails
4. Authentication & Authorization
5. Type Safety & Common Pitfalls
6. Testing & Verification
7. Documentation Expectations
8. Quick Reference Links

**Reference:** See `TOTL_PROJECT_CONTEXT_PROMPT.md` for structure, adapt for game-specific needs.

---

## 🤖 Step 3: Configure Cursor Settings

### **3.1 Enable Context Awareness**

In Cursor settings:
1. Go to **Settings** → **Features** → **AI**
2. Enable **"Use project context"**
3. Enable **"Read project files for context"**
4. Set **"Max context files"** to 20-30

### **3.2 Configure Rules File**

1. Go to **Settings** → **Features** → **Rules**
2. Ensure **".cursorrules"** is selected
3. Enable **"Auto-apply rules"**

### **3.3 Set Up Codebase Indexing**

1. Go to **Settings** → **Features** → **Indexing**
2. Enable **"Index codebase"**
3. Set indexing to include:
   - `app/`
   - `components/`
   - `lib/`
   - `types/`
   - `supabase/migrations/`
   - `docs/blockchaingames/`

---

## 🔄 Step 4: Set Up CI/CD Integration

### **4.1 GitHub Actions Workflows**

Create `.github/workflows/` directory with these workflows:

#### **ci.yml** - Main CI Pipeline
```yaml
name: CI
on: 
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with: 
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run type checking
        run: npm run typecheck
        
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

#### **schema-truth-check.yml** - Schema Verification
```yaml
name: "Schema Truth Verification"

on:
  pull_request:
    paths:
      - "supabase/migrations/**"
      - "types/database.ts"
      - "database_schema_audit.md"

jobs:
  verify-schema:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Login to Supabase
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: npx -y supabase@2.34.3 login --token "$SUPABASE_ACCESS_TOKEN"

      - name: Generate types from remote schema
        run: npx -y supabase@2.34.3 gen types typescript --project-id ${{ secrets.SUPABASE_PROJECT_ID }} --schema public > types/temp_schema_types.ts

      - name: Compare types
        run: |
          # Compare generated types with committed types
          # Fail if they don't match
```

### **4.2 Required GitHub Secrets**

Set up these secrets in GitHub repository settings:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_ACCESS_TOKEN` - Supabase CLI access token
- `SUPABASE_PROJECT_ID` - Supabase project ID

---

## 📋 Step 5: Create Pre-Commit Hooks

### **5.1 Husky Setup**

Install Husky for Git hooks:
```bash
npm install --save-dev husky
npx husky install
```

### **5.2 Pre-Commit Hook**

Create `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run checks before commit
npm run schema:verify:comprehensive
npm run lint
npm run typecheck
```

### **5.3 Pre-Push Hook**

Create `.husky/pre-push`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run build before push
npm run build
```

---

## 🎯 Step 6: Best Practices for Cursor Usage

### **6.1 Context Management**

**DO:**
- ✅ Reference specific files when asking questions
- ✅ Ask Cursor to read relevant docs before coding
- ✅ Use file paths in prompts: "Read `docs/blockchaingames/ARCHITECTURE.md`"
- ✅ Break large tasks into smaller prompts
- ✅ Ask for explanations before implementation

**DON'T:**
- ❌ Ask Cursor to write code without context
- ❌ Skip reading architecture docs
- ❌ Ignore type errors
- ❌ Bypass RLS policies

### **6.2 Prompting Strategies**

**Good Prompts:**
```
"Read docs/blockchaingames/PROJECT_SPEC.md and ARCHITECTURE.md, then create a character creation form that requires wallet connection and follows the database schema"
```

```
"Following the patterns in lib/supabase-client.ts, create a server action to execute a job action that checks the timer, pays BCGC, and grants career XP"
```

```
"Create a BCGW tier badge component that displays the user's tier based on their wallet balance, using lib/bcgwTiers.ts"
```

```
"Implement a pickpocket action using lib/game/conflict.ts. The client should only send attacker_id and defender_id. All calculations must be server-side."
```

```
"Create a will creation form that allows players to designate a beneficiary character and choose what assets to transfer (BCGC, land, businesses)"
```

**Bad Prompts:**
```
"Add combat logic to this component" (WRONG - combat logic must be in lib/game/conflict.ts)
```

```
"Calculate damage on the client side" (WRONG - all calculations server-side)
```

**Bad Prompts:**
```
"Create a form" (too vague)
```

```
"Add a button" (no context about where or why)
```

### **6.3 Code Review Workflow**

1. **Ask Cursor to review code:**
   ```
   "Review this code for type safety, RLS compliance, and architecture patterns"
   ```

2. **Ask for improvements:**
   ```
   "How can I improve this component to follow the project's architecture rules?"
   ```

3. **Verify before committing:**
   ```
   "Check if this code follows all the rules in .cursorrules"
   ```

---

## ✅ Step 7: Verification Checklist

After setup, verify:

- [ ] `.cursorrules` file exists in project root
- [ ] `BLOCKCHAINGAMES_PROJECT_CONTEXT.md` exists
- [ ] Cursor settings configured correctly
- [ ] GitHub Actions workflows set up
- [ ] GitHub secrets configured
- [ ] Pre-commit hooks working
- [ ] Type generation working
- [ ] Build passes locally
- [ ] CI passes on test commit

---

## 🚀 Quick Start Commands

```bash
# Verify setup
npm run schema:verify:comprehensive
npm run build
npm run lint

# Generate types
npm run types:regen

# Run pre-commit checks
npm run pre-commit

# Full verification
npm run verify-all
```

---

## 📚 Additional Resources

- **Cursor Documentation:** https://cursor.sh/docs
- **Project Specification:** `docs/blockchaingames/PROJECT_SPEC.md`
- **Technical Architecture:** `docs/blockchaingames/ARCHITECTURE.md`
- **Quick Start:** `docs/blockchaingames/QUICKSTART.md`
- **Extraction Plan:** `docs/blockchaingames/EXTRACTION_PLAN.md`

---

## 🎯 Summary

With proper Cursor setup:
- ✅ AI understands your project architecture
- ✅ Code follows established patterns
- ✅ Type safety is enforced
- ✅ CI/CD catches errors early
- ✅ Documentation stays up to date

**The key is providing context through `.cursorrules` and project context files, then trusting Cursor to follow those rules!**

