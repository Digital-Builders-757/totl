# 🚀 TOTL Agency Deployment Guide

**Last Updated:** July 25, 2025  
**Status:** Production Ready

## Environment Variables Required

### Supabase Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=https://utvircuwknqzpnmvxidp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dmlyY3V3a25xenBubXZ4aWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDY1NTIsImV4cCI6MjA2MTY4MjU1Mn0.Y9Cb-f8sGR0tZleNWtlWCJawq_Xon7glmnODymV8TQ0
```

### Email Service (Optional)
```env
RESEND_API_KEY=your_resend_api_key_here
```

## Vercel Deployment Steps

1. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add both Supabase variables above
   - Set for Production, Preview, and Development

2. **Deploy:**
   - Push to main branch or click "Redeploy"
   - Build should succeed with environment variables

## Local Development

1. **Create `.env.local`:**
   ```bash
   cp .env.example .env.local
   # Edit with your actual values
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

## Build Verification

```bash
npm run build
npx tsc --noEmit
```

Both commands should complete without errors.

## Database Migration

### Local Development
```bash
# Reset local database
supabase db reset

# Generate types
npx supabase gen types typescript --local > types/database.ts
```

### Production
```bash
# Push migrations to production
supabase db push

# Generate types from production
npx supabase gen types typescript --project-id your-project-id > types/database.ts
```

## Troubleshooting

### "Supabase not configured" Error
- Ensure environment variables are set in deployment platform
- Verify variables are not empty or malformed
- Check that variables are set for all environments (Production, Preview, Development)

### Build Fails on Vercel
- Environment variables must be set in Vercel dashboard
- Local `.env.local` is not used in production builds
- Redeploy after adding environment variables

### Database Connection Issues
- Verify Supabase project is active
- Check API keys are correct
- Ensure RLS policies are properly configured

## Post-Deployment Checklist

- [ ] **Environment variables** set correctly
- [ ] **Database migrations** applied
- [ ] **Email service** working (if configured)
- [ ] **Authentication** functioning
- [ ] **RLS policies** active
- [ ] **Performance** acceptable
- [ ] **Error handling** working
- [ ] **Empty states** displaying correctly

## Security Considerations

- ✅ **RLS policies** enabled on all tables
- ✅ **No service keys** exposed to client
- ✅ **Environment variables** properly configured
- ✅ **HTTPS** enforced in production
- ✅ **Authentication** required for protected routes

---

**For detailed security information, see [SECURITY_FIXES_SUMMARY.md](SECURITY_FIXES_SUMMARY.md)** 