# Blockchain Gang Life - Project Documentation

**Status:** Planning Phase  
**Project:** Blockchain Gang Life (Blockchain Gang World)  
**Blockchain:** Solana (SPL tokens)  
**Tech Stack:** Next.js 15 + Supabase + Solana + Vercel

---

## 📚 Documentation Index

### **Core Documentation**

1. **[PROJECT_SPEC.md](./PROJECT_SPEC.md)** - Complete project specification
   - Game design and lore
   - Token economy (BCGW & BCGC)
   - BCGW tier system
   - All game systems (jobs, careers, land, businesses, conflict)
   - Implementation priorities for v1

2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture plan
   - Database schema design (22+ tables)
   - Solana integration patterns
   - Real-time features
   - Cost considerations
   - Phased rollout plan

3. **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide
   - Week-by-week breakdown
   - File structure
   - Implementation steps
   - Getting started checklist

4. **[EXTRACTION_PLAN.md](./EXTRACTION_PLAN.md)** - Template extraction guide
   - Step-by-step extraction from TOTL
   - What to keep/remove
   - Solana integration setup
   - Configuration updates
   - Verification checklist

4. **[CURSOR_SETUP_GUIDE.md](./CURSOR_SETUP_GUIDE.md)** - Cursor AI configuration
   - `.cursorrules` setup
   - Context prompt configuration
   - Best practices for AI-assisted development
   - Prompting strategies

5. **[CI_CD_SETUP.md](./CI_CD_SETUP.md)** - CI/CD pipeline setup
   - GitHub Actions workflows
   - Automated testing and verification
   - Schema truth checking
   - Deployment pipelines

6. **[COST_ANALYSIS.md](./COST_ANALYSIS.md)** - Cost & performance analysis
   - Infrastructure costs for 100+ players
   - Performance optimization strategies
   - Scaling projections
   - Realistic cost estimates

7. **[MVP_ROADMAP.md](./MVP_ROADMAP.md)** - Phased implementation roadmap
   - Phase-by-phase checklist
   - Definition of done for each phase
   - Timeline estimates
   - Cursor AI-friendly task breakdown

---

## 🎯 Project Overview

**Blockchain Gang Life** is a web-based RPG/metaverse management game set in **Blockchain Gang World** where players can:
- Connect Solana wallet and earn BCGW tier status
- Create characters with customizable stats and choose starting city
- Choose career paths (Police, Lawyer, Doctor, Criminal organizations, etc.)
- Earn BCGC (in-game currency) through UBI, jobs, businesses, and crime
- Attend University to unlock career paths
- Own virtual land and build businesses
- Engage in conflict (GBH or Death)
- Participate in dynamic world events and witness reports
- Join factions (gangs, political parties, police departments)

---

## 🏗️ Architecture Highlights

- **Frontend:** Next.js 15 App Router + TypeScript (strict mode)
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Hosting:** Vercel
- **UI:** TailwindCSS + shadcn/ui
- **Blockchain:** Solana (SPL tokens)
  - BCGW (Blockchain Games World Token) - Utility/governance token
  - BCGC (Blockchain Game Cash) - In-game currency
  - Wallet integration via `@solana/wallet-adapter`

---

## 🚀 Quick Start

1. **Read [EXTRACTION_PLAN.md](./EXTRACTION_PLAN.md)** - Understand how to extract from TOTL
2. **Read [ARCHITECTURE.md](./ARCHITECTURE.md)** - Understand the full system design
3. **Follow [QUICKSTART.md](./QUICKSTART.md)** - Start building MVP

---

## 📋 Development Phases

### **Phase 0: Foundation & Extraction**
- Extract from TOTL template
- Solana wallet integration
- Database schema setup
- Basic auth system

### **Phase 1: Core Economy & Timers (Weeks 1-2)**
- Character creation (name, gender, city)
- BCGW tier system
- UBI claim system
- Job timer (basic jobs)
- Action timer (freelance + simple crime)
- Basic dashboard
- One city

### **Phase 2: PVP, Health, Death, Wills (Weeks 3-4)**
- Conflict system (`lib/game/conflict.ts`)
  - Pickpocket, mugging, GBH, kill
- Health system (0-100 range)
- Death handling (`is_alive = false`)
- Will & inheritance system (`lib/game/wills.ts`)
- PVP UI (attack buttons, health bars)

### **Phase 3: Social & Factions (Weeks 5-6)**
- Friend system (`character_relationships`)
- Faction membership (`faction_members`)
- Relationship system
- Faction UI
- Social dashboard

### **Phase 4: University & Careers (Weeks 7-8)**
- University system
- Degree progression
- Career paths
- Multiple job types
- Job promotions

### **Phase 5: Land & Business (Weeks 9-10)**
- Land market
- Business creation
- Rent system
- Business operations
- Secret rooms

### **Phase 6: City Wars & Advanced (Weeks 11-12)**
- City war system (`city_wars`, `war_events`)
- War declaration & resolution
- Multiple cities
- Advanced conflict mechanics
- War UI

---

## 🔗 Related Documentation

This project is extracted from **TOTL Agency** as a template. Reference TOTL for:
- Auth patterns (adapt for wallet-based)
- Database patterns
- RLS policy examples
- Type safety patterns
- Error handling

**Key Differences from TOTL:**
- Solana wallet-based authentication
- SPL token integration (BCGW & BCGC)
- Game-specific database schema
- Timer-based gameplay loops
- Conflict and crime systems

---

## 📝 Notes

- All documentation is in `docs/blockchaingames/` folder
- Keep this separate from TOTL docs
- Update as project evolves
- Reference TOTL patterns where applicable

---

**Ready to build? Start with the [PROJECT_SPEC.md](./PROJECT_SPEC.md) to understand the full design, then follow [EXTRACTION_PLAN.md](./EXTRACTION_PLAN.md)!** 🎮

