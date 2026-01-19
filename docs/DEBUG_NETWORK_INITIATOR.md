# Debugging Network Request Initiator

**Date:** January 20, 2025  
**Purpose:** Quick guide to find the exact code triggering Supabase REST API requests

---

## Quick Check: Network Tab Initiator Column

When you see a failing request to `https://<project>.supabase.co/rest/v1/applications?...` with "No API key found":

### Step 1: Open DevTools → Network Tab

1. Navigate to `/gigs/[id]/apply`
2. Open Chrome DevTools (F12)
3. Go to **Network** tab
4. Filter by `rest/v1/applications` or `applications`

### Step 2: Click the Failing Request

Click on the request that's failing with "No API key found"

### Step 3: Check Request Headers

In the **Headers** tab, look for:

- ✅ **`apikey` header present** → Request is going through supabase-js correctly
- ❌ **`apikey` header missing** → Request is NOT using supabase-js (direct fetch/redirect)

### Step 4: Check Initiator Column

Look at the **Initiator** column (right side of Network tab):

#### **Scenario A: Shows JS File + Line Number**
```
Initiator: apply-to-gig-form.tsx:59
```

**Meaning:** Code in that file triggered the request.

**Action:**
1. Click the file name → DevTools opens Sources tab
2. Check the exact line (e.g., line 59)
3. Verify it's using `supabase.from('applications')` not `fetch()`
4. If it's `fetch()`, replace with `supabase.from(...)`

#### **Scenario B: Shows "Document" or "Other"**
```
Initiator: Document
Initiator: Other
```

**Meaning:** Browser navigated to that URL (link click, `window.location`, preload, etc.)

**Action:**
1. Check for hardcoded URLs in code:
   ```typescript
   // ❌ BAD - Direct URL navigation
   window.location.href = `${SUPABASE_URL}/rest/v1/applications?...`;
   ```
2. Check for `<a>` tags or `<Link>` components pointing to Supabase URLs
3. Replace with proper `supabase.from('applications')` query

#### **Scenario C: Shows "fetch" or "XMLHttpRequest"**
```
Initiator: fetch
Initiator: XMLHttpRequest
```

**Meaning:** Direct `fetch()` call somewhere in code.

**Action:**
1. Use "Search in files" to find `fetch.*supabase` or `fetch.*rest/v1`
2. Replace with `supabase.from(...)` query

---

## Common Patterns to Search For

### Pattern 1: Direct fetch() calls
```bash
# Search for direct fetch calls
grep -r "fetch.*supabase" --include="*.ts" --include="*.tsx"
grep -r "fetch.*rest/v1" --include="*.ts" --include="*.tsx"
```

### Pattern 2: Hardcoded Supabase URLs
```bash
# Search for hardcoded URLs
grep -r "supabase.co/rest" --include="*.ts" --include="*.tsx"
grep -r "NEXT_PUBLIC_SUPABASE_URL.*rest" --include="*.ts" --include="*.tsx"
```

### Pattern 3: Window location redirects
```bash
# Search for window.location redirects
grep -r "window.location.*supabase" --include="*.ts" --include="*.tsx"
```

---

## Expected Behavior After Fix

### ✅ Correct Request (Using supabase-js)
```
Request URL: https://<project>.supabase.co/rest/v1/applications?select=id&gig_id=eq...
Request Headers:
  apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Initiator: apply-to-gig-form.tsx:59 (supabase.from call)
```

### ❌ Incorrect Request (Missing headers)
```
Request URL: https://<project>.supabase.co/rest/v1/applications?select=id&gig_id=eq...
Request Headers:
  (no apikey header)
  (no authorization header)
Initiator: Document / Other / fetch
```

---

## Quick Answer Format

When debugging, answer this:

**"Does the Initiator column show a JS file + line number, or does it say 'Document/Other'?"**

- **JS file + line** → Code bug (find that line, replace with `supabase.from(...)`)
- **Document/Other** → Navigation/redirect bug (find hardcoded URL, replace with query)
- **fetch/XMLHttpRequest** → Direct fetch call (find and replace)

---

## Related Documentation

- `docs/SUPABASE_API_KEY_FIX.md` - Complete fix documentation
- `docs/TROUBLESHOOTING_GUIDE.md` - General troubleshooting
