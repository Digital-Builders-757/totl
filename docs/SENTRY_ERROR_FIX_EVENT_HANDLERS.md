# Sentry Error Fix: Event Handlers in Client Components

**Date:** October 21, 2025  
**Error:** `Event handlers cannot be passed to Client Component props`  
**Status:** ✅ Fixed

## Problem

Sentry reported an error where event handlers (like `onContactClick`) were being passed to Client Components. The error referenced props that no longer existed in the codebase:
- `onContactClick`
- `enableTilt`
- `enableMobileTilt`
- `showUserInfo`
- `contactText`

## Root Cause

This was a **cache issue** from an old background effect that was previously added to the hero section. The old component code was removed from the source files, but remained in:
1. Next.js build cache (`.next/` directory)
2. Node modules cache (`node_modules/.cache/`)
3. Browser cache

## Solution

### 1. Cleared All Caches
```powershell
# Stop Node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Remove .next directory
Remove-Item -Recurse -Force ".next"

# Remove node_modules cache
Remove-Item -Recurse -Force "node_modules/.cache"
```

### 2. Prevention Guidelines

**Never pass event handlers to Client Components from Server Components:**

❌ **Wrong:**
```tsx
// app/page.tsx (Server Component)
export default async function Page() {
  const handleClick = () => console.log("clicked"); // Server function
  
  return <ClientCard onClick={handleClick} />; // ❌ Can't serialize functions!
}
```

✅ **Correct:**
```tsx
// app/page.tsx (Server Component)
export default async function Page() {
  return <ClientCard />; // Pass only serializable props
}

// components/client-card.tsx (Client Component)
"use client";
export function ClientCard() {
  const handleClick = () => console.log("clicked"); // Client function
  
  return <div onClick={handleClick}>Click me</div>; // ✅ Event handler in client
}
```

### 3. Safe Patterns

**Passing data is OK:**
```tsx
// Server Component
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent data={data} />; // ✅ Serializable data
}
```

**Using href for navigation:**
```tsx
// Server Component
export default function Page() {
  return <Link href="/target">Navigate</Link>; // ✅ href is serializable
}
```

## Testing Steps

1. **Clear all caches:**
   ```bash
   npm run dev
   ```

2. **Hard refresh browser:**
   - Chrome/Edge: `Ctrl + Shift + R` or `Ctrl + F5`
   - Clear browser cache if needed

3. **Check for errors:**
   - Open browser console
   - Navigate to `http://localhost:3000`
   - Look for any React/Next.js errors

4. **Monitor Sentry:**
   - Check Sentry dashboard for new errors
   - Error should no longer appear

## Additional Notes

- Always clear cache when removing components that had event handlers
- Use `"use client"` directive at the top of files that need event handlers
- Server Components (default) can only pass serializable props
- Consider using Server Actions for form submissions instead of event handlers

## References

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)

