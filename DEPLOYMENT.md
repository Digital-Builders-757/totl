# 🚀 TOTL Agency Deployment Guide

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

## Troubleshooting

### "Supabase not configured" Error
- Ensure environment variables are set in deployment platform
- Verify variables are not empty or malformed
- Check that variables are set for all environments (Production, Preview, Development)

### Build Fails on Vercel
- Environment variables must be set in Vercel dashboard
- Local `.env.local` is not used in production builds
- Redeploy after adding environment variables 