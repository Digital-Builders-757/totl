# Stripe Price IDs - Production Fix

**Issue:** `Error: No such price: 'price_1SXZFiL74RJvr6jHynEWFxaT'`

**Root Cause:** Production environment (Vercel) doesn't have the correct Stripe price IDs set, OR price IDs don't match the Stripe mode (test vs live).

---

## ✅ Correct Price IDs

**Monthly Subscription ($20/month):**
- Price ID: `price_1SXZFiL74RJvr6jHynEWFxaT`

**Yearly Subscription ($200/year):**
- Price ID: `price_1SXZFiL74RJvr6jH26OFzsvl`

---

## 🔧 Fix Steps

### **Step 1: Verify Stripe Mode**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Check if you're in **Test mode** or **Live mode** (toggle in top right)
3. **Important:** Price IDs are different for test vs live mode!

### **Step 2: Get Correct Price IDs**

**If in Live Mode:**
1. Go to Products → Your subscription product
2. Click on the Monthly price → Copy the **Live** price ID
3. Click on the Yearly price → Copy the **Live** price ID

**If price IDs don't match:**
- Test mode price IDs start with `price_` but are different from live mode
- You MUST use live mode price IDs in production

### **Step 3: Set Environment Variables in Vercel**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `totl` (or whatever your project name is)
3. Go to **Settings** → **Environment Variables**
4. Add/Update these variables for **Production** environment:

```
STRIPE_PRICE_TALENT_MONTHLY=price_1SXZFiL74RJvr6jHynEWFxaT
STRIPE_PRICE_TALENT_ANNUAL=price_1SXZFiL74RJvr6jH26OFzsvl
```

5. **Also verify these are set:**
   - `STRIPE_SECRET_KEY` (should be `sk_live_...` for production)
   - `STRIPE_WEBHOOK_SECRET` (should be `whsec_...` from live webhook)

6. Click **Save**

### **Step 4: Redeploy**

After updating environment variables:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger a new deployment

---

## 🔍 Verification Checklist

- [ ] Stripe Dashboard is in **Live mode**
- [ ] Price IDs match the **Live mode** prices (not test mode)
- [ ] Vercel Production environment has:
  - [ ] `STRIPE_PRICE_TALENT_MONTHLY=price_1SXZFiL74RJvr6jHynEWFxaT`
  - [ ] `STRIPE_PRICE_TALENT_ANNUAL=price_1SXZFiL74RJvr6jH26OFzsvl`
  - [ ] `STRIPE_SECRET_KEY=sk_live_...` (live key, not test)
  - [ ] `STRIPE_WEBHOOK_SECRET=whsec_...` (from live webhook)
- [ ] Redeployed after updating environment variables

---

## 🚨 Common Issues

### **Issue 1: Test Mode Price IDs in Production**
**Symptom:** "No such price" error  
**Fix:** Use **live mode** price IDs in Vercel production environment

### **Issue 2: Wrong Stripe Secret Key**
**Symptom:** Price exists but authentication fails  
**Fix:** Ensure `STRIPE_SECRET_KEY` is `sk_live_...` (not `sk_test_...`)

### **Issue 3: Environment Variables Not Set**
**Symptom:** Code throws error about missing env vars  
**Fix:** Add all required Stripe environment variables to Vercel

---

## 📝 Code Reference

The code correctly uses these environment variables:

**File:** `lib/stripe.ts`
```typescript
export const STRIPE_PRICES = {
  MONTHLY: process.env.STRIPE_PRICE_TALENT_MONTHLY!,
  ANNUAL: process.env.STRIPE_PRICE_TALENT_ANNUAL!,
} as const;
```

**File:** `app/talent/subscribe/actions.ts`
```typescript
const priceId = plan === 'monthly' ? STRIPE_PRICES.MONTHLY : STRIPE_PRICES.ANNUAL;
```

The code is correct - the issue is environment configuration!

---

## ✅ After Fix

Once environment variables are set correctly in Vercel:
1. Redeploy the application
2. Test subscription flow in production
3. Verify checkout session creates successfully
4. Check webhook receives events correctly

---

**Last Updated:** December 2, 2025


