# 🚀 Quick Vercel Sentry Setup (5 Minutes)

**Production Sentry is ready! Follow these steps to enable it on Vercel.**

---

## ✅ Step 1: Add Environment Variables to Vercel

1. Go to your Vercel project: https://vercel.com/your-org/totl
2. Click **Settings** → **Environment Variables**
3. Add these **THREE** variables (select **Production** only):

### Variable 1: NEXT_PUBLIC_SENTRY_DSN_PROD
```
NEXT_PUBLIC_SENTRY_DSN_PROD
```
**Value:**
```
https://9f271197ad8ee6ef9c43094ffae46796@o4510191106654208.ingest.us.sentry.io/4510191108292609
```
**Environment:** ✅ Production only

---

### Variable 2: SENTRY_DSN_PROD
```
SENTRY_DSN_PROD
```
**Value:**
```
https://9f271197ad8ee6ef9c43094ffae46796@o4510191106654208.ingest.us.sentry.io/4510191108292609
```
**Environment:** ✅ Production only

---

### Variable 3: SENTRY_AUTH_TOKEN (Optional - for source maps)
```
SENTRY_AUTH_TOKEN
```
**Value:** `your_sentry_auth_token_here`
**Environment:** ✅ Production only

**To get this token:**
1. Go to: https://sentry.io/settings/account/api/auth-tokens/
2. Click **Create New Token**
3. Name: `TOTL Production`
4. Scopes: `project:releases`, `project:write`, `org:read`
5. Copy the token

---

## ✅ Step 2: Redeploy

After adding the variables:
1. Go to **Deployments** tab
2. Click the **...** menu on your latest production deployment
3. Click **Redeploy**
4. Wait for deployment to complete

---

## ✅ Step 3: Verify It's Working

### Check Sentry Dashboard:
1. Go to: https://the-digital-builders-bi.sentry.io/issues/
2. Trigger an error on your live site (or wait for a real one)
3. Check if the error appears in Sentry

### Manual Test (Optional):
Create a test page that throws an error:
```typescript
// app/test-sentry/page.tsx
export default function TestSentry() {
  const causeError = () => {
    throw new Error("Production Sentry Test Error");
  };
  
  return (
    <button onClick={causeError}>
      Test Sentry
    </button>
  );
}
```

Visit `/test-sentry` on your production site and click the button.

---

## 📊 What You Get

✅ **Separate Error Tracking:**
- Production errors → Production Sentry project
- Development errors → Development Sentry project

✅ **Better Organization:**
- Clear separation between environments
- No dev errors cluttering production dashboard

✅ **Source Maps (if auth token is configured):**
- See actual TypeScript code in stack traces
- Faster debugging

---

## 🔍 View Current Sentry Error

To view the error you mentioned earlier:

1. Go to: https://the-digital-builders-bi.sentry.io/issues/6952482257/
2. Click on the latest event
3. Look at the stack trace
4. Share the error message and stack trace with me

---

## ❓ Need Help?

**Can't access Sentry?**
- Check you're logged into the correct organization
- Request access from your team admin

**Variables not working?**
- Double-check they're set for **Production** environment
- Verify DSN has no extra spaces or characters
- Redeploy after adding variables

**Still seeing errors in wrong project?**
- Check `NEXT_PUBLIC_VERCEL_ENV` is set to "production" in Vercel
- Clear deployment cache and redeploy

---

**You're all set!** 🎉

Your production Sentry is now configured. Errors from your live site will be tracked in the production Sentry project.

