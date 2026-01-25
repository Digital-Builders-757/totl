# 💳 TOTL Agency - Talent Subscription & Stripe Integration PRD

**Created:** November 21, 2025  
**Status:** Ready for Implementation  
**Version:** 1.0 (Custom for TOTL Agency)

## 🎯 Goal & Context

TOTL Agency currently has a complete talent booking platform with:
- ✅ Supabase Auth with role-based access (talent/client/admin)
- ✅ Complete database schema with RLS policies
- ✅ Talent profiles, client profiles, gigs, applications, bookings
- ✅ Portfolio system with image uploads
- ✅ Email notifications and client applications
- ❌ **Missing:** Payment system for talent subscriptions

**Goal:** Implement Stripe subscriptions for talent users to unlock premium features.

---

## 📋 Product Requirements

### 2.1 Subscription Plans

**Monthly Plan:** $20/month  
**Annual Plan:** $200/year (17% discount)

**Stripe Configuration:**
- 1x Product: `totl_talent_subscription`
- 2x Prices: `price_monthly` and `price_annual`

### 2.2 User Access Levels

#### **1. Guest (Unauthenticated)**
- ✅ Can browse gigs with **obfuscated client details**
- ✅ Gig titles show generic labels: "Commercial for Major Brand" instead of "Nike Commercial"
- ❌ Cannot apply to gigs
- ✅ Can sign up as talent

#### **2. Talent - Registered, No Subscription**
- ✅ Has Supabase auth + profiles + talent_profiles
- ✅ Can log in and see limited dashboard
- ✅ Can view gigs with **obfuscated client details**
- ❌ Cannot apply to gigs
- ❌ Profile not visible in client searches
- ✅ Sees subscription prompt: "Subscribe to apply to gigs and unlock full access"

#### **3. Talent - Active Subscriber**
- ✅ `subscription_status = 'active'`
- ✅ Can see **full gig details** including real client names
- ✅ Can apply to gigs
- ✅ Profile visible in client talent searches
- ✅ Access to "Manage Subscription" (Stripe Billing Portal)

#### **4. Talent - Expired/Canceled Subscription**
- ✅ `subscription_status = 'past_due' | 'canceled'`
- ✅ Reverts to "No Subscription" behavior
- ✅ Persistent banner: "Your subscription has ended. Restart to unlock full access."

---

## 🗄️ Database Schema Changes

### 4.1 New Enum: `subscription_status`

```sql
CREATE TYPE public.subscription_status AS ENUM (
  'none',         -- never subscribed
  'active',       -- current paid subscription
  'past_due',     -- payment issues, limited access
  'canceled'      -- canceled / expired
);
```

### 4.2 Extend `profiles` Table

**Rationale:** Keep subscription data with user profiles for simple access control.

```sql
ALTER TABLE public.profiles
ADD COLUMN subscription_status subscription_status NOT NULL DEFAULT 'none',
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN subscription_plan TEXT,                -- 'monthly' | 'annual'
ADD COLUMN subscription_current_period_end TIMESTAMPTZ;
```

### 4.3 RLS Policy Updates

Existing RLS policies on `profiles` already allow:
- ✅ Users can update their own profile
- ✅ Public can view profiles (application-level controls restrict sensitive data)

**New requirement:** Only server-side code should modify `stripe_*` and subscription fields.

---

## 🔧 Implementation Architecture

### 5.1 Environment Variables

Add to `.env.local` and Vercel:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_TALENT_MONTHLY=price_...
STRIPE_PRICE_TALENT_ANNUAL=price_...

# App Configuration
NEXT_PUBLIC_APP_URL=https://totlagency.com
```

### 5.2 Stripe Utility

Create `lib/stripe.ts`:

```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});
```

### 5.3 Subscription Helper

Create `lib/subscription.ts`:

```typescript
import type { Database } from "@/types/supabase";

type Profile = Database['public']['Tables']['profiles']['Row'];

export function isActiveSubscriber(profile: Profile | null): boolean {
  return profile?.subscription_status === 'active';
}

export function needsSubscription(profile: Profile | null): boolean {
  return !profile || profile.subscription_status === 'none' || profile.subscription_status === 'canceled';
}
```

---

## 🚀 Backend Implementation

### 6.1 Server Action: Create Checkout Session

**File:** `app/talent/subscribe/actions.ts`

```typescript
"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import { stripe } from "@/lib/stripe";

export async function createTalentCheckoutSession(plan: 'monthly' | 'annual') {
  const supabase = await createSupabaseServer();
  
  // 1. Require authenticated talent user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    redirect('/login');
  }

  // 2. Get profile and verify role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'talent') {
    throw new Error('Only talent users can subscribe');
  }

  // 3. Create or get Stripe customer
  let customerId = profile.stripe_customer_id;
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: {
        supabase_user_id: user.id,
      },
    });
    
    customerId = customer.id;
    
    // Update profile with customer ID (using admin client)
    const adminSupabase = createSupabaseAdminClient();
    await adminSupabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  // 4. Create checkout session
  const priceId = plan === 'monthly' 
    ? process.env.STRIPE_PRICE_TALENT_MONTHLY!
    : process.env.STRIPE_PRICE_TALENT_ANNUAL!;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/talent/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/talent/subscribe/cancelled`,
    metadata: {
      supabase_user_id: user.id,
    },
  });

  redirect(session.url!);
}
```

### 6.2 Server Action: Create Billing Portal Session

**File:** `app/talent/settings/billing/actions.ts`

```typescript
"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { stripe } from "@/lib/stripe";

export async function createBillingPortalSession() {
  const supabase = await createSupabaseServer();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    throw new Error('No Stripe customer found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/talent/settings/billing`,
  });

  redirect(session.url);
}
```

### 6.3 Webhook Handler

**File:** `app/api/stripe/webhook/route.ts`

```typescript
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer?.id;

        // Find user by customer ID
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (!profile) {
          console.error("No profile found for customer:", customerId);
          break;
        }

        // Map Stripe status to our enum
        let subscriptionStatus: 'active' | 'past_due' | 'canceled';
        if (['active', 'trialing'].includes(subscription.status)) {
          subscriptionStatus = 'active';
        } else if (subscription.status === 'past_due') {
          subscriptionStatus = 'past_due';
        } else {
          subscriptionStatus = 'canceled';
        }

        // Determine plan from price ID
        const priceId = subscription.items.data[0]?.price.id;
        let plan = 'monthly';
        if (priceId === process.env.STRIPE_PRICE_TALENT_ANNUAL) {
          plan = 'annual';
        }

        // Update profile
        await supabase
          .from("profiles")
          .update({
            subscription_status: subscriptionStatus,
            stripe_subscription_id: subscription.id,
            subscription_plan: plan,
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("id", profile.id);

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer?.id;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              subscription_status: 'canceled',
              stripe_subscription_id: null,
            })
            .eq("id", profile.id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
```

---

## 🎨 Frontend Implementation

### 7.1 Plan Selection Page

**Route:** `/talent/subscribe`

```typescript
// app/talent/subscribe/page.tsx
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { redirect } from "next/navigation";
import { SubscriptionPlans } from "./subscription-plans";

export default async function SubscribePage() {
  const supabase = await createSupabaseServer();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'talent') {
    redirect('/talent/dashboard');
  }

  // If already subscribed, redirect to billing
  if (profile.subscription_status === 'active') {
    redirect('/talent/settings/billing');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Choose Your Plan
        </h1>
        <p className="text-center text-muted-foreground mb-12">
          Subscribe to apply to gigs and unlock full access to TOTL Agency
        </p>
        <SubscriptionPlans />
      </div>
    </div>
  );
}
```

### 7.2 Subscription Plans Component

```typescript
// app/talent/subscribe/subscription-plans.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { createTalentCheckoutSession } from "./actions";

export function SubscriptionPlans() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Monthly Plan */}
      <Card className="relative">
        <CardHeader>
          <CardTitle>Monthly</CardTitle>
          <CardDescription>Perfect for trying out the platform</CardDescription>
          <div className="text-3xl font-bold">$20<span className="text-lg font-normal">/month</span></div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Apply to unlimited gigs
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              See full client details
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Profile visible to clients
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Priority support
            </li>
          </ul>
          <form action={createTalentCheckoutSession.bind(null, 'monthly')}>
            <Button type="submit" className="w-full">
              Start Monthly Plan
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Annual Plan */}
      <Card className="relative border-primary">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
            Best Value
          </span>
        </div>
        <CardHeader>
          <CardTitle>Annual</CardTitle>
          <CardDescription>Save 17% with annual billing</CardDescription>
          <div className="text-3xl font-bold">$200<span className="text-lg font-normal">/year</span></div>
          <div className="text-sm text-muted-foreground">
            <s>$240/year</s> Save $40
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Apply to unlimited gigs
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              See full client details
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Profile visible to clients
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Priority support
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <strong>Save $40 per year</strong>
            </li>
          </ul>
          <form action={createTalentCheckoutSession.bind(null, 'annual')}>
            <Button type="submit" className="w-full">
              Start Annual Plan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 7.3 Success & Cancel Pages

```typescript
// app/talent/subscribe/success/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

export default function SubscriptionSuccessPage() {
  return (
    <div className="container mx-auto py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Welcome to TOTL Agency!</CardTitle>
            <CardDescription>
              Your subscription is now active. You can now apply to gigs and access all premium features.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="w-full">
              <Link href="/talent/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### 7.4 Billing Settings Page

```typescript
// app/talent/settings/billing/page.tsx
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { redirect } from "next/navigation";
import { BillingSettings } from "./billing-settings";

export default async function BillingPage() {
  const supabase = await createSupabaseServer();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, subscription_status, subscription_plan, subscription_current_period_end")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'talent') {
    redirect('/talent/dashboard');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Billing Settings</h1>
        <BillingSettings profile={profile} />
      </div>
    </div>
  );
}
```

---

## 🔒 Access Control Integration

### 8.1 Gig Access Control

Update gig components to respect subscription status:

```typescript
// lib/gig-access.ts
import type { Database } from "@/types/supabase";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Gig = Database['public']['Tables']['gigs']['Row'];

export function getGigDisplayTitle(gig: Gig, profile: Profile | null): string {
  // Show full title to active subscribers
  if (profile?.subscription_status === 'active') {
    return gig.title;
  }
  
  // Obfuscate for non-subscribers
  return `${gig.category} for Major Brand`;
}

export function canApplyToGig(profile: Profile | null): boolean {
  return profile?.subscription_status === 'active';
}

export function canSeeClientDetails(profile: Profile | null): boolean {
  return profile?.subscription_status === 'active';
}
```

### 8.2 Application Creation Guard

Update application server action:

```typescript
// lib/actions/application-actions.ts
export async function createApplication(gigId: string, message: string) {
  const supabase = await createSupabaseServer();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check subscription status
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'talent') {
    throw new Error('Only talent can apply to gigs');
  }

  if (profile.subscription_status !== 'active') {
    throw new Error('Active subscription required to apply to gigs');
  }

  // Proceed with application creation...
}
```

---

## 📋 Implementation Task List

### **Phase 1: Database & Environment Setup**
1. ✅ **Create Stripe account** (You do this)
2. ✅ **Create product + 2 prices in Stripe dashboard** (You do this)
3. ✅ **Add environment variables** (You do this)
4. 🔧 **Create database migration** (AI implements)
5. 🔧 **Run migration and regenerate types** (AI implements)

### **Phase 2: Backend Implementation**
6. 🔧 **Create `lib/stripe.ts`** (AI implements)
7. 🔧 **Create `lib/subscription.ts` helpers** (AI implements)
8. 🔧 **Implement checkout session server action** (AI implements)
9. 🔧 **Implement billing portal server action** (AI implements)
10. 🔧 **Implement webhook handler** (AI implements)

### **Phase 3: Frontend Implementation**
11. 🔧 **Create subscription plans page** (AI implements)
12. 🔧 **Create success/cancel pages** (AI implements)
13. 🔧 **Create billing settings page** (AI implements)
14. 🔧 **Update gig access control** (AI implements)
15. 🔧 **Add subscription guards to applications** (AI implements)

### **Phase 4: Integration & Polish**
16. 🔧 **Add subscription banners/prompts** (AI implements)
17. 🔧 **Update navigation for billing** (AI implements)
18. 🔧 **Test complete flow** (Both test)
19. 🔧 **Deploy and configure webhook URL** (You do this)

---

## 🎯 Stripe Tasks for You

**When I say "Go to Stripe", do these steps:**

### **Step 1: Create Product**
1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. Name: `TOTL Talent Subscription`
4. Description: `Monthly or annual subscription for talent users to access premium features`

### **Step 2: Create Prices**
1. In the product, click "Add another price"
2. **Monthly Price:**
   - Amount: $20.00
   - Billing period: Monthly
   - Copy the price ID (starts with `price_`)
3. **Annual Price:**
   - Amount: $200.00
   - Billing period: Yearly
   - Copy the price ID (starts with `price_`)

### **Step 3: Get Environment Variables**
1. Go to Developers → API Keys
2. Copy your **Secret key** (starts with `sk_`)
3. Go to Developers → Webhooks
4. Click "Add endpoint"
5. URL: `https://your-domain.com/api/stripe/webhook`
6. Events: Select `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
7. Copy the **Webhook secret** (starts with `whsec_`)

### **Step 4: Add to Environment**
Add these to your `.env.local`:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_TALENT_MONTHLY=price_...
STRIPE_PRICE_TALENT_ANNUAL=price_...
```

---

## 🚨 Critical Success Factors

1. **Database Schema First:** Always update `database_schema_audit.md` before migration
2. **Use Existing Patterns:** Follow your current auth and RLS patterns
3. **Server-Only Stripe:** Never expose Stripe secret keys to client
4. **Webhook Security:** Always verify webhook signatures
5. **Graceful Degradation:** Handle missing subscriptions gracefully
6. **Test Edge Cases:** Test with expired/canceled subscriptions

---

This PRD is specifically designed for your TOTL Agency setup and follows all your existing patterns. Ready to implement when you give the go-ahead!
