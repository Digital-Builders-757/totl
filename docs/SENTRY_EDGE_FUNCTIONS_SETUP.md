# 🔧 Sentry for Supabase Edge Functions (Optional)

**Status:** Optional - Only needed if you want separate error tracking for Edge Functions

---

## 🎯 Why Add This?

Your Next.js app already tracks most errors. Add Sentry to Edge Functions if you want:
- Separate error tracking for serverless functions
- Better isolation of Edge Function-specific issues
- Performance monitoring for Edge Functions

---

## 📝 Setup Steps

### **1. Update Edge Function with Sentry**

Example for `supabase/functions/create-user/index.ts`:

```typescript
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as Sentry from "npm:@sentry/deno@^10.19.0";

// Initialize Sentry for Edge Functions
Sentry.init({
  dsn: Deno.env.get("SENTRY_DSN") || 
       "https://9f271197ad8ee6ef9c43094ffae46796@o4510191106654208.ingest.us.sentry.io/4510191108292609",
  environment: Deno.env.get("SENTRY_ENVIRONMENT") ?? "supabase-edge",
  tracesSampleRate: 0.1, // 10% sampling for performance
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Your existing function logic here
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ... rest of your function code ...

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Capture error in Sentry
    Sentry.captureException(error, {
      tags: {
        function: "create-user",
        environment: "supabase-edge",
      },
      extra: {
        method: req.method,
        url: req.url,
      },
    });
    
    // Re-throw or return error response
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
```

### **2. Add Environment Variables to Supabase**

In your Supabase dashboard:

1. Go to: **Project Settings → Edge Functions → Secrets**
2. Add:
   - `SENTRY_DSN` = `https://9f271197ad8ee6ef9c43094ffae46796@o4510191106654208.ingest.us.sentry.io/4510191108292609`
   - `SENTRY_ENVIRONMENT` = `supabase-edge` (or `development`/`production`)

### **3. Deploy Updated Function**

```bash
supabase functions deploy create-user
```

---

## ✅ What You Get

- ✅ Errors from Edge Functions appear in Sentry
- ✅ Tagged with `supabase-edge` environment
- ✅ Separate from Next.js app errors
- ✅ Performance traces for Edge Functions

---

## 🎯 When to Use This

**Use if:**
- You have complex Edge Functions with lots of logic
- You want to isolate Edge Function errors
- You need performance monitoring for Edge Functions

**Skip if:**
- Your Edge Functions are simple
- You're okay with errors being tracked in Next.js app
- You want to keep setup simple

---

**Note:** This is completely optional. Your Next.js app already tracks most errors, including those that might originate from Edge Function calls.












