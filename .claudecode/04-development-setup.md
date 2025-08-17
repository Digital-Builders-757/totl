# 04 - Development Setup & Environment Guide

## 🚀 Quick Start Checklist

### **Prerequisites**
- Node.js 18+ with npm
- Git for version control
- VS Code (recommended) with extensions
- Supabase CLI for database management

### **Environment Setup (5 minutes)**
```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Configure environment variables (see below)
# 4. Start development server
npm run dev

# 5. Verify setup
npm run lint && npm run typecheck && npm run build
```

## 🔧 Environment Configuration

### **Required Environment Variables**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application URLs  
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key

# Optional: Analytics and Monitoring
NEXT_PUBLIC_GA_ID=your_google_analytics_id
SENTRY_DSN=your_sentry_dsn
```

### **Environment Security** ⚠️
- **Never commit** `.env.local` to version control
- **Service role key** only used server-side, never client-side
- **Public keys** must start with `NEXT_PUBLIC_`
- **Production secrets** stored in deployment platform

## 🛠️ Development Tools Setup

### **VS Code Extensions (Recommended)**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss", 
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "supabase.supabase"
  ]
}
```

### **VS Code Settings**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## 📦 Package Scripts Reference

### **Development Commands**
```bash
npm run dev              # Start development server (port 3000)
npm run build            # Production build  
npm run start            # Start production server
npm run lint             # Run ESLint checks
npm run format           # Format code with Prettier
```

### **Database Commands**
```bash
npm run types:regen      # Regenerate database types
npm run types:check      # Verify types are current
npm run schema:verify    # Validate schema consistency
npm run schema:verify-fast # Quick schema check
```

### **Supabase Commands**
```bash
npm run supabase:login   # Login to Supabase CLI
npm run supabase:link    # Link project to remote
npm run db:reset         # Reset local database
npm run db:push          # Push migrations to remote
npm run db:pull          # Pull schema from remote
```

### **Quality Assurance**
```bash
npm run typecheck        # TypeScript validation
npm run pre-commit       # Lint + typecheck (pre-commit hook)
npm run verify-all       # Complete verification suite
npm run dod              # Definition of Done checks
```

## 🗄️ Database Development Setup

### **Local Supabase Setup**
```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Initialize project (if not done)
supabase init

# 3. Start local Supabase
supabase start

# 4. Apply migrations
supabase db push

# 5. Generate types
npm run types:regen
```

### **Database Connection Testing**
```bash
# Test connection and permissions
npm run db:status

# Verify schema sync
npm run schema:verify

# Check RLS policies
supabase db inspect
```

## 🔄 Development Workflow

### **Feature Development Process**
1. **Create branch**: `git checkout -b feature/description`
2. **Setup**: Ensure latest schema and types (`npm run types:check`)
3. **Develop**: Follow coding standards in `05-coding-standards.md`
4. **Test**: Run `npm run verify-all` before commit
5. **Commit**: Use conventional commit messages
6. **PR**: Submit with completed checklist

### **Database Changes Workflow**
1. **Migration**: `supabase migration new "description"`
2. **Develop**: Write SQL with rollback support
3. **Test Local**: `supabase db reset && supabase db push`
4. **Types**: `npm run types:regen`
5. **Update Code**: Modify selects and components
6. **Verify**: `npm run schema:verify`
7. **Deploy**: `supabase db push --linked`

### **Daily Development Checklist**
- [ ] Pull latest changes: `git pull origin develop`
- [ ] Install dependencies: `npm install`
- [ ] Check schema sync: `npm run types:check`
- [ ] Start development: `npm run dev`
- [ ] Verify setup: Access `http://localhost:3000`

## 🔍 Local Development URLs

### **Application URLs**
- **Frontend**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin/dashboard
- **API Routes**: http://localhost:3000/api/*

### **Supabase URLs** (when running locally)
- **Studio**: http://localhost:54323
- **API**: http://localhost:54321
- **Auth**: http://localhost:54321/auth/v1
- **Storage**: http://localhost:54321/storage/v1

## 🐛 Common Setup Issues

### **Node Version Issues**
```bash
# Check Node version
node --version  # Should be 18+

# Use nvm to manage versions
nvm use 18
nvm alias default 18
```

### **Environment Variable Issues**
```bash
# Verify variables are loaded
echo $NEXT_PUBLIC_SUPABASE_URL

# Check .env.local exists and has correct values
cat .env.local | grep SUPABASE
```

### **Database Connection Issues**
```bash
# Test Supabase connection
supabase projects list
supabase db status --linked

# Regenerate types if schema is out of sync
npm run types:regen
```

### **Build Issues**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Verify TypeScript config
npx tsc --noEmit
```

## 🎯 Development Best Practices

### **Code Organization**
- **Server Components**: Place in route directories
- **Client Components**: Mark with `'use client'`, colocate with usage
- **Utilities**: Organize in `lib/` by functionality
- **Types**: Import from generated `types/database.ts`

### **Database Development**
- **Always use explicit column selection**
- **Test RLS policies with different user roles**
- **Use Server Actions for all mutations**
- **Keep schema documentation updated**

### **Performance Development**
- **Use React DevTools Profiler**
- **Monitor bundle size with analyzer**
- **Test with slow network conditions**
- **Verify image optimization is working**

## 🚦 Ready-to-Code Verification

### **Setup Verification Checklist**
```bash
# Environment check
npm run typecheck          # ✅ No TypeScript errors
npm run lint              # ✅ No ESLint errors  
npm run build             # ✅ Successful build
npm run schema:verify     # ✅ Schema synchronized

# Development server check
npm run dev               # ✅ Server starts on port 3000
# Navigate to http://localhost:3000 # ✅ Page loads correctly
# Test login flow          # ✅ Authentication works

# Database check  
supabase db status --linked # ✅ Connected to remote
npm run types:check        # ✅ Types are current
```

### **Success Indicators**
- ✅ Development server runs without errors
- ✅ All pages load correctly in browser
- ✅ Authentication flow works end-to-end
- ✅ Database queries execute successfully
- ✅ Build process completes without warnings

## 📋 Development Environment Health

### **Daily Health Check**
```bash
#!/bin/bash
echo "🔍 Running development environment health check..."

npm run typecheck && echo "✅ TypeScript" || echo "❌ TypeScript"
npm run lint && echo "✅ ESLint" || echo "❌ ESLint"  
npm run types:check && echo "✅ Database Types" || echo "❌ Database Types"
npm run schema:verify-fast && echo "✅ Schema Sync" || echo "❌ Schema Sync"

echo "🎯 Health check complete!"
```

---

**Setup Time**: ~5 minutes for experienced developers
**Complexity**: Low (well-documented process)
**Support**: All issues documented in `09-troubleshooting.md`
**Last Updated**: 2025-01-17

*This guide ensures consistent development environments across all team members.*