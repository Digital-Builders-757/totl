# CI/CD Setup Guide - Blockchain Gang Life

**Purpose:** Complete guide to setting up Continuous Integration and Continuous Deployment for Blockchain Gang Life  
**Project:** Blockchain Gang Life (Blockchain Gang World)  
**Blockchain:** Solana (SPL tokens)

---

## 🎯 Overview

This guide covers:
- GitHub Actions workflows
- Automated testing and verification
- Schema truth checking
- Type generation automation
- Deployment pipelines

---

## 📋 Prerequisites

- ✅ GitHub repository created
- ✅ Supabase project created
- ✅ GitHub Actions enabled
- ✅ Required secrets configured

---

## 🔧 Step 1: GitHub Actions Workflows

### **1.1 Directory Structure**

Create `.github/workflows/` directory:
```bash
mkdir -p .github/workflows
```

### **1.2 Main CI Pipeline**

**File:** `.github/workflows/ci.yml`

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
    environment: develop
    
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
          
      - name: Verify no server-only imports in client code
        run: |
          if grep -r "from [\"']next/headers[\"']" components app/**/*.tsx 2>/dev/null; then
            echo "❌ Found next/headers import in client code!"
            exit 1
          fi
          echo "✅ No server-only imports in client code"
```

### **1.3 Schema Truth Verification**

**File:** `.github/workflows/schema-truth-check.yml`

```yaml
name: "Schema Truth Verification"

on:
  pull_request:
    paths:
      - "supabase/migrations/**"
      - "types/database.ts"
      - "database_schema_audit.md"
  push:
    branches: [ main, develop ]
    paths:
      - "supabase/migrations/**"
      - "types/database.ts"
      - "database_schema_audit.md"

env:
  SUPABASE_PROJECT_REF_DEV: <your-dev-project-id>

jobs:
  verify-schema:
    runs-on: ubuntu-latest
    environment: develop
    
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

      - name: Choose project ref by branch
        id: ref
        run: |
          if [ "${GITHUB_REF##*/}" = "main" ]; then
            echo "ref=${{ secrets.SUPABASE_PROJECT_ID }}" >> $GITHUB_OUTPUT
            echo "env=production" >> $GITHUB_OUTPUT
          else
            echo "ref=${SUPABASE_PROJECT_REF_DEV}" >> $GITHUB_OUTPUT
            echo "env=development" >> $GITHUB_OUTPUT
          fi

      - name: Login to Supabase
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: npx -y supabase@2.34.3 login --token "$SUPABASE_ACCESS_TOKEN"

      - name: Generate types from remote schema
        run: npx -y supabase@2.34.3 gen types typescript --project-id ${{ steps.ref.outputs.ref }} --schema public > types/temp_schema_types.ts

      - name: Add banner to generated types
        run: node scripts/prepend-autogen-banner.mjs types/temp_schema_types.ts

      - name: Normalize both files
        shell: bash
        run: |
          python3 - <<'PY'
          import sys

          def normalize(src, dst):
            b = open(src, "rb").read()
            if b.startswith(b"\xef\xbb\xbf"):
              b = b[3:]
            b = b.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
            open(dst, "wb").write(b)

          normalize("types/temp_schema_types.ts", "types/_remote.normalized.ts")
          normalize("types/database.ts",          "types/_local.normalized.ts")
          PY

      - name: Compare generated types with committed types
        shell: bash
        run: |
          set -euo pipefail
          
          clean() {
            sed -E '/__InternalSupabase: \{/,/^\s*\}/d' "$1" | sed 's/\r$//'
          }
          
          clean types/_remote.normalized.ts > types/_remote.clean.ts
          clean types/_local.normalized.ts > types/_local.clean.ts
          
          if ! diff -u types/_remote.clean.ts types/_local.clean.ts; then
            echo ""
            echo "❌ ERROR: types/database.ts is out of sync with remote schema"
            echo ""
            echo "🔧 To fix locally:"
            echo "   npm run types:regen"
            echo ""
            exit 1
          else
            echo "✅ Types are in sync with remote schema"
          fi

      - name: Cleanup temp files
        if: always()
        run: rm -f types/_remote.normalized.ts types/_local.normalized.ts types/_remote.clean.ts types/_local.clean.ts types/temp_schema_types.ts
```

### **1.4 Lint Check**

**File:** `.github/workflows/lint.yml`

```yaml
name: Lint Check

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run lint
```

---

## 🔐 Step 2: Configure GitHub Secrets

### **2.1 Required Secrets**

Go to **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Dashboard → Settings → API |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI token | `supabase login` → Copy token |
| `SUPABASE_PROJECT_ID` | Supabase project ID | Supabase Dashboard → Settings → General |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Solana network (devnet/mainnet) | Set to `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Solana RPC endpoint | Use public RPC or Helius/QuickNode |
| `NEXT_PUBLIC_BCGW_MINT_ADDRESS` | BCGW token mint address | Solana token mint address |
| `NEXT_PUBLIC_BCGC_MINT_ADDRESS` | BCGC token mint address | Solana token mint address |

### **2.2 Environment-Specific Secrets**

For production deployments, create separate environments:
- **develop** - Development environment
- **production** - Production environment

Each environment can have different Supabase project IDs.

---

## 📝 Step 3: Package.json Scripts

### **3.1 Essential Scripts**

Add these to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    
    "types:regen": "npx -y supabase@2.34.3 gen types typescript --project-id <project-id> --schema public > types/database.ts && node scripts/prepend-autogen-banner.mjs",
    
    "schema:verify:comprehensive": "node scripts/verify-schema-sync-comprehensive.mjs",
    "types:check": "node scripts/verify-types-fresh.mjs",
    
    "verify-all": "npm run lint && npm run types:check && npm run typecheck && npm run build",
    
    "pre-commit": "npm run schema:verify:comprehensive && npm run lint && npm run typecheck"
  }
}
```

### **3.2 Helper Scripts**

Create `scripts/prepend-autogen-banner.mjs`:

```javascript
import { readFileSync, writeFileSync } from 'fs';

const filePath = process.argv[2];
const content = readFileSync(filePath, 'utf-8');

const banner = `// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Generated from Supabase schema
// Run 'npm run types:regen' to update

`;

writeFileSync(filePath, banner + content);
```

---

## 🎣 Step 4: Pre-Commit Hooks

### **4.1 Install Husky**

```bash
npm install --save-dev husky
npx husky install
```

### **4.2 Create Pre-Commit Hook**

**File:** `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run checks before commit
npm run schema:verify:comprehensive
npm run lint
npm run typecheck
```

### **4.3 Create Pre-Push Hook**

**File:** `.husky/pre-push`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run build before push
npm run build
```

---

## 🚀 Step 5: Deployment Pipeline

### **5.1 Vercel Deployment**

Vercel automatically deploys from GitHub:

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Enable automatic deployments

### **5.2 Environment Variables in Vercel**

Set these in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for server-side operations)

### **5.3 Branch-Based Deployments**

- **main** → Production deployment
- **develop** → Preview deployment
- **feature branches** → Preview deployments

---

## ✅ Step 6: Verification Checklist

After setup:

- [ ] GitHub Actions workflows created
- [ ] GitHub secrets configured
- [ ] Package.json scripts added
- [ ] Pre-commit hooks working
- [ ] CI passes on test commit
- [ ] Schema verification working
- [ ] Type generation working
- [ ] Vercel deployment configured

---

## 🔍 Step 7: Monitoring & Debugging

### **7.1 Check CI Status**

- Go to **GitHub** → **Actions** tab
- View workflow runs
- Check failed jobs for errors

### **7.2 Common CI Failures**

**Schema Sync Error:**
```
❌ ERROR: types/database.ts is out of sync with remote schema
```
**Fix:** Run `npm run types:regen` locally and commit

**Build Failure:**
```
❌ Build failed
```
**Fix:** Check build logs, fix TypeScript errors locally first

**Lint Errors:**
```
❌ Linting failed
```
**Fix:** Run `npm run lint:fix` or fix manually

---

## 📊 Step 8: CI/CD Best Practices

### **8.1 Workflow Organization**

- Keep workflows focused (one job per concern)
- Use environment variables for configuration
- Cache dependencies for faster runs
- Run checks in parallel when possible

### **8.2 Error Handling**

- Always clean up temp files (`if: always()`)
- Provide clear error messages
- Include fix instructions in error output
- Use `continue-on-error: true` sparingly

### **8.3 Security**

- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly
- Use environment-specific secrets

---

## 🎯 Summary

With proper CI/CD setup:
- ✅ Code is automatically tested
- ✅ Schema changes are verified
- ✅ Types stay in sync
- ✅ Builds catch errors early
- ✅ Deployments are automated

**The key is catching errors before they reach production!**

---

## 📚 Additional Resources

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Supabase CLI:** https://supabase.com/docs/reference/cli
- **Vercel Docs:** https://vercel.com/docs
- **Project Specification:** `docs/blockchaingames/PROJECT_SPEC.md`
- **Technical Architecture:** `docs/blockchaingames/ARCHITECTURE.md`

