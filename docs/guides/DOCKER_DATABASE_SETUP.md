# 🐳 Docker Database Setup - Development & Production Guide

**Last Updated:** February 2, 2026  
**Status:** Complete Reference

---

## 📋 Table of Contents

- [Overview](#overview)
- [Development Setup (Docker-Based)](#development-setup-docker-based)
- [Production Setup (Supabase Cloud)](#production-setup-supabase-cloud)
- [Key Differences](#key-differences)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

TOTL Agency uses **two different database environments**:

1. **Development (Local):** Docker containers managed by Supabase CLI
2. **Production:** Supabase Cloud (hosted PostgreSQL, no Docker)

The Supabase CLI abstracts Docker management for local development, while production uses Supabase's managed cloud infrastructure.

---

## 🛠️ Development Setup (Docker-Based)

### **How It Works**

When you run `supabase start`, the Supabase CLI automatically:

1. **Checks for Docker** - Verifies Docker Desktop is running
2. **Pulls Docker Images** - Downloads required container images (PostgreSQL 15, PostgREST, GoTrue, etc.)
3. **Creates Docker Network** - Sets up isolated network for containers
4. **Starts Multiple Containers** - Launches all Supabase services

### **Docker Containers Created**

The `supabase start` command creates the following Docker containers:

| Container | Purpose | Port | Image |
|-----------|---------|------|-------|
| **supabase_db_totl** | PostgreSQL 15 database | `54322` | `supabase/postgres:15.1.0.*` |
| **supabase_api_totl** | PostgREST API server | `54321` | `postgrest/postgrest:v12.*` |
| **supabase_auth_totl** | GoTrue authentication | `54321` (via API) | `supabase/gotrue:v2.*` |
| **supabase_studio_totl** | Supabase Studio UI | `54323` | `supabase/studio:latest` |
| **supabase_realtime_totl** | Realtime subscriptions | `54321` (via API) | `supabase/realtime:v2.*` |
| **supabase_storage_totl** | Storage API | `54321` (via API) | `supabase/storage-api:v1.*` |
| **supabase_inbucket_totl** | Email testing server | `54324` | `inbucket/inbucket:stable` |
| **supabase_imgproxy_totl** | Image transformations | `54321` (via API) | `darthsim/imgproxy:v3.*` |
| **supabase_meta_totl** | Metadata management | Internal | `supabase/postgres-meta:v0.*` |

### **Configuration**

All Docker container settings are defined in `supabase/config.toml`:

```toml
project_id = "totl"

[db]
port = 54322              # PostgreSQL direct connection
shadow_port = 54320        # Shadow database for migrations
major_version = 15         # PostgreSQL version

[api]
port = 54321              # PostgREST API endpoint
enabled = true

[studio]
port = 54323              # Supabase Studio web UI
enabled = true

[inbucket]
port = 54324              # Email testing interface
enabled = true
```

### **Local Development Workflow**

```bash
# 1. Ensure Docker Desktop is running
# (Docker must be running before starting Supabase)

# 2. Start all Docker containers
supabase start

# Output shows:
# ✓ Started supabase local development setup.
#   API URL: http://127.0.0.1:54321
#   DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
#   Studio URL: http://127.0.0.1:54323
#   Inbucket URL: http://127.0.0.1:54324

# 3. Apply migrations and seed data
supabase db reset

# This command:
# - Stops containers (if running)
# - Recreates containers with fresh data
# - Applies all migrations from supabase/migrations/
# - Runs seed.sql to populate test data

# 4. Generate TypeScript types from local database
npx supabase gen types typescript --local > types/database.ts

# 5. Access services
# - Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres
# - API: http://127.0.0.1:54321
# - Studio: http://127.0.0.1:54323
# - Email Testing: http://127.0.0.1:54324
```

### **Docker Data Persistence**

- **Database Data:** Stored in Docker volumes (persists between container restarts)
- **Volume Name:** `supabase_db_totl` (project-specific)
- **Location:** Managed by Docker Desktop (typically `~/Library/Containers/com.docker.docker/Data/vms/0/data/` on Mac)

### **Stopping Docker Containers**

```bash
# Stop all Supabase containers
supabase stop

# This stops all containers but preserves data volumes
# Run `supabase start` again to resume with existing data

# To completely remove containers and data:
supabase stop --no-backup
# ⚠️ WARNING: This deletes all local database data
```

### **Docker Container Management**

```bash
# Check container status
supabase status

# View running containers
docker ps --filter "name=supabase"

# View container logs
docker logs supabase_db_totl
docker logs supabase_api_totl

# Access database directly via Docker
docker exec -it supabase_db_totl psql -U postgres
```

---

## ☁️ Production Setup (Supabase Cloud)

### **How It Works**

Production uses **Supabase Cloud** - a fully managed PostgreSQL database hosted by Supabase:

- **No Docker involved** - Supabase manages all infrastructure
- **PostgreSQL 15** - Same version as local development
- **Managed Services** - Database, API, Auth, Storage all hosted
- **Automatic Backups** - Daily backups managed by Supabase
- **High Availability** - Redundant infrastructure

### **Production Database Connection**

```
Production Database URL:
postgresql://postgres:[PASSWORD]@db.utvircuwknqzpnmvxidp.supabase.co:5432/postgres

Production API URL:
https://utvircuwknqzpnmvxidp.supabase.co

Project Reference: utvircuwknqzpnmvxidp
```

### **Production Workflow**

```bash
# 1. Link CLI to production project
supabase link --project-ref utvircuwknqzpnmvxidp

# Or use npm script:
npm run link:dev

# 2. Push migrations to production
supabase db push

# Or use npm script:
npm run db:push

# This applies all pending migrations from supabase/migrations/
# ⚠️ Always test migrations locally first!

# 3. Generate types from production database
npm run types:regen:prod

# Requires SUPABASE_PROJECT_ID environment variable:
# SUPABASE_PROJECT_ID=utvircuwknqzpnmvxidp npm run types:regen:prod
```

### **Production Environment Variables**

Production uses different environment variables than local:

```env
# Production Supabase URLs
SUPABASE_URL=https://utvircuwknqzpnmvxidp.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://utvircuwknqzpnmvxidp.supabase.co

# Production API Keys (from Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Production Access Token (for CLI operations)
SUPABASE_ACCESS_TOKEN=sbp_...
```

### **Production Database Management**

- **Migrations:** Applied via `supabase db push` (CLI connects to cloud)
- **Schema Changes:** Always create new migration files, never edit existing ones
- **Direct Access:** Available via Supabase Dashboard SQL Editor
- **Backups:** Automatic daily backups (managed by Supabase)
- **Monitoring:** Available via Supabase Dashboard

---

## 🔄 Key Differences

| Aspect | Development (Docker) | Production (Cloud) |
|--------|---------------------|---------------------|
| **Infrastructure** | Docker containers on local machine | Supabase managed cloud |
| **Database Location** | `127.0.0.1:54322` | `db.utvircuwknqzpnmvxidp.supabase.co:5432` |
| **Startup Command** | `supabase start` | N/A (always running) |
| **Migrations** | `supabase db reset` or `supabase db push` | `supabase db push` |
| **Data Persistence** | Docker volumes | Supabase managed storage |
| **Backups** | Manual (Docker volumes) | Automatic daily backups |
| **Email Testing** | Inbucket (`127.0.0.1:54324`) | Real emails via Resend |
| **Studio Access** | `http://127.0.0.1:54323` | Supabase Dashboard |
| **Cost** | Free (local resources) | Supabase pricing plan |
| **Isolation** | Isolated on your machine | Shared Supabase infrastructure |

---

## 🔧 Common Workflows

### **Daily Development Workflow**

```bash
# Morning: Start local development
docker ps  # Verify Docker is running
supabase start
supabase status  # Verify all services are up

# Make schema changes
supabase migration new add_new_feature
# Edit supabase/migrations/[timestamp]_add_new_feature.sql

# Test locally
supabase db reset  # Applies migrations + seeds
npm run types:regen  # Regenerate types

# End of day: Stop containers (optional)
supabase stop
```

### **Deploying to Production**

```bash
# 1. Test migration locally first
supabase db reset
npm run types:regen
npm run build  # Verify types compile

# 2. Link to production (if not already linked)
npm run link:dev

# 3. Push migration to production
npm run db:push

# 4. Regenerate types from production
SUPABASE_PROJECT_ID=utvircuwknqzpnmvxidp npm run types:regen:prod

# 5. Commit migration + updated types
git add supabase/migrations/ types/database.ts
git commit -m "feat: add new feature migration"
```

### **Resetting Local Database**

```bash
# Complete reset (removes all data, reapplies migrations + seeds)
supabase db reset

# Or using npm script:
npm run db:reset

# This will:
# 1. Stop containers
# 2. Remove volumes
# 3. Recreate containers
# 4. Apply all migrations
# 5. Run seed.sql
```

### **Syncing Production Schema to Local**

```bash
# Pull production schema to local
supabase db pull

# This creates a new migration file with differences
# Review the migration before applying

# Apply the pulled migration locally
supabase db reset
```

---

## 🐛 Troubleshooting

### **Docker Not Running**

**Error:** `Error: Docker is not running`

**Solution:**
```bash
# Start Docker Desktop application
# Then verify:
docker ps

# Should show running containers (or empty list if none running)
```

### **Port Already in Use**

**Error:** `Error: port 54322 is already in use`

**Solution:**
```bash
# Find what's using the port
# Windows PowerShell:
netstat -ano | findstr :54322

# Stop conflicting service or change port in config.toml
# Then restart:
supabase stop
supabase start
```

### **Containers Won't Start**

**Error:** Containers fail to start or crash immediately

**Solution:**
```bash
# Check Docker logs
docker logs supabase_db_totl
docker logs supabase_api_totl

# Reset everything
supabase stop --no-backup
supabase start

# If still failing, check Docker Desktop resources:
# - Ensure enough memory allocated (4GB+ recommended)
# - Check Docker Desktop logs
```

### **Migration Conflicts**

**Error:** `Migration conflict` or `schema drift detected`

**Solution:**
```bash
# 1. Check migration status
supabase db status

# 2. Pull production schema to see differences
supabase db pull

# 3. Review generated migration file
# 4. Apply locally first
supabase db reset

# 5. Fix any issues, then push to production
supabase db push
```

### **Types Out of Sync**

**Error:** TypeScript errors indicating schema mismatch

**Solution:**
```bash
# Regenerate types from current database
npm run types:regen

# For production:
SUPABASE_PROJECT_ID=utvircuwknqzpnmvxidp npm run types:regen:prod

# Verify types compile
npm run typecheck
```

### **Database Connection Issues**

**Local Development:**
```bash
# Verify containers are running
supabase status

# Check database is accessible
docker exec -it supabase_db_totl psql -U postgres -c "SELECT version();"

# Restart if needed
supabase stop
supabase start
```

**Production:**
```bash
# Verify project link
supabase projects list

# Test connection
supabase db status --linked

# Check environment variables
echo $SUPABASE_ACCESS_TOKEN
```

---

## 📚 Additional Resources

### **Supabase CLI Commands**

```bash
# Container management
supabase start          # Start all Docker containers
supabase stop           # Stop containers (preserves data)
supabase stop --no-backup  # Stop and remove volumes
supabase status         # Show container status

# Database operations
supabase db reset       # Reset local DB (migrations + seed)
supabase db push        # Push migrations to linked project
supabase db pull        # Pull schema from linked project
supabase db diff        # Show schema differences
supabase db status      # Show migration status

# Type generation
supabase gen types typescript --local > types/database.ts
supabase gen types typescript --project-id [ID] > types/database.ts

# Project management
supabase link --project-ref [REF]  # Link to remote project
supabase projects list             # List accessible projects
```

### **Docker Commands**

```bash
# View Supabase containers
docker ps --filter "name=supabase"

# View container logs
docker logs supabase_db_totl
docker logs -f supabase_api_totl  # Follow logs

# Access database shell
docker exec -it supabase_db_totl psql -U postgres

# View Docker volumes
docker volume ls | grep supabase

# Remove all Supabase volumes (⚠️ deletes data)
docker volume rm $(docker volume ls -q | grep supabase)
```

### **Configuration Files**

- **`supabase/config.toml`** - Docker container configuration
- **`supabase/migrations/`** - Database migration files
- **`supabase/seed.sql`** - Seed data for local development
- **`.env.local`** - Local environment variables (not committed)

---

## ✅ Best Practices

1. **Always test migrations locally** before pushing to production
2. **Never edit applied migrations** - create new ones instead
3. **Regenerate types** after every schema change
4. **Keep Docker Desktop running** during development
5. **Use `supabase db reset`** for clean local testing
6. **Commit migrations and updated types together**
7. **Verify `npm run build`** passes before deploying
8. **Use `supabase status`** to verify local setup
9. **Check production migration status** before deploying
10. **Keep `config.toml`** in sync with production settings

---

## 🔐 Security Notes

- **Local Docker:** Data stored locally, no external access
- **Production:** Managed by Supabase with automatic security updates
- **Never commit:** `.env.local`, Docker volumes, or service keys
- **Use RLS:** Row-Level Security enforced in both environments
- **Service Keys:** Only use server-side, never in client code

---

**Last Updated:** February 2, 2026  
**Maintained By:** TOTL Development Team
