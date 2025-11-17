# 🔍 Sentry Production Setup Guide

**Last Updated:** October 17, 2025  
**Status:** Ready for Production Configuration

---

## 🎯 Overview

TOTL Agency now supports **separate Sentry projects** for different environments:

- **Development:** Local testing and debugging
- **Production:** Live site error tracking

---

## 📝 Step 1: Production Sentry DSN (Already Configured!)

✅ **Your Production DSN:**
```
https://9f271197ad8ee6ef9c43094ffae46796@o4510191106654208.ingest.us.sentry.io/4510191108292609
```

✅ **Your Development DSN:**
```
https://3b65d7c0706cdd0196906fa0d45c0731@o4510190992424960.ingest.us.sentry.io/4510191032926215
```

**Sentry Project URL:**
https://the-digital-builders-bi.sentry.io/issues/

---

## ⚙️ Step 2: Configure Environment Variables

### **For Vercel (Production)**

Add these environment variables in your Vercel project settings:

```bash
# Production Sentry DSN (COPY THIS EXACTLY)
NEXT_PUBLIC_SENTRY_DSN_PROD=https://9f271197ad8ee6ef9c43094ffae46796@o4510191106654208.ingest.us.sentry.io/4510191108292609
SENTRY_DSN_PROD=https://9f271197ad8ee6ef9c43094ffae46796@o4510191106654208.ingest.us.sentry.io/4510191108292609

# Sentry Auth Token (for releases and source maps)
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Sentry Organization and Project
SENTRY_ORG=the-digital-builders-bi
SENTRY_PROJECT=sentry-yellow-notebook
```

**Important:** Make sure to set these environment variables for **Production** only in Vercel!

### **For Local Development (Optional)**

Create `.env.local` in your project root:

```bash
# Development Sentry (already configured as fallback)
NEXT_PUBLIC_SENTRY_DSN_DEV=https://3b65d7c0706cdd0196906fa0d45c0731@o4510190992424960.ingest.us.sentry.io/4510191032926215
SENTRY_DSN_DEV=https://3b65d7c0706cdd0196906fa0d45c0731@o4510190992424960.ingest.us.sentry.io/4510191032926215

# Or test with production DSN locally (not recommended)
# NEXT_PUBLIC_SENTRY_DSN_PROD=your_production_dsn_here
```

---

## 🔑 Step 3: Get Sentry Auth Token (for Source Maps)

1. Go to: https://sentry.io/settings/account/api/auth-tokens/
2. Click **Create New Token**
3. Name it: `TOTL Production Token`
4. Select scopes:
   - ✅ `project:releases`
   - ✅ `project:write`
   - ✅ `org:read`
5. Click **Create Token**
6. Copy the token (save it securely - you won't see it again!)
7. Add it to Vercel as `SENTRY_AUTH_TOKEN`

---

## 🚀 Step 4: Deploy to Vercel

Once you've added the environment variables:

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add all the variables from Step 2
4. Click **Save**
5. Redeploy your project

---

## ✅ Step 5: Verify It's Working

### Test in Development:
```bash
# Start your local server
npm run dev

# Trigger a test error
# Visit: http://localhost:3000/test-sentry
```

### Test in Production:
```bash
# After deploying to Vercel
# Visit: https://your-domain.com/test-sentry
```

### Check Sentry Dashboard:
1. Go to your production Sentry project: https://the-digital-builders-bi.sentry.io/issues/
2. You should see the test error appear within seconds
3. Click on it to see the full stack trace with source maps

---

## 🔍 How It Works

### Environment Detection:

```typescript
// In instrumentation-client.ts and sentry.server.config.ts

const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

const SENTRY_DSN = isProduction && PRODUCTION_DSN 
  ? PRODUCTION_DSN   // Use production DSN in production
  : DEVELOPMENT_DSN; // Use development DSN everywhere else
```

### What Happens:
- **Local development** → Uses development Sentry project
- **Vercel preview** → Uses development Sentry project
- **Vercel production** → Uses production Sentry project

---

## 📊 Benefits

✅ **Separate Error Tracking:**
- Development errors don't clutter production dashboard
- Production errors get immediate attention

✅ **Better Organization:**
- Clear separation of concerns
- Easier to filter and analyze errors

✅ **Proper Alerting:**
- Set up production alerts without dev noise
- Configure different notification rules

✅ **Source Maps:**
- Production builds include source maps for better debugging
- See actual TypeScript code in error stack traces

---

## 🛠️ Troubleshooting

### Problem: Errors not appearing in Sentry

**Solution:**
1. Check environment variables in Vercel
2. Verify DSN is correct (no trailing slashes)
3. Check Sentry project is active
4. Look at Vercel deployment logs for Sentry init messages

### Problem: Source maps not working

**Solution:**
1. Verify `SENTRY_AUTH_TOKEN` is set in Vercel
2. Check `SENTRY_ORG` and `SENTRY_PROJECT` match exactly
3. Ensure token has correct scopes
4. Redeploy after adding token

### Problem: Too many errors in production

**Solution:**
1. Adjust `tracesSampleRate` in config (currently 0.1 = 10%)
2. Add more errors to `ignoreErrors` array
3. Use Sentry's "Ignore" feature for known issues

---

## 📚 Additional Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Sentry Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)

---

## 🎉 You're Done!

Your production Sentry is now configured! Errors from your live site will be tracked separately from development errors.

**Next Steps:**
1. Set up alerts for production errors
2. Configure issue assignment rules
3. Integrate with Slack/Discord for notifications
4. Set up performance monitoring (optional)

---

**Need help viewing a specific error?**

Just share these details with me:
- Error message
- Stack trace
- Event ID or URL

And I'll help you debug it! 🚀

