# 🔍 Sentry Setup Guide - TOTL Agency

## 📋 Overview

You have **two Sentry projects** configured for different environments:

### Project 1: `javascript-nextjs` (Local Development)
- **Org:** `the-digital-builders-bi`
- **DSN:** `https://3b65d7c0706cdd0196906fa0d45c0731@o4510190992424960.ingest.us.sentry.io/4510191032926215`
- **Use:** Local development and testing
- **URL:** https://sentry.io/organizations/the-digital-builders-bi/projects/javascript-nextjs/

### Project 2: `sentry-yellow-notebook` (Vercel Production)
- **Org:** `the-digital-builders-bi`
- **Project:** `sentry-yellow-notebook`
- **Use:** Vercel deployments (production & preview)
- **URL:** https://sentry.io/organizations/the-digital-builders-bi/projects/sentry-yellow-notebook/

---

## ⚙️ Environment Configuration

### **For Vercel (Production/Preview)**

Add these environment variables in your Vercel project settings:

```bash
# Sentry Configuration
SENTRY_DSN=<YOUR_VERCEL_PROJECT_DSN>
NEXT_PUBLIC_SENTRY_DSN=<YOUR_VERCEL_PROJECT_DSN>
SENTRY_AUTH_TOKEN=<YOUR_SENTRY_AUTH_TOKEN>
SENTRY_ORG=the-digital-builders-bi
SENTRY_PROJECT=sentry-yellow-notebook
```

**To get your Vercel project DSN:**
1. Go to: https://sentry.io/organizations/the-digital-builders-bi/projects/sentry-yellow-notebook/
2. Click "Settings" → "Client Keys (DSN)"
3. Copy the DSN

**To get your Auth Token:**
1. Go to: https://sentry.io/settings/account/api/auth-tokens/
2. Create new token with scopes: `project:releases`, `org:read`
3. Copy the token

### **For Local Development**

Create `.env.local` in your project root:

```bash
# No Sentry env vars needed - uses hardcoded DSN for javascript-nextjs project
```

---

## 🎯 How It Works

### **Local Development** (`npm run dev`)
- Errors go to → `javascript-nextjs` project
- Environment tag: `development`
- 100% error tracking (tracesSampleRate: 1.0)
- Debug logs enabled
- Full stack traces

### **Vercel Preview** (PR deployments)
- Errors go to → `sentry-yellow-notebook` project
- Environment tag: `preview`
- 10% sampling (to save quota)
- Session replay enabled

### **Vercel Production** (main branch)
- Errors go to → `sentry-yellow-notebook` project
- Environment tag: `production`
- 10% sampling
- Session replay enabled
- Source maps uploaded

---

## 🔧 MCP Server Configuration

Your Cursor MCP is configured at: `c:\Users\young\.cursor\mcp.json`

```json
"sentry": {
  "command": "npx",
  "args": ["-y", "@sentry/mcp-server"],
  "env": {
    "SENTRY_AUTH_TOKEN": "YOUR_SENTRY_AUTH_TOKEN_HERE",
    "SENTRY_ORG": "the-digital-builders-bi"
  }
}
```

**To complete MCP setup:**
1. Get your auth token (see above)
2. Replace `YOUR_SENTRY_AUTH_TOKEN_HERE` in the mcp.json file
3. Restart Cursor
4. Type `/mcp` in chat to verify connection

**Test queries:**
```
"Show me the latest errors from sentry-yellow-notebook project"
"What's the error rate for javascript-nextjs project today?"
"Get details for Sentry issue #12345"
"Show me all unresolved 500 errors"
```

---

## 🚀 Testing Sentry Integration

### **Test in Local Development:**

Add this test route: `app/test-sentry/page.tsx`

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';

export default function TestSentry() {
  return (
    <div className="p-8">
      <h1>Test Sentry Integration</h1>
      <button
        onClick={() => {
          throw new Error('Test error from TOTL Agency!');
        }}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Throw Test Error
      </button>
      <button
        onClick={() => {
          Sentry.captureMessage('Test message from TOTL!');
          alert('Message sent to Sentry');
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded ml-4"
      >
        Send Test Message
      </button>
    </div>
  );
}
```

**Test steps:**
1. Run `npm run dev`
2. Visit `http://localhost:3000/test-sentry`
3. Click "Throw Test Error"
4. Check https://sentry.io/organizations/the-digital-builders-bi/projects/javascript-nextjs/
5. You should see the error!

### **Test in Production:**
1. Deploy to Vercel
2. Visit `/test-sentry` on your live site
3. Click "Throw Test Error"
4. Check https://sentry.io/organizations/the-digital-builders-bi/projects/sentry-yellow-notebook/

---

## 📊 What Gets Tracked

### **Automatically Captured:**
- ✅ Unhandled exceptions
- ✅ Promise rejections
- ✅ Console errors
- ✅ API route errors
- ✅ Server component errors
- ✅ Middleware errors
- ✅ Performance metrics
- ✅ User sessions (production only)

### **Filtered Out:**
- ❌ Browser extension errors
- ❌ Network request failures
- ❌ Next.js navigation redirects
- ❌ 404 errors

---

## 🎨 Custom Error Tracking

### **Capture specific errors:**
```typescript
import * as Sentry from '@sentry/nextjs';

try {
  await submitApplication();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: 'application-submission',
      gigId: gigId,
    },
    level: 'error',
  });
}
```

### **Add user context:**
```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.display_name,
  role: user.role, // talent/client/admin
});
```

### **Add breadcrumbs:**
```typescript
Sentry.addBreadcrumb({
  category: 'application',
  message: 'User started application form',
  level: 'info',
});
```

---

## 📈 Monitoring Application Errors

### **Track the 406 error we just fixed:**

In `app/gigs/[id]/apply/actions.ts`, add Sentry tracking:

```typescript
if (insertError) {
  console.error("Application insert error:", insertError);
  
  // Track in Sentry
  Sentry.captureException(insertError, {
    tags: {
      feature: 'application-submission',
      gigId: gigId,
    },
    extra: {
      talentId: user.id,
      errorCode: insertError.code,
      errorDetails: insertError.details,
    },
  });
  
  return { error: "Failed to submit application. Please try again." };
}
```

---

## 🔐 Security Best Practices

1. **Never commit DSNs or tokens to git**
   - They're safe in config files (already gitignored)
   - Use environment variables in Vercel

2. **Use least-privilege tokens**
   - Only grant necessary scopes
   - Rotate tokens periodically

3. **Filter sensitive data**
   - PII filtering is enabled
   - Sensitive fields are masked
   - Consider beforeSend hooks for extra filtering

4. **Monitor your quota**
   - Sentry has event limits per plan
   - We're using 10% sampling in production
   - Adjust tracesSampleRate if needed

---

## 📚 Resources

- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **MCP Server:** https://github.com/getsentry/sentry-mcp
- **javascript-nextjs Project:** https://sentry.io/organizations/the-digital-builders-bi/projects/javascript-nextjs/
- **sentry-yellow-notebook Project:** https://sentry.io/organizations/the-digital-builders-bi/projects/sentry-yellow-notebook/

---

## ✅ Setup Checklist

- [x] Sentry SDK installed (`@sentry/nextjs`)
- [x] Config files created (client, server, edge)
- [x] Environment-based DSN switching configured
- [x] next.config.mjs updated with correct org/project
- [x] MCP server added to Cursor
- [ ] Get Sentry auth token
- [ ] Update MCP config with auth token
- [ ] Get Vercel project DSN
- [ ] Add Vercel environment variables
- [ ] Test local error tracking
- [ ] Test production error tracking
- [ ] Deploy to Vercel
- [ ] Verify MCP connection in Cursor

**You're almost done!** Just need to add the auth tokens and DSNs. 🎉






