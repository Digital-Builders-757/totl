# useSearchParams SSR Best Practices Guide

**Last Updated:** October 23, 2025  
**Category:** Development, Best Practices, Next.js  
**Related:** [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)

---

## 🚨 Critical Issue: SSR Errors with useSearchParams()

### The Problem

In Next.js 15 App Router, directly accessing `useSearchParams()` during component render can cause **Server-Side Rendering (SSR) errors** like:

```
ReferenceError: verified is not defined
ReferenceError: returnUrl is not defined
```

This happens because `useSearchParams()` is a **client-side only hook** that may not be available during server-side rendering or initial hydration.

---

## ❌ WRONG: Unsafe Patterns (DO NOT USE)

### Pattern 1: Direct Access During Render

```typescript
// ❌ BAD - Can cause SSR errors
export default function MyPage() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");  // ⚠️ May fail during SSR
  const verified = searchParams.get("verified") === "true";  // ⚠️ May fail during SSR
  
  return <div>Return URL: {returnUrl}</div>;
}
```

**Why this fails:**
- `searchParams` might be `null` during SSR
- Accessing `.get()` on `null` throws a ReferenceError
- Variables are undefined when used in JSX

### Pattern 2: Using in Conditional Render

```typescript
// ❌ BAD - verified is not defined during SSR
export default function LoginPage() {
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "true";
  
  return (
    <div>
      {verified && (  // ⚠️ ReferenceError during SSR
        <Alert>Email verified!</Alert>
      )}
    </div>
  );
}
```

---

## ✅ CORRECT: Safe Patterns (USE THESE)

### Solution 1: Optional Chaining with Nullish Coalescing (Simple Cases)

**Best for:** Simple read-only URL parameters that don't need reactive updates

```typescript
// ✅ GOOD - Safe for SSR
export default function MyPage() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get("returnUrl") ?? null;  // ✅ Safe
  const category = searchParams?.get("category") ?? "all";   // ✅ Safe with default
  
  return (
    <div>
      <Link href={returnUrl || "/"}>Back</Link>
      <h1>Category: {category}</h1>
    </div>
  );
}
```

**Key Points:**
- `?.` (optional chaining) prevents errors if `searchParams` is null
- `??` (nullish coalescing) provides safe default values
- Works for simple cases where you just need to read the param once

### Solution 2: useState + useEffect (Complex Cases)

**Best for:** Params that trigger side effects, toasts, or need reactive updates

```typescript
// ✅ GOOD - Safe for SSR with reactive updates
export default function LoginPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Initialize state with safe defaults
  const [verified, setVerified] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  
  // Extract params safely in useEffect (client-side only)
  useEffect(() => {
    if (searchParams) {
      const verifiedParam = searchParams.get("verified") === "true";
      const returnUrlParam = searchParams.get("returnUrl");
      
      setVerified(verifiedParam);
      setReturnUrl(returnUrlParam);
      
      // Side effects (like toasts) are safe here
      if (verifiedParam) {
        toast({
          title: "Email verified successfully!",
          description: "You can now log in to your account.",
        });
      }
    }
  }, [searchParams, toast]);
  
  return (
    <div>
      {verified && (  // ✅ Safe - verified is always defined
        <Alert>Email verified!</Alert>
      )}
      <Link href={returnUrl || "/"}>Back</Link>
    </div>
  );
}
```

**Key Points:**
- State variables have safe default values
- `useEffect` only runs on client-side after hydration
- Perfect for triggering side effects (toasts, analytics, etc.)
- Variables are always defined in JSX

---

## 📋 Decision Tree: Which Pattern to Use?

```
Do you need to trigger side effects (toasts, analytics, etc.)?
├─ YES → Use Solution 2 (useState + useEffect)
└─ NO → Do you need reactive updates when params change?
    ├─ YES → Use Solution 2 (useState + useEffect)
    └─ NO → Use Solution 1 (Optional Chaining)
```

---

## 🔧 Common Fixes Applied

### Fix 1: Login Page with Verification Toast

**Before:**
```typescript
const verified = searchParams.get("verified") === "true";

useEffect(() => {
  if (verified) {  // ⚠️ verified might be undefined
    toast({ title: "Verified!" });
  }
}, [verified, toast]);
```

**After:**
```typescript
const [verified, setVerified] = useState(false);

useEffect(() => {
  if (searchParams) {
    const verifiedParam = searchParams.get("verified") === "true";
    setVerified(verifiedParam);
    
    if (verifiedParam) {
      toast({ title: "Verified!" });
    }
  }
}, [searchParams, toast]);
```

### Fix 2: Simple Return URL

**Before:**
```typescript
const returnUrl = searchParams.get("returnUrl");

return <Link href={returnUrl || "/"}>Back</Link>;
```

**After:**
```typescript
const returnUrl = searchParams?.get("returnUrl") ?? null;

return <Link href={returnUrl || "/"}>Back</Link>;
```

---

## 🎯 Files Fixed in October 2025

The following files were updated to use safe patterns:

1. ✅ `app/login/page.tsx` - useState + useEffect for verified + toast
2. ✅ `app/talent/signup/page.tsx` - Optional chaining for returnUrl
3. ✅ `app/client/signup/page.tsx` - Optional chaining for returnUrl
4. ✅ `app/choose-role/page.tsx` - Optional chaining for returnUrl
5. ✅ `app/client/apply/page.tsx` - Optional chaining for returnUrl
6. ✅ `app/admin/gigs/success/page.tsx` - Optional chaining for gigId
7. ✅ `app/verification-pending/page.tsx` - Optional chaining for email + new param

---

## 🚀 Testing Checklist

After implementing fixes, verify:

- [ ] ✅ No SSR errors in terminal/console
- [ ] ✅ Page loads correctly on first visit
- [ ] ✅ URL parameters work as expected
- [ ] ✅ Toasts/side effects trigger correctly
- [ ] ✅ No Sentry errors for "is not defined"
- [ ] ✅ Works in all browsers (Safari, Chrome, Firefox, Electron)
- [ ] ✅ Hard refresh doesn't break the page

---

## 📚 Related Resources

- [Next.js useSearchParams Documentation](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [TOTL Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)

---

## 🔒 Code Review Checklist

When reviewing code that uses `useSearchParams()`:

- [ ] Is `?.` (optional chaining) used when accessing `.get()`?
- [ ] Are default values provided with `??` or `||`?
- [ ] If side effects exist, are they in `useEffect`?
- [ ] Are state variables initialized with safe defaults?
- [ ] Is `searchParams` checked for null/undefined before use?

---

## ⚠️ Common Mistakes to Avoid

1. **Don't** access `searchParams.get()` directly during render
2. **Don't** use searchParams values in conditional renders without safe defaults
3. **Don't** trigger side effects based on searchParams outside of useEffect
4. **Do** always use optional chaining (`?.`)
5. **Do** provide default values with nullish coalescing (`??`)
6. **Do** use useState + useEffect for complex scenarios

---

**Remember:** When in doubt, use Solution 2 (useState + useEffect) - it's the safest pattern and prevents all SSR issues!

