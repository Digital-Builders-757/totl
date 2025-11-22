# 🚀 TOTL Agency - Stripe Implementation Plan

**Created:** November 21, 2025  
**Goal:** Complete Stripe subscription integration in one work session  
**Status:** Ready to Execute

---

## 📋 Complete Implementation Checklist

### **🎯 PHASE 1: Stripe Setup (YOU DO THIS FIRST)**

**⏰ Time Estimate:** 10-15 minutes

#### **Step 1.1: Create Stripe Product & Prices**
- [ ] Go to [Stripe Dashboard](https://dashboard.stripe.com) → Products
- [ ] Click "Add product"
  - Name: `TOTL Talent Subscription`
  - Description: `Monthly or annual subscription for talent users to access premium features`
- [ ] Add Monthly Price:
  - Amount: `$20.00`
  - Billing: `Monthly`
  - **📝 Copy the price ID** (starts with `price_`)
- [ ] Add Annual Price:
  - Amount: `$200.00` 
  - Billing: `Yearly`
  - **📝 Copy the price ID** (starts with `price_`)

#### **Step 1.2: Get API Keys**
- [ ] Go to Developers → API Keys
- [ ] **📝 Copy Secret Key** (starts with `sk_test_` or `sk_live_`)

#### **Step 1.3: Create Webhook Endpoint**
- [ ] Go to Developers → Webhooks
- [ ] Click "Add endpoint"
- [ ] Endpoint URL: `https://your-domain.com/api/stripe/webhook` (we'll update this after deployment)
- [ ] Select these events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated` 
  - `customer.subscription.deleted`
- [ ] **📝 Copy Webhook Secret** (starts with `whsec_`)

#### **Step 1.4: Add Environment Variables**
Add to your `.env.local`:
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_TALENT_MONTHLY=price_your_monthly_price_id
STRIPE_PRICE_TALENT_ANNUAL=price_your_annual_price_id

# App URL (update for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**✅ CHECKPOINT:** Tell me when Step 1 is complete with your price IDs and I'll start the implementation.

---

### **🔧 PHASE 2: Database Schema (AI IMPLEMENTS)**

**⏰ Time Estimate:** 5 minutes

#### **Step 2.1: Create Migration**
- [ ] Create new migration file with subscription enum and profile columns
- [ ] Update `database_schema_audit.md` (single source of truth)
- [ ] Run migration: `supabase db push`

#### **Step 2.2: Regenerate Types**
- [ ] Run: `npm run types:regen`
- [ ] Verify: `npm run build`

---

### **🛠️ PHASE 3: Backend Implementation (AI IMPLEMENTS)**

**⏰ Time Estimate:** 20 minutes

#### **Step 3.1: Core Utilities**
- [ ] Create `lib/stripe.ts` - Stripe client configuration
- [ ] Create `lib/subscription.ts` - Subscription helper functions

#### **Step 3.2: Server Actions**
- [ ] Create `app/talent/subscribe/actions.ts` - Checkout session creation
- [ ] Create `app/talent/settings/billing/actions.ts` - Billing portal

#### **Step 3.3: Webhook Handler**
- [ ] Create `app/api/stripe/webhook/route.ts` - Process Stripe events
- [ ] Handle subscription status updates
- [ ] Update profile subscription data

#### **Step 3.4: Access Control**
- [ ] Create `lib/gig-access.ts` - Gig visibility helpers
- [ ] Update application actions with subscription guards

---

### **🎨 PHASE 4: Frontend Implementation (AI IMPLEMENTS)**

**⏰ Time Estimate:** 25 minutes

#### **Step 4.1: Subscription Pages**
- [ ] Create `app/talent/subscribe/page.tsx` - Plan selection
- [ ] Create `app/talent/subscribe/subscription-plans.tsx` - Plan cards
- [ ] Create `app/talent/subscribe/success/page.tsx` - Success page
- [ ] Create `app/talent/subscribe/cancelled/page.tsx` - Cancel page

#### **Step 4.2: Billing Management**
- [ ] Create `app/talent/settings/billing/page.tsx` - Billing settings
- [ ] Create billing settings component with portal access

#### **Step 4.3: Access Control Integration**
- [ ] Update gig listing components for obfuscation
- [ ] Update gig detail pages for subscription checks
- [ ] Add subscription prompts and banners

#### **Step 4.4: Navigation Updates**
- [ ] Add "Billing" to talent settings navigation
- [ ] Add subscription status indicators

---

### **🧪 PHASE 5: Testing & Integration (BOTH TEST)**

**⏰ Time Estimate:** 15 minutes

#### **Step 5.1: Local Testing**
- [ ] Test subscription flow with Stripe test cards
- [ ] Test webhook events (use Stripe CLI for local testing)
- [ ] Test access control (gig visibility, application blocking)
- [ ] Test billing portal access

#### **Step 5.2: Edge Case Testing**
- [ ] Test with expired subscription
- [ ] Test with failed payment
- [ ] Test subscription cancellation
- [ ] Test user without subscription

---

### **🚀 PHASE 6: Deployment (YOU DO THIS)**

**⏰ Time Estimate:** 10 minutes

#### **Step 6.1: Deploy to Production**
- [ ] Push code to your repository
- [ ] Deploy to Vercel/your hosting platform
- [ ] Add production environment variables to hosting platform

#### **Step 6.2: Update Stripe Webhook**
- [ ] Go back to Stripe Dashboard → Webhooks
- [ ] Update endpoint URL to production: `https://your-domain.com/api/stripe/webhook`
- [ ] Test webhook delivery

#### **Step 6.3: Final Production Test**
- [ ] Test complete subscription flow in production
- [ ] Verify webhook events are received
- [ ] Test billing portal in production

---

## 🎯 Success Criteria

By the end of this session, we should have:

✅ **Complete subscription system:**
- Talent can subscribe (monthly/annual)
- Subscription status controls gig access
- Billing portal for subscription management

✅ **Access control working:**
- Non-subscribers see obfuscated gig details
- Only subscribers can apply to gigs
- Subscription prompts guide users

✅ **Webhook integration:**
- Stripe events update database
- Subscription status changes reflected immediately

✅ **Production ready:**
- All code deployed and tested
- Webhook configured and working
- Ready for real payments

---

## 🚨 Critical Reminders

### **For Database Changes:**
1. **ALWAYS** update `database_schema_audit.md` FIRST
2. Use migration files (never manual schema changes)
3. Regenerate types after schema changes
4. Test build after type regeneration

### **For Stripe Integration:**
1. **NEVER** expose secret keys to client code
2. **ALWAYS** verify webhook signatures
3. Use test mode until fully tested
4. Handle all subscription states (active, past_due, canceled)

### **For TOTL Architecture:**
1. Follow existing auth patterns [[memory:6243514]]
2. Use `createSupabaseServer()` for server components
3. Use `createSupabaseAdminClient()` for webhooks
4. Follow RLS patterns for data access
5. Use PowerShell-compatible commands [[memory:6018148]]

---

## 📞 Communication Protocol

### **When You Complete Stripe Setup (Phase 1):**
Send me:
```
✅ Stripe setup complete!
Monthly Price ID: price_xxxxx
Annual Price ID: price_xxxxx
Secret Key: sk_test_xxxxx (first 20 chars)
Webhook Secret: whsec_xxxxx (first 20 chars)
```

### **When I Complete Each Phase:**
I'll update you with:
- ✅ Phase X complete
- 🧪 Ready for testing
- 🚨 Any issues found
- ➡️ Next steps

### **When We Need to Test:**
I'll tell you:
- 🧪 "Ready to test [specific feature]"
- 📝 Specific test steps to follow
- ✅ Expected results

---

## 🎯 Let's Start!

**Ready to begin?** 

1. **First:** Complete Phase 1 (Stripe setup) and send me your price IDs
2. **Then:** I'll implement Phases 2-4 while you watch
3. **Finally:** We'll test together and deploy

This plan is designed to get us from zero to fully working Stripe subscriptions in one focused session. Let's do this! 🚀
